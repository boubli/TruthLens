import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import {
    UserTier,
    UserSubscription,
    DietaryPreferences,
    UserProfile,
    DEFAULT_SUBSCRIPTION,
    DEFAULT_DIETARY_PREFERENCES,
    getTierFeatures,
    TierFeatures,
} from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Get user subscription from Firestore
 */
export const getUserSubscription = async (userId: string): Promise<UserSubscription> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.subscription) {
                return {
                    tier: data.subscription.tier || 'free',
                    startDate: data.subscription.startDate?.toDate() || new Date(),
                    endDate: data.subscription.endDate?.toDate() || null,
                    autoRenew: data.subscription.autoRenew || false,
                };
            }
        }

        // Return default subscription if not found
        return DEFAULT_SUBSCRIPTION;
    } catch (error) {
        console.error('Error fetching user subscription:', error);
        return DEFAULT_SUBSCRIPTION;
    }
};

/**
 * Get user's full profile including subscription and preferences
 */
export const getUserProfile = async (userId: string, email: string, displayName: string | null, photoURL: string | null): Promise<UserProfile> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                uid: userId,
                email: data.email || email,
                displayName: data.displayName || displayName,
                photoURL: data.photoURL || photoURL,
                role: data.role || 'user',
                subscription: {
                    tier: data.subscription?.tier || 'free',
                    startDate: data.subscription?.startDate?.toDate() || new Date(),
                    endDate: data.subscription?.endDate?.toDate() || null,
                    autoRenew: data.subscription?.autoRenew || false,
                },
                dietaryPreferences: data.dietaryPreferences || DEFAULT_DIETARY_PREFERENCES,
                preferences: data.preferences, // Map preferences
                createdAt: data.createdAt?.toDate() || new Date(),
                hasSeenWelcome: data.hasSeenWelcome || false,
            };
        }

        // Create new user profile if doesn't exist
        const newProfile: UserProfile = {
            uid: userId,
            email,
            displayName,
            photoURL,
            subscription: DEFAULT_SUBSCRIPTION,
            dietaryPreferences: DEFAULT_DIETARY_PREFERENCES,
            preferences: { language: 'en' }, // Default language
            createdAt: new Date(),
        };

        await setDoc(userDocRef, {
            email,
            displayName,
            photoURL,
            subscription: DEFAULT_SUBSCRIPTION,
            dietaryPreferences: DEFAULT_DIETARY_PREFERENCES,
            preferences: { language: 'en' }, // Persist default
            createdAt: serverTimestamp(),
        });

        return newProfile;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * Update user tier (admin function)
 */
export const updateUserTier = async (userId: string, tier: UserTier, endDate?: Date): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userDocRef, {
            'subscription.tier': tier,
            'subscription.startDate': serverTimestamp(),
            'subscription.endDate': endDate ? Timestamp.fromDate(endDate) : null,
        });
    } catch (error) {
        console.error('Error updating user tier:', error);
        throw error;
    }
};

/**
 * Update dietary preferences (Pro users only)
 */
export const updateDietaryPreferences = async (userId: string, preferences: DietaryPreferences): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userDocRef, {
            dietaryPreferences: preferences,
        });
    } catch (error) {
        console.error('Error updating dietary preferences:', error);
        throw error;
    }
};

/**
 * Mark user as having seen the special welcome animation
 */
export const markUserAsWelcomed = async (userId: string): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        await setDoc(userDocRef, { hasSeenWelcome: true }, { merge: true });
        console.log(`[USER] Marked user ${userId} as welcomed`);
    } catch (error) {
        console.error('Error marking user as welcomed:', error);
        throw error;
    }
};

/**
 * Check if subscription is expired
 */
export const checkSubscriptionExpiry = (subscription: UserSubscription): boolean => {
    if (!subscription.endDate) return false; // No expiry
    return new Date() > subscription.endDate;
};

/**
 * Get feature access for a user
 */
export const getFeatureAccess = (tier: UserTier): TierFeatures => {
    return getTierFeatures(tier);
};

/**
 * Check if user has access to a specific feature
 */
export const hasFeatureAccess = <K extends keyof TierFeatures>(tier: UserTier, feature: K): TierFeatures[K] => {
    const features = getTierFeatures(tier);
    return features[feature];
};

/**
 * Create a cancellation request
 */
export const createCancellationRequest = async (userId: string, email: string, reason: string): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'cancellationRequests'), {
            userId,
            email,
            reason,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating cancellation request:', error);
        throw error;
    }
};

/**
 * Get all cancellation requests (Admin)
 */
export const getCancellationRequests = async () => {
    try {
        const q = query(collection(db, 'cancellationRequests'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching cancellation requests:', error);
        return [];
    }
};
