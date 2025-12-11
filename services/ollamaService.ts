/**
 * Ollama Service
 * Uses a self-hosted Ollama instance for LLM inference (free, unlimited)
 */

import axios from 'axios';
import { getSystemSettings } from './systemService';

// Default Ollama URL (can be overridden in Admin settings)
const DEFAULT_OLLAMA_URL = 'http://20.199.129.203:11434';

export interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OllamaResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

/**
 * Get the configured Ollama URL from Admin settings or use default
 */
const getOllamaUrl = async (): Promise<string> => {
    try {
        const settings = await getSystemSettings();
        return settings.apiKeys?.ollamaUrl || DEFAULT_OLLAMA_URL;
    } catch (e) {
        console.warn('[Ollama] Could not fetch settings, using default URL');
        return DEFAULT_OLLAMA_URL;
    }
};

/**
 * Get preferred model based on System Settings
 * Validates if the requested model is enabled by Admin.
 * If not, or if no model requested, returns the first enabled model.
 */
export const getPreferredModel = async (requestedModel?: string): Promise<string> => {
    try {
        const settings = await getSystemSettings();
        const enabledModels = settings.apiKeys?.ollamaModels || {};
        const availableModels = Object.keys(enabledModels).filter(m => enabledModels[m]);

        // Default fallback if no config exists yet
        const DEFAULT_MODEL = 'llama3.2:1b';

        // 1. If specific model requested and enabled, use it
        if (requestedModel && enabledModels[requestedModel]) {
            return requestedModel;
        }

        // 2. If requested model is NOT enabled, try to find a fallback
        if (requestedModel && !enabledModels[requestedModel]) {
            console.warn(`[Ollama] Requested model '${requestedModel}' is disabled. Finding fallback...`);
        }

        // 3. Return best available model
        if (availableModels.length > 0) {
            // Priority list for smart defaults
            const priority = ['llama3.2:1b', 'qwen:1.8b', 'gemma:2b', 'tinyllama'];
            for (const p of priority) {
                if (enabledModels[p]) return p;
            }
            return availableModels[0]; // Any enabled model
        }

        return DEFAULT_MODEL; // Fallback to hardcoded default if nothing configured
    } catch (e) {
        return requestedModel || 'llama3.2:1b';
    }
};

/**
 * Chat completion using Ollama
 */
export const chatWithOllama = async (
    prompt: string,
    model?: string,
    systemPrompt?: string
): Promise<string> => {
    try {
        const baseUrl = await getOllamaUrl();
        const preferredModel = await getPreferredModel(model);


        const messages: OllamaMessage[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        messages.push({ role: 'user', content: prompt });

        console.log(`[Ollama] Sending request to ${baseUrl} with model ${model}`);

        const response = await axios.post<OllamaResponse>(
            `${baseUrl}/api/chat`,
            {
                model: model,
                messages: messages,
                stream: false
            },
            {
                timeout: 60000, // 60 second timeout (LLM can be slow on CPU)
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.message?.content) {
            console.log(`[Ollama] Response received (${response.data.message.content.length} chars)`);
            return response.data.message.content;
        }

        throw new Error('Empty response from Ollama');
    } catch (error: any) {
        console.error('[Ollama] Error:', error.message);
        throw error;
    }
};

/**
 * Chat completion using Ollama with full history (for AI Chat)
 */
export const chatWithOllamaMessages = async (
    messages: { role: string; content: string }[],
    model: string = 'llama3.2:1b'
): Promise<string> => {
    try {
        const baseUrl = await getOllamaUrl();

        console.log(`[Ollama] Sending chat request to ${baseUrl} with model ${model}`);

        const response = await axios.post<OllamaResponse>(
            `${baseUrl}/api/chat`,
            {
                model: model,
                messages: messages,
                stream: false
            },
            {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.message?.content) {
            console.log(`[Ollama] Response received (${response.data.message.content.length} chars)`);
            return response.data.message.content;
        }

        throw new Error('Empty response from Ollama');
    } catch (error: any) {
        console.error('[Ollama] Chat Error:', error.message);
        throw error;
    }
};

/**
 * Simple generate endpoint (non-chat)
 */
export const generateWithOllama = async (
    prompt: string,
    model: string = 'llama3.2:1b'
): Promise<string> => {
    try {
        const baseUrl = await getOllamaUrl();

        const response = await axios.post(
            `${baseUrl}/api/generate`,
            {
                model: model,
                prompt: prompt,
                stream: false
            },
            {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.response || '';
    } catch (error: any) {
        console.error('[Ollama] Generate error:', error.message);
        throw error;
    }
};

/**
 * List available models
 */
export const listOllamaModels = async (): Promise<string[]> => {
    try {
        const baseUrl = await getOllamaUrl();
        const response = await axios.get(`${baseUrl}/api/tags`);
        return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
        console.error('[Ollama] Error listing models:', error);
        return [];
    }
};

/**
 * Check if Ollama is available
 */
export const checkOllamaHealth = async (): Promise<boolean> => {
    try {
        const baseUrl = await getOllamaUrl();
        const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        return false;
    }
};
