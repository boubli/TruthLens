import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let verifiedUid;

        try {
            const decodedToken = await adminAuth!.verifyIdToken(idToken);
            verifiedUid = decodedToken.uid;

            // Check admin role in Firestore map or custom claims
            // Assuming we trust the token and subsequent checks or user doc
            const userDoc = await adminDb!.collection('users').doc(verifiedUid).get();
            if (userDoc.data()?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const body = await req.json();
        const { action, provider, key } = body;

        // 2. Handle Actions
        const secretRef = adminDb!.collection('_system_secrets').doc('api_keys');

        if (action === 'save') {
            await secretRef.set({
                [provider]: key,
                updatedAt: new Date(),
                updatedBy: verifiedUid
            }, { merge: true });

            return NextResponse.json({ success: true, message: 'Key saved securely' });
        }
        else if (action === 'delete') {
            await secretRef.update({
                [provider]: FieldValue.delete()
            });
            return NextResponse.json({ success: true, message: 'Key deleted securely' });
        }
        else if (action === 'get_masked') {
            // Return masked keys for UI
            const doc = await secretRef.get();
            const data = doc.data() || {};
            const masked: any = {};

            Object.keys(data).forEach(p => {
                if (p === 'updatedAt' || p === 'updatedBy') return;
                const val = data[p];
                if (val && typeof val === 'string' && val.length > 8) {
                    masked[p] = val.substring(0, 4) + '...' + val.substring(val.length - 4);
                } else if (val) {
                    masked[p] = '********';
                }
            });

            return NextResponse.json({ success: true, keys: masked });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[API] Admin Keys Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
