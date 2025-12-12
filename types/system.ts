
import { UserTier, TierFeatures } from './user';

export interface TierPricing {
    monthly: number;
    lifetime: number;
    currency: string;
}

export interface TierDefinition {
    id: UserTier;
    name: string;
    description: string;
    pricing: TierPricing;
    features: TierFeatures;
    metadata: {
        isPopular?: boolean;
        originalPriceMonthly?: number;
        originalPriceLifetime?: number;
    }
}

export type SystemTierConfig = Record<UserTier, TierDefinition>;

// Extended System Settings
export interface ExtendedSystemSettings {
    maintenanceMode: boolean;
    betaAccess: boolean;
    apiKeys?: {
        gemini?: string;
        groq?: string;
        openai?: string;
        deepseek?: string;
        cerebras?: string;
        sambanova?: string;
        serpapi?: string;
        searxngUrl?: string; // Self-hosted SearXNG instance URL
        ollamaUrl?: string; // Self-hosted Ollama instance URL
        ollamaFallbackUrl?: string; // Secondary/Backup Ollama Instance URL
        ollamaModels?: Record<string, boolean>; // Enabled status for specific models
        defaultOllamaModel?: string; // The explicitly selected default model
        // GitHub Models API (for PC Builder / Grok-3)
        githubModelsToken?: string;       // GitHub PAT with models scope
        githubModelsModel?: string;       // Model to use (e.g., "openai/gpt-4.1")
        defaultPcBuilderLocation?: string; // Default location for price searches
        models?: {
            gemini?: string;
            groq?: string;
            openai?: string;
            deepseek?: string;
        };
    };
    tierConfig: SystemTierConfig;
    branding?: {
        faviconUrl?: string;
        appleTouchIconUrl?: string;
        androidIcon192Url?: string;
        androidIcon512Url?: string;
    };

    // Global Atmosphere (Manual Toggles - Multi-Selectable)
    globalEffects?: {
        snow: boolean;
        rain: boolean;
        leaves: boolean;
        confetti: boolean;
        christmas: boolean;
    };
    // Deprecated single-select
    // globalTheme?: string; 
    // globalThemeEnabled?: boolean;

    eventManager?: EventManagerConfig; // @deprecated: Use eventSchedule
    eventSchedule?: EventManagerConfig[]; // [NEW] List of future events
}

export interface EventManagerConfig {
    event_id: string;              // Unique ID (e.g., "NYE_2025")
    is_active_global: boolean;     // Master Switch

    // Theme Scheduling (UTC ISO Strings)
    // [REMOVED] general_theme_start/end - Now manual ONLY via globalTheme

    // Celebration Scheduling (UTC ISO Strings)
    celebration_music_start: string;
    celebration_climax_start: string; // [NEW] Explicit start for Fireworks
    celebration_music_end: string;

    // Attributes
    countdown_seconds: number;     // e.g., 10
    celebration_message: string;   // Main big text (e.g. "HAPPY NEW YEAR")

    // Explicit Message Timing
    climax_message_start?: string; // [NEW] When the big text appears
    climax_message_end?: string;   // [NEW] When the big text disappears

    special_message?: string;      // Secondary detailed message
    special_message_color?: string; // [NEW] e.g. "#ffffff" or "linear-gradient..."
    special_message_image_url?: string; // [NEW] Image displayed alongside special message
    special_message_start?: string; // [NEW] When the special message appears
    special_message_end?: string;   // [NEW] When the special message disappears

    music_file_url: string;        // Background Music URL to hosted audio

    // Explicit Effects per Phase
    // [REMOVED] theme_effect - Moved to global manual control
    climax_effect: 'fireworks' | 'confetti' | 'none' | string; // Phase B Effect


    // Deprecated but kept for type safety if needed temporarily
    // effect_type: ... (Removed)
}
