/**
 * Theme Service
 * Firebase integration for theme persistence and admin theme management
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    ThemeId,
    CustomThemeColors,
    UserThemePreference,
    GlobalTheme,
    ThemeAnalytics,
    ThemeConfig,
    ThemeColors,
    ThemeTypography,
    ThemeShape
} from '@/types/theme';

// Collection names
const USERS_COLLECTION = 'users';
const GLOBAL_THEMES_COLLECTION = 'globalThemes';
const THEME_ANALYTICS_COLLECTION = 'themeAnalytics';

// ============================================================================
// USER THEME OPERATIONS
// ============================================================================

/**
 * Save user's theme preference to Firebase
 */
export async function saveUserTheme(
    userId: string,
    themeId: ThemeId,
    customColors?: CustomThemeColors
): Promise<void> {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);

        const themeData: UserThemePreference = {
            id: themeId,
            customColors: customColors || undefined,
        };

        await updateDoc(userRef, {
            'preferences.theme': themeData,
        });

        // Update analytics
        await updateThemeAnalytics(themeId);

        console.log('[ThemeService] User theme saved:', themeId);
    } catch (error) {
        console.error('[ThemeService] Error saving user theme:', error);
        throw error;
    }
}

/**
 * Load user's theme preference from Firebase
 */
export async function loadUserTheme(userId: string): Promise<UserThemePreference | null> {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData?.preferences?.theme || userData?.theme || null;
        }

        return null;
    } catch (error) {
        console.error('[ThemeService] Error loading user theme:', error);
        return null;
    }
}

/**
 * Save admin's theme preference (separate from user theme)
 */
export async function saveAdminTheme(
    adminId: string,
    themeId: ThemeId,
    customColors?: CustomThemeColors
): Promise<void> {
    try {
        const userRef = doc(db, USERS_COLLECTION, adminId);

        const themeData: UserThemePreference = {
            id: themeId,
            customColors: customColors || undefined,
        };

        await updateDoc(userRef, {
            'preferences.adminTheme': themeData,
        });

        console.log('[ThemeService] Admin theme saved:', themeId);
    } catch (error) {
        console.error('[ThemeService] Error saving admin theme:', error);
        throw error;
    }
}

/**
 * Load admin's theme preference
 */
export async function loadAdminTheme(adminId: string): Promise<UserThemePreference | null> {
    try {
        const userRef = doc(db, USERS_COLLECTION, adminId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData?.preferences?.adminTheme || null;
        }

        return null;
    } catch (error) {
        console.error('[ThemeService] Error loading admin theme:', error);
        return null;
    }
}

// ============================================================================
// GLOBAL THEME OPERATIONS (Admin Only)
// ============================================================================

/**
 * Create a new global theme (Admin only)
 */
export async function createGlobalTheme(
    adminId: string,
    themeData: Omit<GlobalTheme, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    try {
        // Generate a unique ID based on theme name
        const themeId = themeData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        const themeRef = doc(db, GLOBAL_THEMES_COLLECTION, themeId);

        const newTheme: Omit<GlobalTheme, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
            ...themeData,
            id: themeId,
            createdBy: adminId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(themeRef, newTheme);

        // Initialize analytics for this theme
        await setDoc(doc(db, THEME_ANALYTICS_COLLECTION, themeId), {
            themeId,
            themeName: themeData.name,
            usageCount: 0,
            lastUsed: serverTimestamp(),
        });

        console.log('[ThemeService] Global theme created:', themeId);
        return themeId;
    } catch (error) {
        console.error('[ThemeService] Error creating global theme:', error);
        throw error;
    }
}

/**
 * Update an existing global theme (Admin only)
 */
export async function updateGlobalTheme(
    themeId: string,
    updates: Partial<Omit<GlobalTheme, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
    try {
        const themeRef = doc(db, GLOBAL_THEMES_COLLECTION, themeId);

        await updateDoc(themeRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        // Update analytics theme name if changed
        if (updates.name) {
            await updateDoc(doc(db, THEME_ANALYTICS_COLLECTION, themeId), {
                themeName: updates.name,
            });
        }

        console.log('[ThemeService] Global theme updated:', themeId);
    } catch (error) {
        console.error('[ThemeService] Error updating global theme:', error);
        throw error;
    }
}

/**
 * Delete a global theme (Admin only)
 */
export async function deleteGlobalTheme(themeId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, GLOBAL_THEMES_COLLECTION, themeId));
        await deleteDoc(doc(db, THEME_ANALYTICS_COLLECTION, themeId));

        console.log('[ThemeService] Global theme deleted:', themeId);
    } catch (error) {
        console.error('[ThemeService] Error deleting global theme:', error);
        throw error;
    }
}

/**
 * Get all global themes (available to all users)
 */
export async function getGlobalThemes(): Promise<GlobalTheme[]> {
    try {
        const themesRef = collection(db, GLOBAL_THEMES_COLLECTION);
        const q = query(themesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
            } as GlobalTheme;
        });
    } catch (error) {
        console.error('[ThemeService] Error fetching global themes:', error);
        return [];
    }
}

/**
 * Get a single global theme by ID
 */
export async function getGlobalTheme(themeId: string): Promise<GlobalTheme | null> {
    try {
        const themeRef = doc(db, GLOBAL_THEMES_COLLECTION, themeId);
        const themeDoc = await getDoc(themeRef);

        if (themeDoc.exists()) {
            const data = themeDoc.data();
            return {
                ...data,
                id: themeDoc.id,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
            } as GlobalTheme;
        }

        return null;
    } catch (error) {
        console.error('[ThemeService] Error fetching global theme:', error);
        return null;
    }
}

/**
 * Set a theme as the default for new users
 */
export async function setDefaultTheme(themeId: string): Promise<void> {
    try {
        // First, unset any existing default
        const themesRef = collection(db, GLOBAL_THEMES_COLLECTION);
        const defaultQuery = query(themesRef, where('isDefault', '==', true));
        const defaultThemes = await getDocs(defaultQuery);

        for (const themeDoc of defaultThemes.docs) {
            await updateDoc(doc(db, GLOBAL_THEMES_COLLECTION, themeDoc.id), {
                isDefault: false,
            });
        }

        // Set the new default
        await updateDoc(doc(db, GLOBAL_THEMES_COLLECTION, themeId), {
            isDefault: true,
        });

        console.log('[ThemeService] Default theme set:', themeId);
    } catch (error) {
        console.error('[ThemeService] Error setting default theme:', error);
        throw error;
    }
}

// ============================================================================
// THEME ANALYTICS
// ============================================================================

/**
 * Update theme usage analytics
 */
async function updateThemeAnalytics(themeId: ThemeId): Promise<void> {
    try {
        const analyticsRef = doc(db, THEME_ANALYTICS_COLLECTION, themeId);
        const analyticsDoc = await getDoc(analyticsRef);

        if (analyticsDoc.exists()) {
            await updateDoc(analyticsRef, {
                usageCount: increment(1),
                lastUsed: serverTimestamp(),
            });
        } else {
            // Create analytics for built-in themes
            await setDoc(analyticsRef, {
                themeId,
                themeName: themeId,
                usageCount: 1,
                lastUsed: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('[ThemeService] Error updating theme analytics:', error);
        // Don't throw - analytics failure shouldn't break theme saving
    }
}

/**
 * Get theme analytics (Admin only)
 */
export async function getThemeAnalytics(): Promise<ThemeAnalytics[]> {
    try {
        const analyticsRef = collection(db, THEME_ANALYTICS_COLLECTION);
        const q = query(analyticsRef, orderBy('usageCount', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                themeId: data.themeId,
                themeName: data.themeName,
                usageCount: data.usageCount || 0,
                lastUsed: (data.lastUsed as Timestamp)?.toDate() || new Date(),
            } as ThemeAnalytics;
        });
    } catch (error) {
        console.error('[ThemeService] Error fetching theme analytics:', error);
        return [];
    }
}

// ============================================================================
// HELPER: Convert GlobalTheme to ThemeConfig for MUI
// ============================================================================

/**
 * Convert a GlobalTheme to ThemeConfig format for use with MUI
 */
export function globalThemeToConfig(globalTheme: GlobalTheme): ThemeConfig {
    return {
        id: globalTheme.id,
        name: globalTheme.name,
        mode: globalTheme.mode,
        colors: globalTheme.colors,
        typography: globalTheme.typography,
        shape: globalTheme.shape,
    };
}

// ============================================================================
// LEGACY EXPORTS (Backward Compatibility)
// ============================================================================

// Keep old function names for backward compatibility
export const saveThemeToFirebase = saveUserTheme;
export const loadThemeFromFirebase = loadUserTheme;

/**
 * Initialize theme field for existing users (legacy)
 */
export async function initializeUserTheme(userId: string): Promise<void> {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Only initialize if theme doesn't exist
            if (!userData?.preferences?.theme && !userData?.theme) {
                await updateDoc(userRef, {
                    'preferences.theme': {
                        id: 'default',
                    },
                });
                console.log('[ThemeService] Initialized default theme for user');
            }
        }
    } catch (error) {
        console.error('[ThemeService] Error initializing user theme:', error);
    }
}
