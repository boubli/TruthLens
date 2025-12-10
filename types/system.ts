
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
    };
    tierConfig: SystemTierConfig;
    branding?: {
        faviconUrl?: string;
        appleTouchIconUrl?: string;
        androidIcon192Url?: string;
        androidIcon512Url?: string;
    };
}
