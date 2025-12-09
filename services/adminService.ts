import { db } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, getDocs, getDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';

const TOKENS_COLLECTION = 'admin_setup_tokens';

export interface AdminInvite {
    token: string;
    email: string;
    status: 'pending' | 'used' | 'expired' | 'revoked';
    createdAt: any;
    expiresAt: any;
}

/**
 * Generate a new random admin setup token linked to an email
 */
import * as OTPAuth from 'otpauth';

/**
 * Generate a new random admin setup token linked to an email.
 * Includes a TOTP Secret for 2FA.
 */
export const generateAdminToken = async (email: string): Promise<{ token: string; secret: string; otpAuthUrl: string }> => {
    try {
        const token = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 chars (ID)

        // Generate TOTP Secret (Base32)
        const secret = new OTPAuth.Secret({ size: 20 });
        const secretStr = secret.base32;

        const totp = new OTPAuth.TOTP({
            issuer: 'TruthLens',
            label: `Admin Recovery (${email})`,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secret
        });

        const otpAuthUrl = totp.toString(); // otpauth://totp/... URL for QR Code

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

        await setDoc(doc(db, TOKENS_COLLECTION, token), {
            token,
            email: email.toLowerCase(),
            secret: secretStr, // Store secret
            status: 'pending',
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiresAt),
        });

        return { token, secret: secretStr, otpAuthUrl };
    } catch (error) {
        console.error('Error generating admin token:', error);
        throw error;
    }
};

/**
 * Revoke a specific token
 */
export const revokeAdminToken = async (token: string): Promise<void> => {
    try {
        await updateDoc(doc(db, TOKENS_COLLECTION, token), {
            status: 'revoked'
        });
    } catch (error) {
        console.error('Error revoking admin token:', error);
        throw error;
    }
};

/**
 * Get all admin invite tokens (history)
 */
export const getAdminInvites = async (): Promise<AdminInvite[]> => {
    try {
        const q = query(collection(db, TOKENS_COLLECTION), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
            token: doc.id,
            ...doc.data()
        } as AdminInvite));
    } catch (error) {
        console.error('Error fetching admin invites:', error);
        return [];
    }
};

/**
 * Validate and use an admin token
 */
export const validateAndUseAdminToken = async (token: string, userEmail: string): Promise<{ valid: boolean; error?: string }> => {
    try {
        const docRef = doc(db, TOKENS_COLLECTION, token);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { valid: false, error: 'Invalid token.' };
        }

        const data = docSnap.data() as AdminInvite;
        const now = new Date();

        if (data.status !== 'pending') {
            return { valid: false, error: `Token is ${data.status}.` };
        }

        if (data.email.toLowerCase() !== userEmail.toLowerCase()) {
            return { valid: false, error: 'This invite is not for this email address.' };
        }

        // Check expiry (convert Firestore Timestamp to Date if needed)
        const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (now > expiresAt) {
            // Auto-expire if found expired during validation
            await updateDoc(docRef, { status: 'expired' });
            return { valid: false, error: 'Token has expired.' };
        }

        // Token is valid, mark as used
        await updateDoc(docRef, { status: 'used' });
        return { valid: true };

    } catch (error: any) {
        console.error('Error validating token:', error);
        return { valid: false, error: error.message };
    }
};
