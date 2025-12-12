/**
 * PC Builder API - Save Route
 * Saves a generated build to the user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { saveBuild } from '@/services/pcBuilderService';
import { SavedBuild } from '@/types/pcBuilder';

export async function POST(req: NextRequest) {
    try {
        // Authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;

        try {
            decodedToken = await adminAuth?.verifyIdToken(idToken);
        } catch (authError) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (!decodedToken) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        const build: SavedBuild = await req.json();

        // Ensure the build belongs to the authenticated user
        if (build.userId !== decodedToken.uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const buildId = await saveBuild(build);

        return NextResponse.json({
            success: true,
            buildId
        });

    } catch (error: any) {
        console.error('[PC Builder Save API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to save build'
        }, { status: 500 });
    }
}
