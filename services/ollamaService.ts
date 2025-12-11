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
 * Chat completion using Ollama
 */
export const chatWithOllama = async (
    prompt: string,
    model: string = 'llama3.2:1b',
    systemPrompt?: string
): Promise<string> => {
    try {
        const baseUrl = await getOllamaUrl();

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
