/**
 * Predefined Theme Configurations
 * 5 beautiful themes for TruthLens
 */

import { ThemeConfig } from '@/types/theme';

// 1. TruthLens Default (Light Mode)
export const defaultTheme: ThemeConfig = {
    id: 'default',
    name: 'TruthLens Default',
    mode: 'light',
    colors: {
        primary: {
            main: '#10B981', // Green
            light: '#34D399',
            dark: '#059669',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#059669', // Emerald
            light: '#10B981',
            dark: '#047857',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F9FAFB', // Light Gray
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1F2937', // Dark Gray
            secondary: '#6B7280',
        },
        error: {
            main: '#EF4444', // Red
            light: '#F87171',
            dark: '#DC2626',
        },
        warning: {
            main: '#F59E0B', // Amber
            light: '#FBBF24',
            dark: '#D97706',
        },
        info: {
            main: '#3B82F6', // Blue
            light: '#60A5FA',
            dark: '#2563EB',
        },
        success: {
            main: '#10B981', // Green
            light: '#34D399',
            dark: '#059669',
        },
    },
    typography: {
        fontFamily: "'var(--font-outfit)', 'Outfit', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
    shape: {
        borderRadius: 12,
    },
};

// 2. Dark Mode
export const darkTheme: ThemeConfig = {
    id: 'dark',
    name: 'Dark Mode',
    mode: 'dark',
    colors: {
        primary: {
            main: '#34D399', // Bright Green
            light: '#6EE7B7',
            dark: '#10B981',
            contrastText: '#000000',
        },
        secondary: {
            main: '#14B8A6', // Teal
            light: '#2DD4BF',
            dark: '#0D9488',
            contrastText: '#000000',
        },
        background: {
            default: '#0F172A', // Dark
            paper: '#1E293B', // Slate
        },
        text: {
            primary: '#F1F5F9', // Light Gray
            secondary: '#94A3B8',
        },
        error: {
            main: '#F87171', // Coral
            light: '#FCA5A5',
            dark: '#EF4444',
        },
        warning: {
            main: '#FCD34D', // Yellow
            light: '#FDE68A',
            dark: '#FBBF24',
        },
        info: {
            main: '#60A5FA', // Light Blue
            light: '#93C5FD',
            dark: '#3B82F6',
        },
        success: {
            main: '#34D399', // Bright Green
            light: '#6EE7B7',
            dark: '#10B981',
        },
    },
    typography: {
        fontFamily: "'var(--font-outfit)', 'Outfit', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
    shape: {
        borderRadius: 12,
    },
};

// 3. Ocean Blue
export const oceanTheme: ThemeConfig = {
    id: 'ocean',
    name: 'Ocean Blue',
    mode: 'light',
    colors: {
        primary: {
            main: '#3B82F6', // Blue
            light: '#60A5FA',
            dark: '#2563EB',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#06B6D4', // Cyan
            light: '#22D3EE',
            dark: '#0891B2',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#EFF6FF', // Light Blue
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1E3A8A', // Navy
            secondary: '#3B82F6',
        },
        error: {
            main: '#EC4899', // Pink
            light: '#F472B6',
            dark: '#DB2777',
        },
        warning: {
            main: '#FB923C', // Orange
            light: '#FDBA74',
            dark: '#F97316',
        },
        info: {
            main: '#0EA5E9', // Sky Blue
            light: '#38BDF8',
            dark: '#0284C7',
        },
        success: {
            main: '#14B8A6', // Teal
            light: '#2DD4BF',
            dark: '#0D9488',
        },
    },
    typography: {
        fontFamily: "'var(--font-outfit)', 'Outfit', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
    shape: {
        borderRadius: 16,
    },
};

// 4. Forest Green
export const forestTheme: ThemeConfig = {
    id: 'forest',
    name: 'Forest Green',
    mode: 'light',
    colors: {
        primary: {
            main: '#047857', // Forest Green
            light: '#059669',
            dark: '#065F46',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#84CC16', // Lime
            light: '#A3E635',
            dark: '#65A30D',
            contrastText: '#000000',
        },
        background: {
            default: '#F0FDF4', // Light Green
            paper: '#FFFFFF',
        },
        text: {
            primary: '#064E3B', // Dark Green
            secondary: '#047857',
        },
        error: {
            main: '#DC2626', // Red
            light: '#EF4444',
            dark: '#B91C1C',
        },
        warning: {
            main: '#F59E0B', // Amber
            light: '#FBBF24',
            dark: '#D97706',
        },
        info: {
            main: '#14B8A6', // Teal
            light: '#2DD4BF',
            dark: '#0D9488',
        },
        success: {
            main: '#22C55E', // Green
            light: '#4ADE80',
            dark: '#16A34A',
        },
    },
    typography: {
        fontFamily: "'var(--font-outfit)', 'Outfit', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
    shape: {
        borderRadius: 14,
    },
};

// 5. Purple Dreams
export const purpleTheme: ThemeConfig = {
    id: 'purple',
    name: 'Purple Dreams',
    mode: 'light',
    colors: {
        primary: {
            main: '#9333EA', // Purple
            light: '#A855F7',
            dark: '#7E22CE',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#8B5CF6', // Violet
            light: '#A78BFA',
            dark: '#7C3AED',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#FAF5FF', // Light Purple
            paper: '#FFFFFF',
        },
        text: {
            primary: '#581C87', // Deep Purple
            secondary: '#7E22CE',
        },
        error: {
            main: '#F43F5E', // Rose
            light: '#FB7185',
            dark: '#E11D48',
        },
        warning: {
            main: '#FB923C', // Orange
            light: '#FDBA74',
            dark: '#F97316',
        },
        info: {
            main: '#8B5CF6', // Violet
            light: '#A78BFA',
            dark: '#7C3AED',
        },
        success: {
            main: '#A855F7', // Light Purple
            light: '#C084FC',
            dark: '#9333EA',
        },
    },
    typography: {
        fontFamily: "'Outfit', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
    shape: {
        borderRadius: 16,
    },
};

// Export all themes as a map
export const themes: Record<string, ThemeConfig> = {
    default: defaultTheme,
    dark: darkTheme,
    ocean: oceanTheme,
    forest: forestTheme,
    purple: purpleTheme,
};

// Export theme list for selectors
export const themeList: ThemeConfig[] = [
    defaultTheme,
    darkTheme,
    oceanTheme,
    forestTheme,
    purpleTheme,
];
