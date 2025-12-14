/**
 * MUI Theme Converter
 * Converts ThemeConfig to Material-UI theme
 */

import { createTheme, Theme } from '@mui/material/styles';
import { ThemeConfig, CustomThemeColors } from '@/types/theme';

/**
 * Creates a Material-UI theme from a ThemeConfig object
 */
export function createMuiTheme(themeConfig: ThemeConfig): Theme {
    const { colors, typography, shape, mode } = themeConfig;

    return createTheme({
        palette: {
            mode,
            primary: {
                main: colors.primary.main,
                light: colors.primary.light,
                dark: colors.primary.dark,
                contrastText: colors.primary.contrastText,
            },
            secondary: {
                main: colors.secondary.main,
                light: colors.secondary.light,
                dark: colors.secondary.dark,
                contrastText: colors.secondary.contrastText,
            },
            background: {
                default: colors.background.default,
                paper: colors.background.paper,
            },
            text: {
                primary: colors.text.primary,
                secondary: colors.text.secondary,
            },
            error: {
                main: colors.error.main,
                light: colors.error.light,
                dark: colors.error.dark,
            },
            warning: {
                main: colors.warning.main,
                light: colors.warning.light,
                dark: colors.warning.dark,
            },
            info: {
                main: colors.info.main,
                light: colors.info.light,
                dark: colors.info.dark,
            },
            success: {
                main: colors.success.main,
                light: colors.success.light,
                dark: colors.success.dark,
            },
        },
        typography: {
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize,
            fontWeightLight: typography.fontWeightLight,
            fontWeightRegular: typography.fontWeightRegular,
            fontWeightMedium: typography.fontWeightMedium,
            fontWeightBold: typography.fontWeightBold,
            h1: {
                fontSize: '2.5rem',
                fontWeight: 700,
            },
            h2: {
                fontSize: '2rem',
                fontWeight: 600,
            },
            h3: {
                fontSize: '1.75rem',
                fontWeight: 600,
            },
            h4: {
                fontSize: '1.5rem',
                fontWeight: 600,
            },
            h5: {
                fontSize: '1.25rem',
                fontWeight: 600,
            },
            h6: {
                fontSize: '1rem',
                fontWeight: 600,
            },
            button: {
                textTransform: 'none',
                fontWeight: 600,
            },
        },
        shape: {
            borderRadius: shape.borderRadius,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: shape.borderRadius,
                        padding: '10px 24px',
                        fontSize: '1rem',
                        textTransform: 'none',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                        },
                    },
                    sizeLarge: {
                        padding: '14px 32px',
                    },
                    sizeSmall: {
                        padding: '6px 16px',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        borderRadius: shape.borderRadius,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: shape.borderRadius,
                        transition: 'all 0.3s ease-in-out',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: shape.borderRadius,
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: shape.borderRadius / 2,
                    },
                },
            },
        },
    });
}

/**
 * Creates a custom theme from user-defined colors
 */
export function createCustomMuiTheme(customColors: CustomThemeColors): Theme {
    const { primary, secondary, background, mode, borderRadius, fontFamily } = customColors;

    // Helper to generate light and dark variants
    const getLightVariant = (color: string) => {
        // Simple lightening (in production, use a color manipulation library)
        return color + '40'; // Add alpha for lighter version
    };

    const getDarkVariant = (color: string) => {
        // Simple darkening
        return color + 'CC'; // Add alpha for darker version
    };

    const customThemeConfig: ThemeConfig = {
        id: 'custom',
        name: 'Custom Theme',
        mode,
        colors: {
            primary: {
                main: primary,
                light: getLightVariant(primary),
                dark: getDarkVariant(primary),
                contrastText: mode === 'dark' ? '#000000' : '#FFFFFF',
            },
            secondary: {
                main: secondary,
                light: getLightVariant(secondary),
                dark: getDarkVariant(secondary),
                contrastText: mode === 'dark' ? '#000000' : '#FFFFFF',
            },
            background: {
                default: background,
                paper: mode === 'dark' ? '#1E293B' : '#FFFFFF',
            },
            text: {
                primary: mode === 'dark' ? '#F1F5F9' : '#1F2937',
                secondary: mode === 'dark' ? '#94A3B8' : '#6B7280',
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
            fontFamily: fontFamily || "'var(--font-outfit)', 'Outfit', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
            fontSize: 14,
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 500,
            fontWeightBold: 700,
        },
        shape: {
            borderRadius,
        },
    };

    return createMuiTheme(customThemeConfig);
}
