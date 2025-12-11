import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ valid: false, error: 'Invalid code format' }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ valid: false, error: 'Server configuration error' }, { status: 500 });
        }

        const codesRef = adminDb.collection('accessCodes');
        const snapshot = await codesRef
            .where('code', '==', code.toUpperCase())
            .where('active', '==', true)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ valid: false, error: 'Invalid or inactive access code' });
        }

        const doc = snapshot.docs[0];
        const codeData = doc.data();

        // Check expiration
        if (codeData.expiresAt) {
            const expires = codeData.expiresAt.toDate();
            if (expires < new Date()) {
                return NextResponse.json({ valid: false, error: 'This access code has expired' });
            }
        }

        // Check usage limit
        if (codeData.usageLimit > 0 && codeData.usedCount >= codeData.usageLimit) {
            return NextResponse.json({ valid: false, error: 'This access code has reached its usage limit' });
        }

        // Return limited data (DO NOT return internal IDs or metadata if not needed)
        return NextResponse.json({
            valid: true,
            codeData: {
                id: doc.id, // Needed for submission reference
                code: codeData.code,
                tier: codeData.tier,
                type: codeData.type
            }
        });

    } catch (error: any) {
        console.error('[API] Access Code Validation Error:', error);
        return NextResponse.json({ valid: false, error: 'Internal validation error' }, { status: 500 });
    }
}
