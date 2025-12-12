import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { ExtendedSystemSettings, EventManagerConfig } from '@/types/system';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!adminDb) return NextResponse.json({ status: 'error', message: 'Database not initialized' }, { status: 500 });

        const settingsDoc = await adminDb.collection('system').doc('settings').get();
        if (!settingsDoc.exists) {
            return NextResponse.json({
                status: 'success',
                data: { config: null, server_time: new Date().toISOString() }
            });
        }

        const settings = settingsDoc.data() as ExtendedSystemSettings;

        // --- Multi-Event Selection Logic ---
        const now = Date.now();
        let activeConfig: EventManagerConfig | null = null;

        // 1. Collect all candidates (schedule + legacy)
        const candidates: EventManagerConfig[] = [];

        if (settings.eventSchedule && Array.isArray(settings.eventSchedule)) {
            candidates.push(...settings.eventSchedule);
        }
        // Fallback to legacy single config if it exists and schedule is empty/missing
        if (candidates.length === 0 && settings.eventManager) {
            candidates.push(settings.eventManager);
        }

        // 2. Filter for currently active time windows (Event Start -> Event End)
        const activeCandidates = candidates.filter(event => {
            if (!event.is_active_global) return false;

            // Use Celebration Window as the "Master" window for device activation
            if (!event.celebration_music_start || !event.celebration_music_end) return false;

            const start = new Date(event.celebration_music_start).getTime();
            const end = new Date(event.celebration_music_end).getTime();

            return (now >= start && now <= end);
        });

        // 3. Priority: Pick the one with the LATEST Start Time (Most specific/recent)
        if (activeCandidates.length > 0) {
            activeCandidates.sort((a, b) => {
                const startA = new Date(a.celebration_music_start).getTime();
                const startB = new Date(b.celebration_music_start).getTime();
                return startB - startA;
            });
            activeConfig = activeCandidates[0];
        }

        // --- Response ---
        // We flatten it to a single 'config' so the Frontend doesn't need to change.
        // It just thinks there is one event happening right now.

        return NextResponse.json({
            status: 'success',
            data: {
                config: activeConfig,
                globalEffects: settings.globalEffects || { snow: false, rain: false, leaves: false, confetti: false },
                server_time: new Date().toISOString()
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });

    } catch (error) {
        console.error("Failed to fetch event config:", error);
        return NextResponse.json({
            status: 'error',
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}
