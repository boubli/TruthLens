import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    deleteDoc,
} from 'firebase/firestore';
import { PaymentRequest, PaymentStatus } from '@/types/payment';
import { updateUserTier } from './subscriptionService';
import { getSystemSettings } from './systemService';

const PAYMENT_REQUESTS_COLLECTION = 'paymentRequests';

/**
 * Create a new payment request
 */

export const createPaymentRequest = async (
    userId: string,
    userEmail: string,
    userName: string,
    tier: 'plus' | 'pro' | 'ultimate' = 'pro',
    type: 'manual' | 'paid' = 'manual',
    billingCycle: 'monthly' | 'lifetime' = 'monthly'
): Promise<string> => {
    try {
        // Check if user already has a pending request
        const existingRequest = await getPendingPaymentRequest(userId);
        if (existingRequest && existingRequest.status === 'pending') {
            throw new Error('You already have a pending upgrade request');
        }

        let price = 0;

        if (type === 'paid') {
            try {
                const settings = await getSystemSettings();
                if (settings.tierConfig && settings.tierConfig[tier]) {
                    price = billingCycle === 'monthly'
                        ? settings.tierConfig[tier].pricing.monthly
                        : settings.tierConfig[tier].pricing.lifetime;
                } else {
                    // Fallback Defaults
                    const prices = {
                        plus: { monthly: 3.99, lifetime: 19.99 },
                        pro: { monthly: 7.99, lifetime: 49.99 },
                        ultimate: { monthly: 14.99, lifetime: 79.99 }
                    };
                    price = prices[tier][billingCycle];
                }
            } catch (error) {
                console.error('[PaymentService] Warning: Could not fetch system pricing, using defaults.', error);
                const prices = {
                    plus: { monthly: 3.99, lifetime: 19.99 },
                    pro: { monthly: 7.99, lifetime: 49.99 },
                    ultimate: { monthly: 14.99, lifetime: 79.99 }
                };
                price = prices[tier][billingCycle];
            }
        }

        const requestData = {
            userId,
            userEmail,
            userName,
            tier,
            price,
            billingCycle,
            type,
            status: type === 'paid' ? 'completed' : 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, PAYMENT_REQUESTS_COLLECTION), requestData);
        console.log('[PaymentService] ✅ Payment request created:', docRef.id);

        // If paid, upgrade immediately (Simulation)
        if (type === 'paid') {
            await updateUserTier(userId, tier);
        }

        return docRef.id;
    } catch (error) {
        console.error('[PaymentService] ❌ Error creating payment request:', error);
        throw error;
    }
};

/**
 * Simulate a Stripe Payment (Mock)
 */
export const simulateStripePayment = async (
    userId: string,
    userEmail: string,
    userName: string,
    tier: 'plus' | 'pro' | 'ultimate',
    billingCycle: 'monthly' | 'lifetime' = 'monthly'
): Promise<boolean> => {
    try {
        // simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create a record of the "paid" transaction
        await createPaymentRequest(userId, userEmail, userName, tier, 'paid', billingCycle);
        return true;
    } catch (error) {
        console.error("Payment simulation failed", error);
        return false;
    }
};

/**
 * Get a specific payment request by ID
 */
export const getPaymentRequest = async (requestId: string): Promise<PaymentRequest | null> => {
    try {
        const docRef = doc(db, PAYMENT_REQUESTS_COLLECTION, requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName,
                tier: data.tier,
                price: data.price,
                status: data.status,
                paypalOrderId: data.paypalOrderId,
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate(),
                approvedBy: data.approvedBy,
                approvedAt: (data.approvedAt as Timestamp)?.toDate(),
                rejectedReason: data.rejectedReason,
                rejectedAt: (data.rejectedAt as Timestamp)?.toDate(),
            };
        }

        return null;
    } catch (error) {
        console.error('[PaymentService] Error fetching payment request:', error);
        return null;
    }
};

/**
 * Get all payment requests for a user
 */
export const getUserPaymentRequests = async (userId: string): Promise<PaymentRequest[]> => {
    try {
        const q = query(
            collection(db, PAYMENT_REQUESTS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate(),
                approvedAt: (data.approvedAt as Timestamp)?.toDate(),
                rejectedAt: (data.rejectedAt as Timestamp)?.toDate(),
            } as PaymentRequest;
        });
    } catch (error) {
        console.error('[PaymentService] Error fetching user payment requests:', error);
        return [];
    }
};

/**
 * Get pending payment request for a user
 */
export const getPendingPaymentRequest = async (userId: string): Promise<PaymentRequest | null> => {
    try {
        const q = query(
            collection(db, PAYMENT_REQUESTS_COLLECTION),
            where('userId', '==', userId),
            where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate(),
        } as PaymentRequest;
    } catch (error) {
        console.error('[PaymentService] Error fetching pending request:', error);
        return null;
    }
};

/**
 * Get all payment requests (admin only)
 */
export const getAllPaymentRequests = async (status?: PaymentStatus): Promise<PaymentRequest[]> => {
    try {
        let q;
        if (status) {
            q = query(
                collection(db, PAYMENT_REQUESTS_COLLECTION),
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                collection(db, PAYMENT_REQUESTS_COLLECTION),
                orderBy('createdAt', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate(),
                approvedAt: (data.approvedAt as Timestamp)?.toDate(),
                rejectedAt: (data.rejectedAt as Timestamp)?.toDate(),
            } as PaymentRequest;
        });
    } catch (error) {
        console.error('[PaymentService] Error fetching all payment requests:', error);
        return [];
    }
};

/**
 * Approve a payment request (admin only)
 */
export const approvePaymentRequest = async (
    requestId: string,
    adminId: string
): Promise<void> => {
    try {
        const requestDoc = await getPaymentRequest(requestId);
        if (!requestDoc) {
            throw new Error('Payment request not found');
        }

        // Update payment request status
        const docRef = doc(db, PAYMENT_REQUESTS_COLLECTION, requestId);
        await updateDoc(docRef, {
            status: 'approved',
            approvedBy: adminId,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Upgrade user to requested tier
        await updateUserTier(requestDoc.userId, requestDoc.tier);

        console.log('[PaymentService] ✅ Payment approved and user upgraded:', requestDoc.userId, 'to', requestDoc.tier);
    } catch (error) {
        console.error('[PaymentService] ❌ Error approving payment request:', error);
        throw error;
    }
};

/**
 * Reject a payment request (admin only)
 */
export const rejectPaymentRequest = async (
    requestId: string,
    reason: string
): Promise<void> => {
    try {
        const docRef = doc(db, PAYMENT_REQUESTS_COLLECTION, requestId);
        await updateDoc(docRef, {
            status: 'rejected',
            rejectedReason: reason,
            rejectedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log('[PaymentService] ❌ Payment request rejected:', requestId);
    } catch (error) {
        console.error('[PaymentService] Error rejecting payment request:', error);
        throw error;
    }
};

/**
 * Cancel a pending payment request (User or Admin)
 */
export const cancelPaymentRequest = async (requestId: string): Promise<void> => {
    try {
        const docRef = doc(db, PAYMENT_REQUESTS_COLLECTION, requestId);
        await deleteDoc(docRef);
        console.log('[PaymentService] 🗑️ Payment request cancelled/deleted:', requestId);
    } catch (error) {
        console.error('[PaymentService] Error cancelling payment request:', error);
        throw error;
    }
};
