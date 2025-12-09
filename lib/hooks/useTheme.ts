/**
 * useTheme Hook
 * Custom hook for accessing theme functionality
 */

'use client';

import { useThemeContext } from '../theme/ThemeContext';

export function useTheme() {
    return useThemeContext();
}
