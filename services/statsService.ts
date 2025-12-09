import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export interface DashboardStats {
    totalUsers: number;
    totalAdmins: number;
    totalPayments: number;
    totalRevenue: number;
    totalScans: number;
    userGrowth: number; // percentage
    revenueGrowth: number;
    scanGrowth: number;
}

/**
 * Get real-time dashboard statistics from Firestore
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        // Get current date and last month date for comparison
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const lastMonthTimestamp = Timestamp.fromDate(lastMonth);

        // --- Total Users (excluding admins) ---
        const usersRef = collection(db, 'users');

        // Use getDocs instead of getCountFromServer to avoid permission issues
        const usersSnap = await getDocs(usersRef);

        // Count users and admins separately
        let totalAdmins = 0;
        let totalUsers = 0;
        let newUsersCount = 0;

        usersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.role === 'admin') {
                totalAdmins++;
            } else {
                totalUsers++; // Only count non-admin users

                // Check if created in last month (for growth)
                if (data.createdAt) {
                    const createdDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    if (createdDate >= lastMonth) newUsersCount++;
                }
            }
        });

        console.log('[STATS] Users:', totalUsers, 'Admins:', totalAdmins);

        const userGrowth = totalUsers > 0 ? Math.round((newUsersCount / totalUsers) * 100) : 0;

        // --- Total Scans (from history collection) ---
        const historyRef = collection(db, 'history');
        const historySnap = await getDocs(historyRef);

        let totalScans = 0;
        let recentScansCount = 0;

        historySnap.forEach((doc) => {
            const data = doc.data();
            if (data.type === 'scan') {
                totalScans++;
                // Check if scan was in last month
                if (data.timestamp) {
                    const scanDate = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                    if (scanDate >= lastMonth) recentScansCount++;
                }
            }
        });

        const scanGrowth = totalScans > 0 ? Math.round((recentScansCount / totalScans) * 100) : 0;

        // --- Payments ---
        const paymentsRef = collection(db, 'paymentRequests');
        const approvedPaymentsQuery = query(paymentsRef, where('status', '==', 'approved'));
        const paymentsSnap = await getDocs(approvedPaymentsQuery);

        let totalRevenue = 0;
        let totalPayments = 0;
        let recentRevenue = 0;

        paymentsSnap.forEach((doc) => {
            const data = doc.data();
            totalPayments++;
            // Assuming tier prices: plus=$4.99, pro=$9.99, ultimate=$19.99
            const tierPrices: Record<string, number> = {
                plus: 4.99,
                pro: 9.99,
                ultimate: 19.99
            };
            const price = tierPrices[data.targetTier] || 0;
            totalRevenue += price;

            // Check if payment was in last month
            if (data.approvedAt && data.approvedAt.toDate() >= lastMonth) {
                recentRevenue += price;
            }
        });

        const revenueGrowth = totalRevenue > 0 ? Math.round((recentRevenue / totalRevenue) * 100) : 0;

        return {
            totalUsers,
            totalAdmins,
            totalPayments,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalScans,
            userGrowth,
            revenueGrowth,
            scanGrowth
        };
    } catch (error) {
        console.error('[STATS] Error fetching dashboard stats:', error);
        // Return zeros on error
        return {
            totalUsers: 0,
            totalAdmins: 0,
            totalPayments: 0,
            totalRevenue: 0,
            totalScans: 0,
            userGrowth: 0,
            revenueGrowth: 0,
            scanGrowth: 0
        };
    }
};
