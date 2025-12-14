import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { getSystemSettings } from './systemService';
import { chatWithOllamaMessages } from './ollamaService';
import { AIProvider, AILanguage, AIChatError, UserApiKeys, AI_LANGUAGES } from '@/types/aiChat';
import { UserTier } from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Get user's saved API keys from Firestore
 */
export const getUserApiKeys = async (userId: string): Promise<UserApiKeys> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                groq: data.customApiKeys?.groq || undefined,
                gemini: data.customApiKeys?.gemini || undefined,
                preferredProvider: data.customApiKeys?.preferredProvider || 'groq',
                preferredLanguage: data.customApiKeys?.preferredLanguage || 'en'
            };
        }
        return { preferredProvider: 'groq', preferredLanguage: 'en' };
    } catch (error) {
        console.error('[AI_CHAT] Error fetching user API keys:', error);
        return { preferredProvider: 'groq' };
    }
};

/**
 * Save user's API key to Firestore
 */
export const saveUserApiKey = async (
    userId: string,
    provider: AIProvider,
    apiKey: string
): Promise<void> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await setDoc(userRef, {
            customApiKeys: {
                [provider]: apiKey
            }
        }, { merge: true });
        console.log(`[AI_CHAT] Saved ${provider} API key for user ${userId}`);
    } catch (error) {
        console.error('[AI_CHAT] Error saving API key:', error);
        throw error;
    }
};

/**
 * Delete user's API key from Firestore
 */
export const deleteUserApiKey = async (
    userId: string,
    provider: AIProvider
): Promise<void> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, {
            [`customApiKeys.${provider}`]: deleteField()
        });
        console.log(`[AI_CHAT] Deleted ${provider} API key for user ${userId}`);
    } catch (error) {
        console.error('[AI_CHAT] Error deleting API key:', error);
        throw error;
    }
};

/**
 * Save user's preferred provider
 */
export const savePreferredProvider = async (
    userId: string,
    provider: AIProvider
): Promise<void> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await setDoc(userRef, {
            customApiKeys: {
                preferredProvider: provider
            }
        }, { merge: true });
    } catch (error) {
        console.error('[AI_CHAT] Error saving preferred provider:', error);
        throw error;
    }
};

/**
 * Save user's preferred language
 */
export const savePreferredLanguage = async (
    userId: string,
    language: AILanguage
): Promise<void> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await setDoc(userRef, {
            customApiKeys: {
                preferredLanguage: language
            }
        }, { merge: true });
        console.log(`[AI_CHAT] Saved preferred language ${language} for user ${userId}`);
    } catch (error) {
        console.error('[AI_CHAT] Error saving preferred language:', error);
        throw error;
    }
};

/**
 * Determine if user must provide their own key based on tier
 */
export const requiresOwnKey = (tier: UserTier): boolean => {
    return tier === 'free' || tier === 'plus';
};

/**
 * Get the appropriate API key based on user tier
 */
export const resolveApiKey = async (
    userId: string,
    tier: UserTier,
    provider: AIProvider
): Promise<{ key: string; source: 'user' | 'platform' }> => {
    // Azure AI (Ollama) is self-hosted and free
    if (provider === 'ollama') {
        return { key: 'azure-internal', source: 'platform' };
    }

    // 1. Check if user has a custom key saved (Prioritize this for ALL tiers)
    // This allows Pro users to override the platform key with their own if desired
    const userKeys = await getUserApiKeys(userId);
    const userKey = userKeys[provider];

    if (userKey) {
        return { key: userKey, source: 'user' };
    }

    // 2. Pro and Ultimate users fallback to platform key
    if (!requiresOwnKey(tier)) {
        const settings = await getSystemSettings();
        // @ts-ignore
        const platformKey = settings.apiKeys?.[provider as keyof typeof settings.apiKeys];

        if (!platformKey) {
            const error: AIChatError = {
                code: 'API_ERROR',
                message: `Platform API key for ${provider} is not configured in Admin Settings.`,
                provider
            };
            throw error;
        }

        return { key: platformKey as string, source: 'platform' };
    }

    // 3. Free/Plus users must have a key (and we already checked above)
    // If we reached here, they don't have a key
    const error: AIChatError = {
        code: 'MISSING_KEY',
        message: `Please add your ${provider === 'groq' ? 'Groq' : 'Gemini'} API key in Settings to use AI Chat.`,
        provider
    };
    throw error;
};

/**
 * Send a chat message to the AI provider
 */
export const sendAIChatMessage = async (
    userId: string,
    tier: UserTier,
    message: string,
    provider: AIProvider,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
    language: AILanguage = 'en'
): Promise<string> => {
    // Resolve the API key
    const { key, source } = await resolveApiKey(userId, tier, provider);

    // Get System Settings for configured models
    const settings = await getSystemSettings();
    const models = settings.apiKeys?.models;
    const configuredModelString = models?.[provider as keyof typeof models] || '';

    // Determine target models to try in order
    let targetModels: string[] = [];

    if (configuredModelString) {
        targetModels = configuredModelString.split(',').map(m => m.trim()).filter(m => m.length > 0);
    } else {
        // Defaults
        if (provider === 'gemini') targetModels = ['gemini-1.5-pro', 'gemini-1.5-flash'];
        else if (provider === 'groq') targetModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
        else if (provider === 'deepseek') targetModels = ['deepseek-chat'];
        else if (provider === 'openrouter') targetModels = [settings.apiKeys?.openrouterModel || 'meta-llama/llama-3.1-8b-instruct:free'];
    }


    // Get language name for prompt
    const languageInfo = AI_LANGUAGES[language];
    const languageName = languageInfo?.name || 'English';

    // Build messages array with history
    const messages = [
        {
            role: 'system' as const,
            content: `You are TruthLens AI 🥗💻, a versatile and intelligent assistant specializing in TWO main areas:
1. FOOD & NUTRITION: You help users understand food labels, ingredients, and healthy choices.
2. TECH & HARDWARE: You are an expert in PC building, component specs, and troubleshooting technical issues.

You are also a general helper for this application. If a user asks "how to reset password" or "how to use the scanner", guide them clearly.

RESPONSE STYLE:
- Use relevant emojis naturally (🥗🍎 for food, 💻⚡ for tech).
- Be conversational, warm, and encouraging.
- Vary your wording - never repeat the same phrases.
- Keep responses concise but informative.
- Use bullet points and formatting for clarity.

LANGUAGE: You MUST respond in ${languageName}. All your responses should be written in ${languageName}.

IDENTITY KNOWLEDGE:
- TruthLens: An AI-powered app that helps users analyze products (Food & Tech) and build PCs.
- Creator: Youssef Boubli (known as TRADMSS).
- PC Builder: If asked about building a PC, offer to help select components or explain the "PC Builder" feature in the app.

When users ask about TruthLens (any spelling variation) or who made/created/built it, share this info naturally using your own creative wording.`
        },
        ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        })),
        { role: 'user' as const, content: message }
    ];

    const attemptCall = async (modelToUse?: string) => {
        if (provider === 'groq') {
            return await callGroqAPI(key, messages, modelToUse);
        } else if (provider === 'ollama') {
            return await chatWithOllamaMessages(messages); // Ollama handles its own model config via settings
        } else if (provider === 'deepseek') {
            return await callDeepSeekAPI(key, messages, modelToUse);
        } else if (provider === 'openrouter') {
            return await callOpenRouterAPI(key, messages, modelToUse);
        } else {
            return await callGeminiAPI(key, messages, modelToUse);
        }
    };

    try {
        // Generic fallback for Ollama/Others if empty
        if (targetModels.length === 0) {
            return await attemptCall();
        }

        // Execute fallback loop
        let lastError: any = null;
        for (const model of targetModels) {
            try {
                return await attemptCall(model);
            } catch (error: any) {
                console.warn(`[AI_FALLBACK] Model ${model} failed. Error:`, error.message || error);
                lastError = error;

                // Stop on Auth Error
                if (error?.code === 'INVALID_KEY' || error?.status === 401 || error?.status === 403 || error?.isInvalidKey) {
                    throw error;
                }
            }
        }
        if (lastError) throw lastError;
        throw new Error('All models failed.');
    } catch (error: any) {
        // Handle specific API errors
        if (error?.code) {
            throw error; // Already formatted AIChatError
        }

        // Check for isInvalidKey flag (from Gemini parser)
        if (error?.isInvalidKey) {
            const chatError: AIChatError = {
                code: 'INVALID_KEY',
                message: `Your ${provider === 'groq' ? 'Groq' : provider === 'ollama' ? 'Azure AI' : 'Gemini'} API key is invalid. Please update it in Settings.`,
                provider
            };
            throw chatError;
        }

        // Check for authentication errors (401 for Groq, 400/403 for Gemini)
        if (error?.status === 401 ||
            error?.status === 400 ||
            error?.status === 403 ||
            error?.message?.includes('401') ||
            error?.message?.includes('invalid') ||
            error?.message?.includes('invalid') ||
            error?.message?.includes('API key') ||
            error?.message?.includes('authentication')) {
            const chatError: AIChatError = {
                code: 'INVALID_KEY',
                message: `Your ${provider === 'groq' ? 'Groq' : provider === 'deepseek' ? 'DeepSeek' : provider === 'ollama' ? 'Azure AI' : 'Gemini'} API key is invalid or expired. Please update it in Settings.`,
                provider
            };
            throw chatError;
        }

        // Check for rate limit
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('rate')) {
            const chatError: AIChatError = {
                code: 'RATE_LIMIT',
                message: 'Rate limit exceeded. Please wait a moment and try again.',
                provider
            };
            throw chatError;
        }

        // Check for Ollama Model Not Found (404)
        if (provider === 'ollama' && (error?.status === 404 || error?.message?.includes('404'))) {
            const chatError: AIChatError = {
                code: 'API_ERROR',
                message: `The selected AI model is not installed on the Azure server. Please go to Admin Settings > AI & Models to select an available model.`,
                provider
            };
            throw chatError;
        }

        // Generic API error - don't show raw messages
        const genericError: AIChatError = {
            code: 'API_ERROR',
            message: 'An error occurred while communicating with the AI. Please try again.',
            provider
        };
        throw genericError;
    }
};

/**
 * Call Groq API
 */
const callGroqAPI = async (
    apiKey: string,
    messages: { role: string; content: string }[],
    model: string = 'llama-3.3-70b-versatile'
): Promise<string> => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages,
            temperature: 0.7,
            max_tokens: 1024
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw { status: response.status, message: errorText };
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
};

/**
 * Call Gemini API
 */
const callGeminiAPI = async (
    apiKey: string,
    messages: { role: string; content: string }[],
    model: string = 'gemini-1.5-flash'
): Promise<string> => {
    // Convert messages to Gemini format
    const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

    // Add system instruction to first user message if present
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg && contents.length > 0) {
        contents[0].parts[0].text = `${systemMsg.content}\n\n${contents[0].parts[0].text}`;
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024
                }
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        // Try to parse Gemini error JSON and extract clean message
        try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson?.error?.message || 'Unknown error';
            const errorStatus = errorJson?.error?.status || '';

            // Check for specific error types
            if (errorStatus === 'INVALID_ARGUMENT' ||
                errorMessage.includes('API key not valid') ||
                errorMessage.includes('invalid')) {
                throw { status: 400, message: 'API key is invalid', isInvalidKey: true };
            }

            throw { status: response.status, message: errorMessage };
        } catch (parseError: any) {
            // If it's our formatted error, rethrow it
            if (parseError.isInvalidKey) {
                throw parseError;
            }
            // Otherwise throw with raw text
            throw { status: response.status, message: errorText };
        }
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
};

/**
 * Call DeepSeek API
 */
const callDeepSeekAPI = async (
    apiKey: string,
    messages: { role: string; content: string }[],
    model: string = 'deepseek-chat'
): Promise<string> => {
    // Get Base URL from settings
    const settings = await getSystemSettings();
    const baseUrl = settings.apiKeys?.deepseekBaseUrl || 'https://api.deepseek.com';

    // Ensure URL ends with /chat/completions or /v1/chat/completions if it's Ollama
    // If it's pure DeepSeek API: https://api.deepseek.com/chat/completions
    // If it's Ollama: http://ip:11434/v1/chat/completions
    let endpoint = baseUrl;
    if (!endpoint.endsWith('/chat/completions')) {
        if (endpoint.endsWith('/v1')) {
            endpoint = `${endpoint}/chat/completions`;
        } else if (endpoint.endsWith('/')) {
            endpoint = `${endpoint}chat/completions`; // Aggressive assumption, usually needs /v1
        } else {
            // If it looks like a root URL (e.g. port 11434), append /v1/chat/completions
            // DeepSeek official is special, but for self-hosted we assume OpenAI compatibility
            if (endpoint.includes('api.deepseek.com')) {
                endpoint = `${endpoint}/chat/completions`;
            } else {
                endpoint = `${endpoint}/v1/chat/completions`;
            }
        }
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw { status: response.status, message: errorText };
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
};

/**
 * Call OpenRouter API
 */
const callOpenRouterAPI = async (
    apiKey: string,
    messages: { role: string; content: string }[],
    model?: string
): Promise<string> => {
    // Get settings for model configuration
    const settings = await getSystemSettings();
    const defaultModel = settings.apiKeys?.openrouterModel || 'meta-llama/llama-3.1-8b-instruct:free';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://truthlens.app',
            'X-Title': 'TruthLens AI'
        },
        body: JSON.stringify({
            model: model || defaultModel,
            messages,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw { status: response.status, message: errorText };
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
};
/**
 * Test an API key to verify it works
 */
export const testApiKey = async (provider: AIProvider, apiKey: string): Promise<boolean> => {
    try {
        const testMessage = [{ role: 'user', content: 'Hi' }];

        if (provider === 'groq') {
            await callGroqAPI(apiKey, testMessage, 'llama-3.1-8b-instant');
        } else if (provider === 'gemini') {
            await callGeminiAPI(apiKey, testMessage, 'gemini-1.5-flash');
        } else if (provider === 'deepseek') {
            // Use default model for test
            await callDeepSeekAPI(apiKey, testMessage);
        } else if (provider === 'openrouter') {
            await callOpenRouterAPI(apiKey, testMessage);
        } else if (provider === 'ollama') {
            // Ollama is always "valid" if the server is reachable, but here we just return true
            // because key validation isn't really applicable unless we're testing the URL connection which is separate
            return true;
        }

        return true;
    } catch (error) {
        console.error(`[AI_TEST] ${provider} key validation failed:`, error);
        return false;
    }
};
