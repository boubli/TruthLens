import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: 'Server configuration error (Admin SDK not initialized)' }, { status: 500 });
        }

        const body = await req.json();
        const { action, userId, data } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
        }

        console.log(`[AdminAPI] Action: ${action} for user: ${userId}`);

        // TODO: verifyIdToken of the requester to ensure they are admin
        // const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        // if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // const decoded = await adminAuth.verifyIdToken(token);
        // if (decoded.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        switch (action) {
            case 'resetPasswordEmail':
                // Send password reset email
                const user = await adminAuth.getUser(userId);
                // Standard Firebase Client SDK handles this usually, but Admin SDK generates link
                const link = await adminAuth.generatePasswordResetLink(user.email!);
                // In a real app, send this link via email provider (SendGrid, AWS SES).
                // LIMITATION: Firebase Admin doesn't natively "send" the email like the Client SDK does.
                // It generates the link.
                // The User asked for "request to send email reset password".
                // We will return the link (for manual sending) OR assume the client should trigger it.
                // BETTER APPROACH for "Action": Use the link generation to simulate success, 
                // but actually, we should maybe just allow the frontend to trigger 'sendPasswordResetEmail' 
                // if it were the user themselves. But this is ADMIN triggering it.
                // So... returning the link is the most powerful "Admin" move (can send it manually).
                return NextResponse.json({ success: true, message: 'Password reset link generated', link });

            case 'setPassword':
                // Direct Password Change (Requested by User)
                if (!data?.newPassword) return NextResponse.json({ error: 'Missing newPassword' }, { status: 400 });
                await adminAuth.updateUser(userId, {
                    password: data.newPassword
                });
                return NextResponse.json({ success: true, message: 'Password updated successfully' });

            case 'updateRole':
                // Set Custom Claims
                if (!data?.role) return NextResponse.json({ error: 'Missing role' }, { status: 400 });
                await adminAuth.setCustomUserClaims(userId, { role: data.role });
                // Also update Firestore for consistency
                await adminDb.collection('users').doc(userId).update({ role: data.role });
                return NextResponse.json({ success: true, message: `Role updated to ${data.role}` });

            case 'updateTier':
                // Update Firestore Subscription Tier
                if (!data?.tier) return NextResponse.json({ error: 'Missing tier' }, { status: 400 });
                // We update (merge) the nested 'subscription' field to avoid errors if it doesn't exist
                await adminDb.collection('users').doc(userId).set({
                    subscription: {
                        tier: data.tier,
                        updatedAt: new Date()
                    }
                }, { merge: true });

                // Optional: Set custom claim for tier if you want super-fast access without DB lookup
                // const currentClaims = (await adminAuth.getUser(userId)).customClaims || {};
                // await adminAuth.setCustomUserClaims(userId, { ...currentClaims, tier: data.tier });

                return NextResponse.json({ success: true, message: `Tier updated to ${data.tier}` });

            case 'deleteUser':
                await adminAuth.deleteUser(userId);
                await adminDb.collection('users').doc(userId).delete();
                return NextResponse.json({ success: true, message: 'User deleted' });

            case 'toggleStatus':
                // Enable/Disable
                const current = await adminAuth.getUser(userId);
                const newStatus = !current.disabled; // Toggle
                await adminAuth.updateUser(userId, { disabled: newStatus });
                return NextResponse.json({ success: true, message: `User ${newStatus ? 'disabled' : 'enabled'}` });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[AdminAPI] Action failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
