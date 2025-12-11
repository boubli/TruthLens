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
const getOllamaUrls = async (): Promise<{ primary: string; fallback?: string }> => {
    try {
        const settings = await getSystemSettings();
        return {
            primary: settings.apiKeys?.ollamaUrl || DEFAULT_OLLAMA_URL,
            fallback: settings.apiKeys?.ollamaFallbackUrl
        };
    } catch (e) {
        console.warn('[Ollama] Could not fetch settings, using default URL');
        return { primary: DEFAULT_OLLAMA_URL };
    }
};

/**
 * Helper to execute an Ollama request with fallback to secondary URL
 */
const executeWithFallback = async <T>(
    operationName: string,
    operation: (baseUrl: string) => Promise<T>
): Promise<T> => {
    const urls = await getOllamaUrls();

    // 1. Try Primary
    try {
        console.log(`[Ollama] ${operationName} -> Primary: ${urls.primary}`);
        return await operation(urls.primary);
    } catch (primaryError: any) {
        console.warn(`[Ollama] Primary failed: ${primaryError.message}`);

        // 2. Try Fallback if available
        if (urls.fallback) {
            console.log(`[Ollama] ${operationName} -> ⚠️ Switching to Fallback: ${urls.fallback}`);
            try {
                return await operation(urls.fallback);
            } catch (fallbackError: any) {
                console.error(`[Ollama] Fallback also failed: ${fallbackError.message}`);
                throw fallbackError; // Throw final error
            }
        }

        throw primaryError; // No fallback, throw original error
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
        const defaultModel = settings.apiKeys?.defaultOllamaModel;
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

        // 3. Use Administrator's Default Preference if Valid
        if (defaultModel && enabledModels[defaultModel]) {
            return defaultModel;
        }

        // 4. Return best available model
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
    return executeWithFallback('Chat', async (baseUrl) => {
        const preferredModel = await getPreferredModel(model);
        const messages: OllamaMessage[] = [];

        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const response = await axios.post<OllamaResponse>(
            `${baseUrl}/api/chat`,
            { model: preferredModel, messages, stream: false },
            { timeout: 60000 }
        );

        if (response.data.message?.content) return response.data.message.content;
        throw new Error('Empty response from Ollama');
    });
};

/**
 * Chat completion using Ollama with full history (for AI Chat)
 */
export const chatWithOllamaMessages = async (
    messages: { role: string; content: string }[],
    model: string = 'llama3.2:1b'
): Promise<string> => {
    return executeWithFallback('Chat History', async (baseUrl) => {
        const response = await axios.post<OllamaResponse>(
            `${baseUrl}/api/chat`,
            { model, messages, stream: false },
            { timeout: 60000 }
        );

        if (response.data.message?.content) return response.data.message.content;
        throw new Error('Empty response from Ollama');
    });
};

/**
 * Simple generate endpoint (non-chat)
 */
export const generateWithOllama = async (
    prompt: string,
    model: string = 'llama3.2:1b'
): Promise<string> => {
    return executeWithFallback('Generate', async (baseUrl) => {
        const response = await axios.post(
            `${baseUrl}/api/generate`,
            { model, prompt, stream: false },
            { timeout: 60000 }
        );
        return response.data.response || '';
    });
};

/**
 * List available models
 */
export const listOllamaModels = async (): Promise<string[]> => {
    try {
        return await executeWithFallback('List Models', async (baseUrl) => {
            const response = await axios.get(`${baseUrl}/api/tags`);
            return response.data.models?.map((m: any) => m.name) || [];
        });
    } catch (error) {
        return [];
    }
};

/**
 * Check if Ollama is available
 */
export const checkOllamaHealth = async (): Promise<boolean> => {
    try {
        return await executeWithFallback('Health Check', async (baseUrl) => {
            const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
            return response.status === 200;
        });
    } catch (error) {
        return false;
    }
};
