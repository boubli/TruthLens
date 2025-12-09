/**
 * Theme System Type Definitions
 * Defines all types for the TruthLens theme system
 */

export type ThemeId = 'default' | 'dark' | 'ocean' | 'forest' | 'purple' | 'custom' | 'system' | string;

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
    primary: {
        main: string;
        light: string;
        dark: string;
        contrastText: string;
    };
    secondary: {
        main: string;
        light: string;
        dark: string;
        contrastText: string;
    };
    background: {
        default: string;
        paper: string;
    };
    text: {
        primary: string;
        secondary: string;
    };
    error: {
        main: string;
        light: string;
        dark: string;
    };
    warning: {
        main: string;
        light: string;
        dark: string;
    };
    info: {
        main: string;
        light: string;
        dark: string;
    };
    success: {
        main: string;
        light: string;
        dark: string;
    };
}

export interface ThemeTypography {
    fontFamily: string;
    fontSize: number;
    fontWeightLight: number;
    fontWeightRegular: number;
    fontWeightMedium: number;
    fontWeightBold: number;
}

export interface ThemeShape {
    borderRadius: number;
}

export interface ThemeConfig {
    id: ThemeId;
    name: string;
    mode: ThemeMode;
    colors: ThemeColors;
    typography: ThemeTypography;
    shape: ThemeShape;
}

export interface CustomThemeColors {
    primary: string;
    secondary: string;
    background: string;
    mode: ThemeMode;
    borderRadius: number;
    fontFamily: string;
}

export interface UserThemePreference {
    id: ThemeId;
    customColors?: CustomThemeColors;
}

/**
 * Global Theme - Admin-created themes available to all users
 */
export interface GlobalTheme {
    id: string;
    name: string;
    mode: ThemeMode;
    colors: ThemeColors;
    typography: ThemeTypography;
    shape: ThemeShape;
    isDefault: boolean;
    createdBy: string; // Admin userId
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Theme Analytics - Usage statistics for admin dashboard
 */
export interface ThemeAnalytics {
    themeId: string;
    themeName: string;
    usageCount: number;
    lastUsed: Date;
}

