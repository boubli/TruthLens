'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
    .use(initReactI18next)
    .use(
        resourcesToBackend(
            (language: string, namespace: string) =>
                import(`../public/locales/${language}/${namespace}.json`)
        )
    )
    .init({
        lng: undefined, // Let language be handled by persistent state or detector, fallback to 'en'
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr', 'es', 'pt', 'ar_MA'],
        interpolation: {
            escapeValue: false, // React already safe from XSS
        },
        react: {
            useSuspense: false // Avoid suspense issues in some Next.js setups
        }
    });

export default i18n;
