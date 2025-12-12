/**
 * PC Builder API - Generate Route
 * Orchestrates the PC build generation process
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { generatePCBuild } from '@/services/pcBuilderService';
import { GenerateBuildRequest } from '@/types/pcBuilder';

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;

        try {
            decodedToken = await adminAuth?.verifyIdToken(idToken);
        } catch (authError) {
            console.error('[PC Builder API] Auth error:', authError);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (!decodedToken) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        const userId = decodedToken.uid;

        // 2. Tier Check - Pro or Ultimate only
        const userDoc = await adminDb?.collection('users').doc(userId).get();
        const userData = userDoc?.data();
        const tier = userData?.subscription?.tier || 'free';

        if (tier !== 'pro' && tier !== 'ultimate') {
            return NextResponse.json({
                error: 'PC Builder requires Pro or Ultimate subscription',
                upgradeRequired: true
            }, { status: 403 });
        }

        // 3. Parse Request
        const body: GenerateBuildRequest = await req.json();

        if (!body.mode) {
            return NextResponse.json({ error: 'Mode is required' }, { status: 400 });
        }

        if (body.mode === 'budget' && !body.budget) {
            return NextResponse.json({ error: 'Budget is required for budget mode' }, { status: 400 });
        }

        if (body.mode === 'hardware' && !body.existingHardware) {
            return NextResponse.json({ error: 'Existing hardware is required for hardware mode' }, { status: 400 });
        }

        // 4. Generate Build
        console.log(`[PC Builder API] Generating ${body.mode} build for user ${userId}`);

        const build = await generatePCBuild(userId, body);

        // 5. Return the generated build (not saved yet - user decides)
        return NextResponse.json({
            success: true,
            build
        });

    } catch (error: any) {
        console.error('[PC Builder API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to generate build'
        }, { status: 500 });
    }
}
