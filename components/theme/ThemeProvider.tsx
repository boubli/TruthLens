/**
 * Theme Provider Component
 * Wraps app with MUI Theme Provider and loads theme dynamically
 */

'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeContextProvider, useThemeContext } from '@/lib/theme/ThemeContext';
import { createMuiTheme } from '@/lib/theme/muiTheme';

interface ThemeProviderProps {
    children: ReactNode;
    userId?: string | null;
}

/**
 * Inner provider that has access to theme context
 */
function ThemeProviderInner({ children }: { children: ReactNode }) {
    const { currentTheme } = useThemeContext();
    const muiTheme = createMuiTheme(currentTheme);

    return (
        <AppRouterCacheProvider>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </AppRouterCacheProvider>
    );
}

/**
 * Main Theme Provider
 * Wraps the app with both ThemeContext and MUI ThemeProvider
 */
export function ThemeProvider({ children, userId }: ThemeProviderProps) {
    return (
        <ThemeContextProvider userId={userId}>
            <ThemeProviderInner>{children}</ThemeProviderInner>
        </ThemeContextProvider>
    );
}
