// User subscription and tier types

export type UserTier = 'free' | 'plus' | 'pro' | 'ultimate';

export interface UserSubscription {
    tier: UserTier;
    startDate: Date;
    endDate: Date | null; // null means lifetime/no expiry
    autoRenew: boolean;
}

export interface DietaryPreferences {
    isKeto: boolean;
    isVegan: boolean;
    isDiabetic: boolean;
    lowSodium: boolean;
    glutenFree: boolean;
    isHalal: boolean;
    // Granular Preferences
    allergens: string[];        // e.g., ["Peanuts", "Shellfish"]
    avoidIngredients: string[]; // e.g., ["Sulfates", "Palm Oil"]
    healthGoals: string[];      // e.g., ["High Protein", "Hair Growth"]
}

export interface UserPreferences {
    language?: string;
    location?: string; // For PC Builder pricing (e.g., "USA", "UK", "Canada")
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    role?: 'admin' | 'user';
    subscription: UserSubscription;
    dietaryPreferences: DietaryPreferences;
    preferences?: UserPreferences;
    customApiKeys?: import('./aiChat').UserApiKeys;
    createdAt: Date;
    hasSeenWelcome?: boolean;
    hasBetaAccess?: boolean; // Manual override for beta features
}

// Default values for new users
export const DEFAULT_SUBSCRIPTION: UserSubscription = {
    tier: 'free',
    startDate: new Date(),
    endDate: null,
    autoRenew: false,
};

export const DEFAULT_DIETARY_PREFERENCES: DietaryPreferences = {
    isKeto: false,
    isVegan: false,
    isDiabetic: false,
    lowSodium: false,
    glutenFree: false,
    isHalal: false,
    allergens: [],
    avoidIngredients: [],
    healthGoals: [],
};

// Feature flags based on tier
export interface TierFeatures {
    dailyScanLimit: number; // -1 for unlimited
    multiScanLimit: number; // 1 for single, >1 for multi
    historyLimit: number;   // -1 for unlimited
    recommendationLimit: number; // -1 for unlimited

    // AI Features
    aiAnalysis: 'basic' | 'advanced' | 'premium';
    smartGrading: boolean; // Basic vs Full could be handled by aiAnalysis level, keeping bool for simple checks for now
    aiTruthDetector: boolean; // Full truth detection

    // Utilities
    exportFormats: ('pdf' | 'csv' | 'excel')[];
    fastLane: boolean; // Processing speed
    adsEnabled: boolean;

    // Premium Extras
    customAlerts: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    betaAccess: boolean;

    // NEW: Premium Feature Access
    globalSearch: boolean;       // Global product database search
    visualSearch: boolean;       // Search by photo/image
    mealPlanning: boolean;       // AI meal planning
    aiChat: boolean;             // AI conversational assistant
    aiChatLimit: number;         // Daily AI chat messages (-1 unlimited)
    productCompare: number;      // Max products to compare (0 = disabled)
    ecoScore: boolean;           // Sustainability analysis
    gamification: boolean;       // Quests and achievements
    pcBuilder: boolean;          // PC Geek Builder access
}

export const TIER_CONFIG: Record<UserTier, TierFeatures> = {
    free: {
        dailyScanLimit: 5,
        multiScanLimit: 1, // No multi-scan
        historyLimit: 10,
        recommendationLimit: 3, // Limited recommendations
        aiAnalysis: 'basic',
        smartGrading: false,
        aiTruthDetector: false,
        exportFormats: [],
        fastLane: false,
        adsEnabled: true,
        customAlerts: false,
        prioritySupport: false,
        whiteLabel: false,
        betaAccess: false,
        // Premium Features
        globalSearch: false,
        visualSearch: false,
        mealPlanning: false,
        aiChat: false,
        aiChatLimit: 0,
        productCompare: 0,
        ecoScore: false,
        gamification: true,
        pcBuilder: false
    },
    plus: {
        dailyScanLimit: 20,
        multiScanLimit: 3,
        historyLimit: 50,
        recommendationLimit: 10, // More recommendations
        aiAnalysis: 'advanced',
        smartGrading: true, // Basic version
        aiTruthDetector: false, // Limited or none
        exportFormats: ['csv'],
        fastLane: true, // Priority but not instant
        adsEnabled: false, // Minimal ads -> setting to false for cleaner codebase, can allow minimal if needed
        customAlerts: true,
        prioritySupport: false,
        whiteLabel: false,
        betaAccess: false,
        // Premium Features
        globalSearch: true,
        visualSearch: false,
        mealPlanning: false,
        aiChat: true,
        aiChatLimit: 10,
        productCompare: 2,
        ecoScore: false,
        gamification: true,
        pcBuilder: false
    },
    pro: {
        dailyScanLimit: -1, // Unlimited
        multiScanLimit: 10,
        historyLimit: -1,
        recommendationLimit: -1, // Unlimited
        aiAnalysis: 'premium',
        smartGrading: true,
        aiTruthDetector: true,
        exportFormats: ['pdf', 'csv', 'excel'],
        fastLane: true,
        adsEnabled: false,
        customAlerts: true,
        prioritySupport: true,
        whiteLabel: false,
        betaAccess: false,
        // Premium Features
        globalSearch: true,
        visualSearch: true,
        mealPlanning: true,
        aiChat: true,
        aiChatLimit: -1,
        productCompare: 5,
        ecoScore: true,
        gamification: true,
        pcBuilder: true
    },
    ultimate: {
        dailyScanLimit: -1,
        multiScanLimit: 99, // Effectively unlimited
        historyLimit: -1,
        recommendationLimit: -1, // Unlimited
        aiAnalysis: 'premium',
        smartGrading: true,
        aiTruthDetector: true,
        exportFormats: ['pdf', 'csv', 'excel'],
        fastLane: true,
        adsEnabled: false,
        customAlerts: true,
        prioritySupport: true,
        whiteLabel: true,
        betaAccess: true,
        // Premium Features
        globalSearch: true,
        visualSearch: true,
        mealPlanning: true,
        aiChat: true,
        aiChatLimit: -1,
        productCompare: -1,
        ecoScore: true,
        gamification: true,
        pcBuilder: true
    }
};

export const FREE_TIER_FEATURES = TIER_CONFIG.free; // Legacy compact
export const PRO_TIER_FEATURES = TIER_CONFIG.pro;   // Legacy compact

export function getTierFeatures(tier: UserTier): TierFeatures {
    return TIER_CONFIG[tier] || TIER_CONFIG.free;
}
