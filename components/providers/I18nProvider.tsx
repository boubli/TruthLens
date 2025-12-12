'use client';

import { ReactNode, useEffect } from 'react';
import '@/lib/i18n'; // Import to ensure side-effects run
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

export function I18nProvider({ children }: { children: ReactNode }) {
    const { user, userProfile } = useAuth();
    const { i18n } = useTranslation();

    useEffect(() => {
        // Fallback or initialization logic if needed, but removing specific user profile sync
        // Assuming default i18n initialization is enough
    }, []);

    return <>{children}</>;
}
