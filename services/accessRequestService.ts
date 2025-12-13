import { db } from '@/lib/firebase';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query,
    where, orderBy, Timestamp, increment, addDoc
} from 'firebase/firestore';
import { AccessCode, FreeAccessRequest, UserNotification, AccessCodeTier } from '@/types/accessRequest';

const ACCESS_CODES_COLLECTION = 'accessCodes';
const ACCESS_REQUESTS_COLLECTION = 'freeAccessRequests';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// ==================== ACCESS CODES ====================

// ==================== ACCESS CODES (Client API Wrapper) ====================

/**
 * Validate an access code (Secure Server API)
 */
export const validateAccessCode = async (code: string): Promise<{ valid: boolean; codeData?: AccessCode; error?: string }> => {
    try {
        const response = await fetch('/api/access/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[AccessRequest] API Error:', error);
        return { valid: false, error: 'Network error validating code' };
    }
};

/**
 * Create a new access code (Admin only)
 */
export const createAccessCode = async (
    code: string,
    tier: AccessCodeTier,
    type: 'student' | 'general',
    usageLimit: number,
    expiresAt: Date | null,
    adminId: string
): Promise<string> => {
    const codeRef = doc(collection(db, ACCESS_CODES_COLLECTION));
    await setDoc(codeRef, {
        code: code.toUpperCase(),
        tier,
        type,
        usageLimit,
        usedCount: 0,
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        createdBy: adminId,
        createdAt: Timestamp.now(),
        active: true
    });
    return codeRef.id;
};

/**
 * Get all access codes (Admin)
 */
export const getAllAccessCodes = async (): Promise<AccessCode[]> => {
    const codesRef = collection(db, ACCESS_CODES_COLLECTION);
    const q = query(codesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessCode));
};

/**
 * Toggle access code active status
 */
export const toggleAccessCodeStatus = async (codeId: string, active: boolean): Promise<void> => {
    await updateDoc(doc(db, ACCESS_CODES_COLLECTION, codeId), { active });
};

/**
 * Delete access code permanently from Firebase
 */
export const deleteAccessCode = async (codeId: string): Promise<void> => {
    await deleteDoc(doc(db, ACCESS_CODES_COLLECTION, codeId));
};

// ==================== ACCESS REQUESTS (Client API Wrapper) ====================

/**
 * Submit a free access request (Secure Server API)
 */
export const submitAccessRequest = async (
    userId: string,
    data: {
        fullName: string;
        username: string;
        email: string;
        useAccountEmail: boolean;
        phone: string;
        reason: string;
        code: string;
        isStudent: boolean;
        studentProofUrl: string | null;
        studentProofBase64?: string | null;
    }
): Promise<{ success: boolean; requestId?: string; autoApproved?: boolean; tier?: string; error?: string }> => {
    try {
        // Get current auth token
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();

        if (!token) throw new Error('Not authenticated');

        const response = await fetch('/api/access/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            return { success: false, error: result.error || 'Submission failed' };
        }

        return result;
    } catch (error) {
        console.error('[AccessRequest] Submit API Error:', error);
        return { success: false, error: 'Failed to submit request' };
    }
};

/**
 * Get all pending requests (Admin)
 */
export const getPendingRequests = async (): Promise<FreeAccessRequest[]> => {
    const reqRef = collection(db, ACCESS_REQUESTS_COLLECTION);
    const q = query(reqRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreeAccessRequest));
};

/**
 * Get all requests (Admin)
 */
export const getAllRequests = async (): Promise<FreeAccessRequest[]> => {
    const reqRef = collection(db, ACCESS_REQUESTS_COLLECTION);
    const q = query(reqRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreeAccessRequest));
};

/**
 * Approve a request (Admin)
 */
export const approveRequest = async (requestId: string, adminId: string): Promise<boolean> => {
    try {
        const requestRef = doc(db, ACCESS_REQUESTS_COLLECTION, requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) return false;

        const request = requestSnap.data() as FreeAccessRequest;

        // Calculate expiry (3 months from now)
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await updateDoc(requestRef, {
            status: 'approved',
            processedAt: Timestamp.now(),
            processedBy: adminId,
            accessExpiresAt: Timestamp.fromDate(expiresAt)
        });

        // Upgrade user tier
        await upgradeTier(request.userId, request.codeTier, expiresAt);

        // Notify user
        await createNotification(request.userId, 'access_approved',
            '🎉 Free Access Approved!',
            `Your request for free access has been approved! You now have ${request.codeTier.toUpperCase()} access for 3 months.`,
            { requestId, tier: request.codeTier, expiresAt }
        );

        return true;
    } catch (error) {
        console.error('[AccessRequest] Error approving request:', error);
        return false;
    }
};

/**
 * Deny a request (Admin)
 */
export const denyRequest = async (requestId: string, adminId: string, reason: string): Promise<boolean> => {
    try {
        const requestRef = doc(db, ACCESS_REQUESTS_COLLECTION, requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) return false;

        const request = requestSnap.data() as FreeAccessRequest;

        await updateDoc(requestRef, {
            status: 'denied',
            denialReason: reason,
            processedAt: Timestamp.now(),
            processedBy: adminId
        });

        // Notify user with reason
        await createNotification(request.userId, 'access_denied',
            '❌ Free Access Request Denied',
            `Your request for free access was not approved. Reason: ${reason}`,
            { requestId }
        );

        return true;
    } catch (error) {
        console.error('[AccessRequest] Error denying request:', error);
        return false;
    }
};

// ==================== USER TIER MANAGEMENT ====================

/**
 * Upgrade user to a tier with expiry
 */
const upgradeTier = async (userId: string, tier: AccessCodeTier, expiresAt: Date): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    // Store original tier for revert later
    const originalTier = userSnap.exists() ? (userSnap.data()?.subscription?.tier || 'free') : 'free';

    await updateDoc(userRef, {
        'subscription.tier': tier,
        'subscription.freeAccessGranted': true,
        'subscription.freeAccessExpiresAt': Timestamp.fromDate(expiresAt),
        'subscription.originalTier': originalTier
    });
};

// ==================== NOTIFICATIONS ====================

/**
 * Create a notification for user
 */
export const createNotification = async (
    userId: string,
    type: UserNotification['type'],
    title: string,
    message: string,
    metadata?: UserNotification['metadata']
): Promise<void> => {
    const notifRef = doc(collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_COLLECTION));
    await setDoc(notifRef, {
        type,
        title,
        message,
        read: false,
        createdAt: Timestamp.now(),
        metadata: metadata || null
    });
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId: string): Promise<UserNotification[]> => {
    const notifRef = collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_COLLECTION);
    const q = query(notifRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (userId: string, notificationId: string): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, userId, NOTIFICATIONS_COLLECTION, notificationId), {
        read: true
    });
};

/**
 * Get user's access request history
 */
export const getUserAccessRequests = async (userId: string): Promise<FreeAccessRequest[]> => {
    const reqRef = collection(db, ACCESS_REQUESTS_COLLECTION);
    const q = query(reqRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreeAccessRequest));
};
