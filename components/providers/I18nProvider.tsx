'use client';

import { ReactNode, useEffect } from 'react';
import '@/lib/i18n'; // Import to ensure side-effects run
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

export function I18nProvider({ children }: { children: ReactNode }) {
    const { user, userProfile } = useAuth();
    const { i18n } = useTranslation();

    useEffect(() => {
        // Sync with Firebase profile if available
        if (user && userProfile?.preferences?.language) {
            if (i18n.language !== userProfile.preferences.language) {
                i18n.changeLanguage(userProfile.preferences.language);
            }
        } else {
            // Fallback to localStorage if not logged in or no profile pref
            const savedLang = localStorage.getItem('i18nextLng');
            if (savedLang && i18n.language !== savedLang) {
                i18n.changeLanguage(savedLang);
            }
        }
    }, [user, userProfile, i18n]);

    return <>{children}</>;
}
