import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer, Timestamp } from 'firebase/firestore';
import { UserTier, getTierFeatures } from '@/types/user';

const HISTORY_COLLECTION = 'history';
const FREE_DAILY_SCAN_LIMIT = 5;

/**
 * Check if the user has reached their daily scan limit
 */
export const checkScanLimit = async (userId: string, tier: UserTier): Promise<{ allowed: boolean, remaining: number, limit: number | null }> => {
    const features = getTierFeatures(tier);
    const limit = features.dailyScanLimit;

    // Unlimited scans
    if (limit === -1) {
        return { allowed: true, remaining: 9999, limit: null };
    }

    try {
        // Calculate start of today
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const q = query(
            collection(db, HISTORY_COLLECTION),
            where('userId', '==', userId),
            where('type', '==', 'scan'),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay))
        );

        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;

        const remaining = Math.max(0, limit - count);

        return {
            allowed: count < limit,
            remaining,
            limit
        };
    } catch (error) {
        console.error('Error checking scan limit:', error);
        // Fail open if there's an error to not block users unnecessarily
        return { allowed: true, remaining: 1, limit: limit };
    }
};

/**
 * Get formatted remaining scans message
 */
export const getScanLimitMessage = (tier: UserTier, remaining: number): string => {
    const features = getTierFeatures(tier);
    if (features.dailyScanLimit === -1) return 'Unlimited scans';
    if (remaining === 0) return 'Daily limit reached';
    return `${remaining} daily scan${remaining === 1 ? '' : 's'} remaining`;
};
