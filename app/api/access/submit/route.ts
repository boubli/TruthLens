import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import axios from 'axios';
import { validateFileSignature } from '@/lib/fileValidators';

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

        // AI VERIFICATION FOR STUDENTS
        let aiVerificationResult = null;
        let shouldAutoApprove = false;

        if (data.isStudent && data.studentProofBase64) {
            console.log('[ACCESS] Running Secure AI student verification...');

            // A. SECURITY: Magic Byte Validation (Anti-Malware)
            try {
                const buffer = Buffer.from(data.studentProofBase64, 'base64');
                const validation = validateFileSignature(buffer);

                if (!validation.isValid) {
                    console.warn('[SECURITY] Invalid file signature detected.');
                    return NextResponse.json({
                        success: false,
                        error: 'Security Alert: File format not recognized or potentially malformed. Please upload a valid JPG, PNG, or PDF.'
                    }, { status: 400 });
                }
                console.log(`[SECURITY] File signature verified: ${validation.mimeType}`);
            } catch (e) {
                return NextResponse.json({ success: false, error: 'File processing error' }, { status: 400 });
            }

            // Get Ollama URL from settings
            const settingsDoc = await adminDb.collection('system').doc('settings').get();
            const settings = settingsDoc.data();
            const ollamaUrl = settings?.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434';

            try {
                // Use Ollama AI to verify student ID
                const prompt = `Analyze this image. It should be a Student ID Card.
Check:
1. Is this a document/ID card? Or is it a selfie/face/random object?
2. If it is a document, is it a valid Student ID?
3. Does the name match "${data.fullName}"?

Respond ONLY in JSON:
{
  "verified": true/false,
  "reason": "If rejected, explain WHY (e.g., 'Image is a selfie, not an ID' or 'Name does not match')",
  "isIdCard": true/false
}`;

                const aiResponse = await axios.post(
                    `${ollamaUrl}/api/generate`,
                    {
                        model: 'llava', // Vision model
                        prompt: prompt,
                        images: [data.studentProofBase64],
                        stream: false
                    },
                    { timeout: 300000 }
                );

                if (aiResponse.data?.response) {
                    const responseText = aiResponse.data.response;
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

                    if (jsonMatch) {
                        aiVerificationResult = JSON.parse(jsonMatch[0]);
                        shouldAutoApprove = aiVerificationResult.verified === true;
                        console.log('[ACCESS] AI Verification:', aiVerificationResult);
                    } else {
                        // Fallback keyword check
                        shouldAutoApprove = responseText.toLowerCase().includes('valid') &&
                            responseText.toLowerCase().includes('student');
                    }
                }
            } catch (aiError) {
                console.error('[ACCESS] AI verification failed:', aiError);
                // Don't auto-approve on AI failure, require manual review
                shouldAutoApprove = false;
            }
        }

        // 2. Run Transaction
        const result = await adminDb.runTransaction(async (t) => {
            // A. Validate Code
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

            // B. Create Request
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
                studentProofUrl: 'verified-in-memory-zero-storage', // GDPR/Privacy: No file stored
                aiVerification: aiVerificationResult || null,
                status: shouldAutoApprove ? 'approved' : 'pending',
                denialReason: null,
                createdAt: FieldValue.serverTimestamp(),
                processedAt: shouldAutoApprove ? FieldValue.serverTimestamp() : null,
                processedBy: shouldAutoApprove ? 'ai_auto_approved' : null,
                accessExpiresAt: shouldAutoApprove ? Timestamp.fromDate(expiresAt) : null
            };

            t.set(requestRef, requestData);

            // C. Update Code Usage
            t.update(codeDoc.ref, { usedCount: FieldValue.increment(1) });

            // D. Auto-Approve (if AI verified)
            if (shouldAutoApprove) {
                const userRef = adminDb!.collection('users').doc(uid);
                const userDoc = await t.get(userRef);
                const userData = userDoc.data();
                const originalTier = userData?.subscription?.tier || 'free';

                // Update user subscription
                t.update(userRef, {
                    'subscription.tier': codeData.tier,
                    'subscription.freeAccessGranted': true,
                    'subscription.freeAccessExpiresAt': Timestamp.fromDate(expiresAt),
                    'subscription.originalTier': originalTier
                });

                // Set custom claim for instant access
                await adminAuth!.setCustomUserClaims(uid, { tier: codeData.tier });

                // Create notification (Async feedback for user)
                const notifRef = adminDb!.collection('users').doc(uid).collection('notifications').doc();
                t.set(notifRef, {
                    type: 'access_approved',
                    title: '🎉 Student Access Granted!',
                    message: `Congratulations! Your student verification was approved. You now have ${codeData.tier.toUpperCase()} access until ${expiresAt.toLocaleDateString()}.`,
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    metadata: {
                        requestId: requestRef.id,
                        tier: codeData.tier,
                        expiresAt: expiresAt.toISOString()
                    }
                });
            }

            return {
                requestId: requestRef.id,
                autoApproved: shouldAutoApprove,
                tier: shouldAutoApprove ? codeData.tier : null
            };
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('[API] Access Submit Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Submission failed' }, { status: 500 });
    }
}
