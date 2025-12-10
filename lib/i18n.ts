'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .use(
        resourcesToBackend(
            (language: string, namespace: string) =>
                import(`../public/locales/${language}/${namespace}.json`)
        )
    )
    .init({
        lng: undefined, // Let language be handled by detector
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr', 'es', 'pt'],
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false, // React already safe from XSS
        },
        react: {
            useSuspense: false // Avoid suspense issues
        }
    });

export default i18n;
