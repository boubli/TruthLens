/**
 * Theme Context
 * Global state management for theme system with Firebase persistence
 * Supports context-aware themes: separate themes for admin vs user areas
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeId, ThemeConfig, CustomThemeColors, UserThemePreference, GlobalTheme } from '@/types/theme';
import { themes, defaultTheme, darkTheme } from './themes';
import { saveUserTheme, loadUserTheme, saveAdminTheme, loadAdminTheme, getGlobalThemes, globalThemeToConfig } from '@/services/themeService';

interface ThemeContextType {
    currentTheme: ThemeConfig;
    themeId: ThemeId;
    setTheme: (themeId: ThemeId) => void;
    customizeTheme: (colors: CustomThemeColors) => void;
    resetTheme: () => void;
    isCustomTheme: boolean;
    customColors: CustomThemeColors | null;
    isLoading: boolean;
    availableThemes: ThemeConfig[];
    globalThemes: GlobalTheme[];
    refreshGlobalThemes: () => Promise<void>;
    systemMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys for two-bucket approach
const USER_THEME_STORAGE_KEY = 'truthlens_theme';
const ADMIN_THEME_STORAGE_KEY = 'truthlens_admin_theme';

interface ThemeProviderProps {
    children: ReactNode;
    userId?: string | null;
}

export function ThemeContextProvider({ children, userId }: ThemeProviderProps) {
    // Route detection for context-aware theming
    const pathname = usePathname();
    const isAdminContext = pathname?.startsWith('/admin') ?? false;

    const [themeId, setThemeId] = useState<ThemeId>('default');
    const [customColors, setCustomColors] = useState<CustomThemeColors | null>(null);
    const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(defaultTheme);
    const [isLoading, setIsLoading] = useState(true);
    const [globalThemes, setGlobalThemes] = useState<GlobalTheme[]>([]);
    const [systemMode, setSystemMode] = useState<'light' | 'dark'>('light');

    // Get context-aware storage key
    const storageKey = isAdminContext ? ADMIN_THEME_STORAGE_KEY : USER_THEME_STORAGE_KEY;

    // Detect system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            const newMode = e.matches ? 'dark' : 'light';
            setSystemMode(newMode);

            // Update theme if user has system mode selected
            if (themeId === 'system') {
                setCurrentTheme(newMode === 'dark' ? darkTheme : defaultTheme);
            }
        };

        // Initial check
        handleChange(mediaQuery);

        // Listen for changes
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themeId]);

    // Load global themes from Firebase
    const refreshGlobalThemes = useCallback(async () => {
        try {
            const fetchedThemes = await getGlobalThemes();
            setGlobalThemes(fetchedThemes);
        } catch (error) {
            console.error('[ThemeContext] Failed to load global themes:', error);
        }
    }, []);

    // Load theme on mount - Context-aware: admin vs user bucket
    useEffect(() => {
        const loadTheme = async () => {
            setIsLoading(true);
            try {
                // Load global themes
                await refreshGlobalThemes();

                // Try Firebase first if user is logged in
                if (userId) {
                    // Context-aware loading: check which bucket to use
                    const firebaseTheme = isAdminContext
                        ? await loadAdminTheme(userId)
                        : await loadUserTheme(userId);

                    if (firebaseTheme) {
                        console.log(`[ThemeContext] Loaded ${isAdminContext ? 'admin' : 'user'} theme:`, firebaseTheme.id);
                        applyThemePreference(firebaseTheme);
                        setIsLoading(false);
                        return;
                    }
                }

                // Fallback to context-aware localStorage
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const preference: UserThemePreference = JSON.parse(saved);
                    applyThemePreference(preference);
                }
            } catch (error) {
                console.error('[ThemeContext] Failed to load theme:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTheme();
    }, [userId, isAdminContext, storageKey, refreshGlobalThemes]);

    // Apply a theme preference
    const applyThemePreference = useCallback((preference: UserThemePreference) => {
        setThemeId(preference.id);

        if (preference.id === 'system') {
            setCurrentTheme(systemMode === 'dark' ? darkTheme : defaultTheme);
            setCustomColors(null);
        } else if (preference.id === 'custom' && preference.customColors) {
            setCustomColors(preference.customColors);
            setCurrentTheme(createCustomTheme(preference.customColors));
        } else if (themes[preference.id]) {
            setCustomColors(null);
            setCurrentTheme(themes[preference.id]);
        } else {
            // Check if it's a global theme
            const globalTheme = globalThemes.find(t => t.id === preference.id);
            if (globalTheme) {
                setCustomColors(null);
                setCurrentTheme(globalThemeToConfig(globalTheme));
            } else {
                setCurrentTheme(defaultTheme);
            }
        }
    }, [systemMode, globalThemes]);

    // Save theme to localStorage and Firebase - Context-aware
    const persistTheme = useCallback(async (newThemeId: ThemeId, newCustomColors: CustomThemeColors | null) => {
        // Save to context-aware localStorage (always, for offline support)
        try {
            const preference: UserThemePreference = {
                id: newThemeId,
                customColors: newCustomColors || undefined,
            };
            localStorage.setItem(storageKey, JSON.stringify(preference));
        } catch (error) {
            console.error('[ThemeContext] Failed to save theme to localStorage:', error);
        }

        // Save to Firebase if logged in - use correct bucket
        if (userId) {
            try {
                if (isAdminContext) {
                    await saveAdminTheme(userId, newThemeId, newCustomColors || undefined);
                    console.log('[ThemeContext] Admin theme saved:', newThemeId);
                } else {
                    await saveUserTheme(userId, newThemeId, newCustomColors || undefined);
                    console.log('[ThemeContext] User theme saved:', newThemeId);
                }
            } catch (error) {
                console.error('[ThemeContext] Failed to save theme to Firebase:', error);
            }
        }
    }, [userId, isAdminContext, storageKey]);

    const setTheme = useCallback((newThemeId: ThemeId) => {
        setThemeId(newThemeId);

        if (newThemeId === 'system') {
            setCurrentTheme(systemMode === 'dark' ? darkTheme : defaultTheme);
            setCustomColors(null);
        } else if (newThemeId === 'custom') {
            // Keep current custom colors
            if (customColors) {
                setCurrentTheme(createCustomTheme(customColors));
            }
        } else if (themes[newThemeId]) {
            setCustomColors(null);
            setCurrentTheme(themes[newThemeId]);
        } else {
            // Check global themes
            const globalTheme = globalThemes.find(t => t.id === newThemeId);
            if (globalTheme) {
                setCustomColors(null);
                setCurrentTheme(globalThemeToConfig(globalTheme));
            } else {
                setCurrentTheme(defaultTheme);
            }
        }

        // Persist
        persistTheme(newThemeId, newThemeId === 'custom' ? customColors : null);
    }, [customColors, globalThemes, persistTheme, systemMode]);

    const customizeTheme = useCallback((colors: CustomThemeColors) => {
        setThemeId('custom');
        setCustomColors(colors);
        setCurrentTheme(createCustomTheme(colors));
        persistTheme('custom', colors);
    }, [persistTheme]);

    const resetTheme = useCallback(() => {
        setThemeId('default');
        setCustomColors(null);
        setCurrentTheme(defaultTheme);
        localStorage.removeItem(storageKey);

        if (userId) {
            if (isAdminContext) {
                saveAdminTheme(userId, 'default').catch(console.error);
            } else {
                saveUserTheme(userId, 'default').catch(console.error);
            }
        }
    }, [userId, isAdminContext, storageKey]);

    // Build available themes list (built-in + global)
    const availableThemes: ThemeConfig[] = [
        ...Object.values(themes),
        ...globalThemes.map(globalThemeToConfig),
    ];

    const value: ThemeContextType = {
        currentTheme,
        themeId,
        setTheme,
        customizeTheme,
        resetTheme,
        isCustomTheme: themeId === 'custom',
        customColors,
        isLoading,
        availableThemes,
        globalThemes,
        refreshGlobalThemes,
        systemMode,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within ThemeContextProvider');
    }
    return context;
}

/**
 * Helper function to create custom theme config
 */
function createCustomTheme(colors: CustomThemeColors): ThemeConfig {
    return {
        id: 'custom',
        name: 'Custom Theme',
        mode: colors.mode,
        colors: {
            primary: {
                main: colors.primary,
                light: adjustColor(colors.primary, 20),
                dark: adjustColor(colors.primary, -20),
                contrastText: colors.mode === 'dark' ? '#000000' : '#FFFFFF',
            },
            secondary: {
                main: colors.secondary,
                light: adjustColor(colors.secondary, 20),
                dark: adjustColor(colors.secondary, -20),
                contrastText: colors.mode === 'dark' ? '#000000' : '#FFFFFF',
            },
            background: {
                default: colors.background,
                paper: colors.mode === 'dark' ? '#1E293B' : '#FFFFFF',
            },
            text: {
                primary: colors.mode === 'dark' ? '#F1F5F9' : '#1F2937',
                secondary: colors.mode === 'dark' ? '#94A3B8' : '#6B7280',
            },
            error: {
                main: '#EF4444',
                light: '#F87171',
                dark: '#DC2626',
            },
            warning: {
                main: '#F59E0B',
                light: '#FBBF24',
                dark: '#D97706',
            },
            info: {
                main: '#3B82F6',
                light: '#60A5FA',
                dark: '#2563EB',
            },
            success: {
                main: '#10B981',
                light: '#34D399',
                dark: '#059669',
            },
        },
        typography: {
            fontFamily: colors.fontFamily || "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
            fontSize: 14,
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 500,
            fontWeightBold: 700,
        },
        shape: {
            borderRadius: colors.borderRadius,
        },
    };
}

/**
 * Adjust color brightness
 * @param color - Hex color string
 * @param amount - Positive to lighten, negative to darken
 */
function adjustColor(color: string, amount: number): string {
    try {
        // Remove # if present
        const hex = color.replace('#', '');

        // Parse RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Adjust
        const newR = Math.min(255, Math.max(0, r + amount));
        const newG = Math.min(255, Math.max(0, g + amount));
        const newB = Math.min(255, Math.max(0, b + amount));

        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    } catch {
        return color;
    }
}
