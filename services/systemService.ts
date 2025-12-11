import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ExtendedSystemSettings, SystemTierConfig } from '@/types/system';
import { TIER_CONFIG } from '@/types/user';

const SETTINGS_COLLECTION = 'system';
const SETTINGS_DOC = 'settings';

// Map existing strict config to editable config
const DEFAULT_TIER_CONFIG: SystemTierConfig = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'Forever Free',
        pricing: { monthly: 0, lifetime: 0, currency: 'USD' },
        features: TIER_CONFIG.free,
        metadata: {}
    },
    plus: {
        id: 'plus',
        name: 'Plus',
        description: 'Advanced scanning for enthusiasts',
        pricing: { monthly: 3.99, lifetime: 19.99, currency: 'USD' },
        features: TIER_CONFIG.plus,
        metadata: { originalPriceLifetime: 39.99 }
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        description: 'For power users who need the truth',
        pricing: { monthly: 7.99, lifetime: 49.99, currency: 'USD' },
        features: TIER_CONFIG.pro,
        metadata: { isPopular: true, originalPriceLifetime: 99.99 }
    },
    ultimate: {
        id: 'ultimate',
        name: 'Ultimate',
        description: 'Unlimited everything for professionals',
        pricing: { monthly: 14.99, lifetime: 79.99, currency: 'USD' },
        features: TIER_CONFIG.ultimate,
        metadata: { originalPriceLifetime: 159.99 }
    }
};

export const DEFAULT_SETTINGS: ExtendedSystemSettings = {
    maintenanceMode: false,
    betaAccess: false,
    apiKeys: {},
    tierConfig: DEFAULT_TIER_CONFIG
};

/**
 * Get current system settings
 */
export const getSystemSettings = async (): Promise<ExtendedSystemSettings> => {
    try {
        const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            // Merge with default to ensure new fields (like tierConfig) exist if old doc
            return { ...DEFAULT_SETTINGS, ...snap.data() } as ExtendedSystemSettings;
        } else {
            // Initialize if missing
            await setDoc(ref, DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        }
    } catch (error) {
        console.error('Error fetching system settings:', error);
        return DEFAULT_SETTINGS;
    }
};

/**
 * Update system settings (Admin only)
 */
export const updateSystemSettings = async (settings: Partial<ExtendedSystemSettings>): Promise<void> => {
    try {
        console.log('[SYSTEM] Attempting to save settings:', settings);
        const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
        await setDoc(ref, settings, { merge: true });
        console.log('[SYSTEM] Settings saved successfully to Firebase!');
    } catch (error: any) {
        console.error('[SYSTEM] ❌ Error updating system settings:', error);
        throw error;
    }
};

/**
 * Subscribe to system settings changes
 */
export const subscribeToSystemSettings = (callback: (settings: ExtendedSystemSettings) => void) => {
    const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            // Deep merge safely or just spread
            const merged = { ...DEFAULT_SETTINGS, ...data } as ExtendedSystemSettings;
            console.log('[SYSTEM] Settings updated/synced');
            callback(merged);
        } else {
            console.log('[SYSTEM] No settings found, using defaults');
            callback(DEFAULT_SETTINGS);
        }
    });
};


/**
 * Public method to fetch event config + server time from API (for Frontend Time Sync)
 */
export const fetchEventConfigFromApi = async () => {
    try {
        const start = Date.now();
        const res = await fetch('/api/v1/event_config', { cache: 'no-store' });
        const end = Date.now();
        const data = await res.json();

        if (data.status === 'success') {
            return {
                ...data.data,
                latency: (end - start) / 2
            };
        }
        return null;
    } catch (e) {
        console.error('Failed to fetch event config api', e);
        return null;
    }
};
