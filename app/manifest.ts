import { MetadataRoute } from 'next';
import { getSystemSettings } from '@/services/systemService';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    try {
        const settings = await getSystemSettings();
        const branding = settings.branding || {};

        return {
            name: 'TruthLens',
            short_name: 'TruthLens',
            description: 'AI-powered product analysis and recommendations',
            start_url: '/',
            display: 'standalone',
            background_color: '#000000',
            theme_color: '#000000',
            orientation: 'portrait',
            icons: [
                {
                    src: branding.androidIcon192Url || '/icons/icon-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                },
                {
                    src: branding.androidIcon512Url || '/icons/icon-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                },
                {
                    src: branding.appleTouchIconUrl || '/apple-touch-icon.png',
                    sizes: '180x180',
                    type: 'image/png',
                    purpose: 'any maskable'
                },
            ],
        };
    } catch (error) {
        console.error('Failed to generate PWA manifest:', error);
        // Fallback Manifest
        return {
            name: 'TruthLens',
            short_name: 'TruthLens',
            description: 'AI-powered product analysis and recommendations',
            start_url: '/',
            display: 'standalone',
            background_color: '#000000',
            theme_color: '#000000',
            orientation: 'portrait',
            icons: [
                {
                    src: '/icons/icon-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                },
                {
                    src: '/icons/icon-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                },
            ],
        };
    }
}
