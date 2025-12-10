// AI Chat types for the BYOK (Bring Your Own Key) chat feature

export type AIProvider = 'groq' | 'gemini' | 'ollama';

export type AILanguage = 'en' | 'ar' | 'fr' | 'es' | 'de' | 'zh' | 'ja' | 'ko' | 'pt' | 'ru' | 'hi' | 'it' | 'tr' | 'nl';

export interface AIChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export type AIChatErrorCode = 'MISSING_KEY' | 'INVALID_KEY' | 'API_ERROR' | 'RATE_LIMIT';

export interface AIChatError {
    code: AIChatErrorCode;
    message: string;
    provider?: AIProvider;
}

export interface UserApiKeys {
    groq?: string;
    gemini?: string;
    ollama?: string;
    preferredProvider?: AIProvider;
    preferredLanguage?: AILanguage;
}

// Provider configuration
export const AI_PROVIDERS: Record<AIProvider, { name: string; color: string; icon: string }> = {
    groq: {
        name: 'Groq',
        color: '#F55036',
        icon: '⚡'
    },
    gemini: {
        name: 'Google Gemini',
        color: '#4285F4',
        icon: '✨'
    },
    ollama: {
        name: 'Azure AI (Self-Hosted)',
        color: '#0078D4',
        icon: '☁️'
    }
};

// Language configuration
export const AI_LANGUAGES: Record<AILanguage, { name: string; nativeName: string; flag: string }> = {
    en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
    ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' }
};
