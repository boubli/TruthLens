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
 * Execute a Proxy Request (Client-Side Only)
 */
const executeProxyRequest = async <T>(endpoint: string, payload: any): Promise<T> => {
    try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();

        if (!token) throw new Error('User must be logged in');

        const response = await axios.post('/api/ollama', {
            endpoint,
            payload
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return response.data as T;
    } catch (error: any) {
        console.error('[Ollama Service] Proxy Error:', error);
        throw error;
    }
}

/**
 * Helper to execute an Ollama request with fallback to secondary URL
 * Handles "Proxy Routing" for Client-Side execution to avoid Mixed Content errors (HTTPS -> HTTP)
 */
const executeWithFallback = async <T>(
    operationName: string,
    operation: (baseUrl: string) => Promise<T>
): Promise<T> => {

    // ---------------------------------------------------------------------------
    // OPTIMIZATION: Environment-Aware Routing
    // ---------------------------------------------------------------------------
    if (typeof window !== 'undefined') {
        // [CLIENT-SIDE] -> Go through Secure Proxy (/api/ollama)
        // This prevents "Mixed Content" blocks on Vercel (HTTPS)
        // console.log(`[Ollama] Client-Side Detected. Routing '${operationName}' via /api/ollama Proxy.`);

        try {
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const token = await auth.currentUser?.getIdToken();

            if (!token) throw new Error('Authentication required for AI features');

            // We must throw here to ensure the caller (chatWithOllama, etc.) 
            // knows to use the proxy path. But since we can't easily "redirect" the closure 'operation',
            // the callers (chatWithOllama etc) must handle the env check themselves using executeProxyRequest.
            // This fallback is only if a caller FORGOT to check env.
            throw new Error('Direct client-side execution not supported. Use executeProxyRequest.');
        } catch (e: any) {
            // Fall through? No, assume caller handles proxy.
        }
    }

    // [SERVER-SIDE] -> Direct Connection (Fastest)
    const urls = await getOllamaUrls();

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
 * Task-based model routing configuration
 * Maps task types to preferred models for optimal performance
 */
export const MODEL_ROUTING: Record<string, string> = {
    'analysis': 'phi',           // Product/ingredient analysis - needs reasoning
    'chat': 'stablelm2',         // AI Chat Assistant - conversational
    'multilingual': 'qwen:1.8b', // French/Arabic translations
    'quick': 'tinyllama',        // Fast suggestions, simple tasks
    'general': 'llama3.2:1b'     // Default fallback
};

/**
 * Get the best model for a specific task type
 * Validates model is enabled, falls back to alternatives if not
 */
export const getModelForTask = async (taskType: keyof typeof MODEL_ROUTING): Promise<string> => {
    const preferredModel = MODEL_ROUTING[taskType] || MODEL_ROUTING['general'];

    try {
        const settings = await getSystemSettings();
        const enabledModels = settings.apiKeys?.ollamaModels || {};

        // If preferred model is enabled, use it
        if (enabledModels[preferredModel]) {
            console.log(`[Ollama] Task '${taskType}' -> Using preferred model: ${preferredModel}`);
            return preferredModel;
        }

        // Fallback: Find any enabled model from routing table
        for (const [, model] of Object.entries(MODEL_ROUTING)) {
            if (enabledModels[model]) {
                console.log(`[Ollama] Task '${taskType}' -> Fallback to: ${model}`);
                return model;
            }
        }

        // Ultimate fallback
        return await getPreferredModel();
    } catch (e) {
        console.warn(`[Ollama] getModelForTask error, using default: ${preferredModel}`);
        return preferredModel;
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
    const preferredModel = await getPreferredModel(model);
    const messages: OllamaMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    // Client-Side Optimization: Use Proxy
    if (typeof window !== 'undefined') {
        const data = await executeProxyRequest<OllamaResponse>('/api/chat', {
            model: preferredModel,
            messages,
            stream: false
        });
        if (data.message?.content) return data.message.content;
        throw new Error('Empty response from Ollama Proxy');
    }

    return executeWithFallback('Chat', async (baseUrl) => {
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
    // Client-Side Optimization: Use Proxy
    if (typeof window !== 'undefined') {
        const data = await executeProxyRequest<OllamaResponse>('/api/chat', {
            model,
            messages,
            stream: false
        });
        if (data.message?.content) return data.message.content;
        throw new Error('Empty response from Ollama Proxy');
    }

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
    // Client-Side Optimization: Use Proxy
    if (typeof window !== 'undefined') {
        const data = await executeProxyRequest<{ response: string }>('/api/generate', {
            model,
            prompt,
            stream: false
        });
        return data.response || '';
    }

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

// ============================================
// TASK-SPECIFIC CONVENIENCE FUNCTIONS
// ============================================

/**
 * Chat optimized for product/ingredient analysis
 * Uses 'phi' model for reasoning capabilities
 */
export const chatForAnalysis = async (prompt: string, systemPrompt?: string): Promise<string> => {
    const model = await getModelForTask('analysis');
    return chatWithOllama(prompt, model, systemPrompt);
};

/**
 * Chat optimized for AI Assistant conversations
 * Uses 'stablelm2' for natural conversation flow
 */
export const chatForAssistant = async (prompt: string, systemPrompt?: string): Promise<string> => {
    const model = await getModelForTask('chat');
    return chatWithOllama(prompt, model, systemPrompt);
};

/**
 * Quick responses for simple tasks
 * Uses 'tinyllama' for fast inference
 */
export const chatForQuick = async (prompt: string): Promise<string> => {
    const model = await getModelForTask('quick');
    return chatWithOllama(prompt, model);
};

/**
 * Multilingual tasks (French, Arabic, etc.)
 * Uses 'qwen:1.8b' for language capabilities
 */
export const chatForMultilingual = async (prompt: string, systemPrompt?: string): Promise<string> => {
    const model = await getModelForTask('multilingual');
    return chatWithOllama(prompt, model, systemPrompt);
};
