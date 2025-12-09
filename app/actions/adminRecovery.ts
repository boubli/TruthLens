'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function recoverAdminAccount(token: string, userEmail: string, userId: string): Promise<{ success: boolean; message: string }> {
    if (!adminDb) {
        console.error('Firebase Admin not initialized');
        return { success: false, message: 'Server configuration error. Contact support.' };
    }

    try {
        console.log(`[AdminRecovery] Attempting recovery for ${userEmail} with token ${token}`);

        // 1. Get Token Doc (Bypass client rules)
        const tokenRef = adminDb.collection('admin_setup_tokens').doc(token);
        const tokenSnap = await tokenRef.get();

        if (!tokenSnap.exists) {
            return { success: false, message: 'Invalid token.' };
        }

        const data = tokenSnap.data();
        if (!data) return { success: false, message: 'Token data corrupted.' };

        // 2. Validate Token
        if (data.status !== 'pending') {
            return { success: false, message: `Token is ${data.status}.` };
        }

        // Email check (Optional: recovery tokens might be generic, but code implies email binding)
        // If the token has an email field, enforce it. If not, allow any.
        // Based on existing adminService, it has email.
        if (data.email && data.email.toLowerCase() !== userEmail.toLowerCase()) {
            return { success: false, message: 'This token is not for this email address.' };
        }

        // Expiry check
        const now = new Date();
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (now > expiresAt) {
            await tokenRef.update({ status: 'expired' });
            return { success: false, message: 'Token has expired.' };
        }

        // 3. Perform Promotion (Atomic if possible, or sequential)
        // Update Token -> used
        await tokenRef.update({
            status: 'used',
            usedBy: userEmail,
            usedAt: FieldValue.serverTimestamp()
        });

        // Update User -> admin
        await adminDb.collection('users').doc(userId).update({
            role: 'admin',
            adminTokenUsed: token,
            updatedAt: FieldValue.serverTimestamp()
        });

        console.log(`[AdminRecovery] Success. Promoted ${userEmail} to admin.`);
        return { success: true, message: 'Successfully recovered admin access.' };

    } catch (error: any) {
        console.error('[AdminRecovery] Error:', error);
        return { success: false, message: error.message || 'Recovery failed.' };
    }
}
