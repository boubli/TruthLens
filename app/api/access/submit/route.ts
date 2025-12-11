import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify User Auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let uid;
        try {
            const decodedToken = await adminAuth!.verifyIdToken(idToken);
            uid = decodedToken.uid;
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });
        }

        const data = await req.json();

        if (!adminDb) {
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        // 2. Transact: Re-Validate Code -> Create Request -> Update Code Usage -> Update User (if auto-approved)
        const result = await adminDb.runTransaction(async (t) => {
            // A. Check Code
            const codesRef = adminDb!.collection('accessCodes');
            const codeSnapshot = await t.get(codesRef.where('code', '==', data.code.toUpperCase()).where('active', '==', true).limit(1));

            if (codeSnapshot.empty) {
                throw new Error('Invalid or inactive access code');
            }

            const codeDoc = codeSnapshot.docs[0];
            const codeData = codeDoc.data();

            if (codeData.expiresAt && codeData.expiresAt.toDate() < new Date()) {
                throw new Error('Access code expired');
            }

            if (codeData.usageLimit > 0 && codeData.usedCount >= codeData.usageLimit) {
                throw new Error('Usage limit reached');
            }

            // B. Prepare Request Data
            const isStudentWithProof = !!(data.isStudent && data.studentProofUrl);
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 3);

            const requestRef = adminDb!.collection('freeAccessRequests').doc();

            const requestData = {
                userId: uid,
                fullName: data.fullName,
                username: data.username,
                email: data.email,
                useAccountEmail: data.useAccountEmail,
                phone: data.phone,
                reason: data.reason,
                codeUsed: codeData.code,
                codeTier: codeData.tier,
                isStudent: data.isStudent,
                studentProofUrl: data.studentProofUrl,
                status: isStudentWithProof ? 'approved' : 'pending',
                denialReason: null,
                createdAt: FieldValue.serverTimestamp(),
                processedAt: isStudentWithProof ? FieldValue.serverTimestamp() : null,
                processedBy: isStudentWithProof ? 'auto_student' : null,
                accessExpiresAt: isStudentWithProof ? Timestamp.fromDate(expiresAt) : null
            };

            t.set(requestRef, requestData);

            // C. Update Code Usage
            t.update(codeDoc.ref, { usedCount: FieldValue.increment(1) });

            // D. Auto-Approve Logic (Update User & Notify)
            if (isStudentWithProof) {
                // Get User
                const userRef = adminDb!.collection('users').doc(uid);
                const userDoc = await t.get(userRef);
                const userData = userDoc.data();
                const originalTier = userData?.subscription?.tier || 'free';

                t.update(userRef, {
                    'subscription.tier': codeData.tier,
                    'subscription.freeAccessGranted': true,
                    'subscription.freeAccessExpiresAt': Timestamp.fromDate(expiresAt),
                    'subscription.originalTier': originalTier
                });

                // Create Notification
                const notifRef = adminDb!.collection('users').doc(uid).collection('notifications').doc();
                t.set(notifRef, {
                    type: 'access_approved',
                    title: '🎉 Student Access Granted!',
                    message: `Your student verification was approved! You now have ${codeData.tier.toUpperCase()} access for 3 months.`,
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    metadata: { requestId: requestRef.id, tier: codeData.tier, expiresAt: expiresAt.toISOString() }
                });
            }

            return {
                requestId: requestRef.id,
                autoApproved: isStudentWithProof
            };
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('[API] Access Submit Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Submission failed' }, { status: 500 });
    }
}
