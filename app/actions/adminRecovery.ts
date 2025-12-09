'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as OTPAuth from 'otpauth';

export async function recoverAdminAccount(token: string, totpCode: string, userEmail: string, userId: string): Promise<{ success: boolean; message: string }> {
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

        // 2. Validate Token Status
        if (data.status !== 'pending') {
            return { success: false, message: `Token is ${data.status}.` };
        }

        // Email check
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

        // 3. 🔐 Validate TOTP Code
        if (data.secret) {
            // Strict 2FA Mode
            if (!totpCode) {
                return { success: false, message: '2FA Code required for this token.' };
            }

            const totp = new OTPAuth.TOTP({
                issuer: 'TruthLens',
                label: 'Admin Recovery',
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(data.secret)
            });

            const delta = totp.validate({ token: totpCode, window: 1 });

            if (delta === null) {
                console.warn(`[AdminRecovery] Invalid TOTP code for token ${token}`);
                return { success: false, message: 'Invalid 2FA Code.' };
            }
        } else {
            // Emergency / Legacy Mode (No Secret in DB)
            console.warn(`[AdminRecovery] allowing recovery without 2FA for token ${token} (Emergency Mode)`);
        }

        // 4. Perform Promotion
        await tokenRef.update({
            status: 'used',
            usedBy: userEmail,
            usedAt: FieldValue.serverTimestamp()
        });

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
