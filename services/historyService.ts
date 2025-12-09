import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { UserTier, getTierFeatures } from '@/types/user';
import { triggerRecommendationAdded, triggerRecommendationRemoved } from './recommendationService';

export interface HistoryItem {
    id?: string;
    userId: string;
    type: 'scan' | 'search';
    title: string;
    grade?: string; // A, B, C, D, E
    productId?: string;
    imageUrl?: string;
    createdAt?: any;
}

// Collection References
const HISTORY_COLLECTION = 'history';
const PRODUCTS_COLLECTION = 'products';

const FREE_USER_HISTORY_LIMIT = 10;

/**
 * Add an item to the user's history (prevents duplicates)
 */
export const addToHistory = async (userId: string, item: Omit<HistoryItem, 'userId' | 'createdAt'>) => {
    try {
        // Check for duplicates first if productId is present
        if (item.productId) {
            const q = query(
                collection(db, HISTORY_COLLECTION),
                where("userId", "==", userId),
                where("productId", "==", item.productId),
                where("type", "==", item.type), // Also match type (scan vs search) or maybe just productId? logic says if I scan it again, I want ittop.
                firestoreLimit(1)
            );

            const existingDocs = await getDocs(q);

            if (!existingDocs.empty) {
                // Update existing document
                const docId = existingDocs.docs[0].id;
                console.log('[HistoryService] ♻️ Found duplicate, updating timestamp for:', docId);
                const docRef = doc(db, HISTORY_COLLECTION, docId);
                await import('firebase/firestore').then(({ updateDoc }) =>
                    updateDoc(docRef, {
                        createdAt: serverTimestamp(),
                        // Update title/grade in case they changed (e.g. better data fetched)
                        title: item.title,
                        grade: item.grade ?? null,
                        imageUrl: item.imageUrl ?? null
                    })
                );
                return docId;
            }
        }

        const historyData = {
            userId,
            ...item,
            grade: item.grade ?? null, // Ensure undefined is converted to null
            createdAt: serverTimestamp(),
        };

        // Remove undefined fields to prevent Firebase errors
        Object.keys(historyData).forEach(key => {
            if (historyData[key as keyof typeof historyData] === undefined) {
                delete historyData[key as keyof typeof historyData];
            }
        });

        const docRef = await addDoc(collection(db, HISTORY_COLLECTION), historyData);

        // TRIGGER: Update Recommendations if this is a new "bad" item
        // Don't await this, let it run in background
        triggerRecommendationAdded(userId, {
            title: item.title,
            grade: item.grade || undefined,
            imageUrl: item.imageUrl // Pass image URL for instant enrichment
        }).catch((err: any) => console.error("Trigger Failed:", err));

        return docRef.id;
    } catch (error) {
        console.error("Error adding history: ", error);
        throw error;
    }
};

/**
 * Fetch history for a specific user (all items, no limit)
 */
export const getUserHistory = async (userId: string) => {
    try {
        const q = query(
            collection(db, HISTORY_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Timestamp to readable date if needed, or keep as object
            createdAt: (doc.data().createdAt as Timestamp)?.toDate()
        })) as HistoryItem[];
    } catch (error) {
        console.error("Error fetching history: ", error);
        return []; // Return empty on error to avoid crashing UI
    }
};

/**
 * Fetch history with tier-based limits
 * Free users: max 10 items
 * Pro users: unlimited
 */
export const getUserHistoryWithLimit = async (userId: string, tier: UserTier) => {
    try {
        console.log('[HistoryService] 📥 Fetching history for userId:', userId, 'Tier:', tier);
        const features = getTierFeatures(tier);
        const limitCnt = features.historyLimit;

        let q;

        if (limitCnt !== -1) {
            // Limited history
            console.log('[HistoryService] 🔒 Tier limited to', limitCnt, 'items');
            q = query(
                collection(db, HISTORY_COLLECTION),
                where("userId", "==", userId),
                orderBy("createdAt", "desc"),
                firestoreLimit(limitCnt)
            );
        } else {
            // Unlimited
            console.log('[HistoryService] 💎 Unlimited history access');
            q = query(
                collection(db, HISTORY_COLLECTION),
                where("userId", "==", userId),
                orderBy("createdAt", "desc")
            );
        }

        console.log('[HistoryService] 🔍 Executing Firestore query...');
        const querySnapshot = await getDocs(q);
        console.log('[HistoryService] ✅ Query complete. Docs found:', querySnapshot.size);

        const items = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // console.log('[HistoryService] 📄 Doc:', doc.id, 'Data:', data);
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate()
            };
        }) as HistoryItem[];

        const result = {
            items,
            hasMore: limitCnt !== -1 && items.length >= limitCnt,
            limit: limitCnt !== -1 ? limitCnt : null,
        };

        console.log('[HistoryService] 📊 Returning:', result.items.length, 'items, hasMore:', result.hasMore);
        return result;
    } catch (error) {
        console.error("[HistoryService] ❌ ERROR fetching history:", error);
        if (error instanceof Error) {
            console.error('[HistoryService] Error name:', error.name);
            console.error('[HistoryService] Error message:', error.message);
            console.error('[HistoryService] Error stack:', error.stack);
        }
        return { items: [], hasMore: false, limit: null };
    }
};



/**
 * Delete a history item
 */
export const deleteHistoryItem = async (itemId: string, userId?: string) => {
    try {
        const docRef = doc(db, HISTORY_COLLECTION, itemId);

        // 1. Get doc data before deletion to trigger Side Effects
        const snapshot = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
        const data = snapshot.exists() ? snapshot.data() : null;

        await deleteDoc(docRef);

        // 2. Trigger Recommendation Removal Sync
        if (data && data.title && data.userId) {
            // Use userId from doc if available, or passed param
            const uid = data.userId || userId;
            if (uid) {
                triggerRecommendationRemoved(uid, data.title).catch(console.error);
            }
        }
    } catch (error) {
        console.error("Error deleting history item: ", error);
        throw error;
    }
};

/**
 * Export history to CSV (Pro only)
 */
export const exportHistoryToCSV = async (userId: string): Promise<string> => {
    try {
        const history = await getUserHistory(userId);

        // Create CSV header
        let csv = 'Date,Type,Product Name,Grade\n';

        // Add rows
        history.forEach(item => {
            const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
            const type = item.type;
            const title = item.title.replace(/,/g, ';'); // Replace commas to avoid CSV issues
            const grade = item.grade || 'N/A';
            csv += `${date},${type},${title},${grade}\n`;
        });

        return csv;
    } catch (error) {
        console.error("Error exporting to CSV: ", error);
        throw error;
    }
};

/**
 * Export history to PDF (Pro only)
 * Returns HTML string that can be converted to PDF client-side
 */
export const exportHistoryToPDF = async (userId: string): Promise<string> => {
    try {
        const history = await getUserHistory(userId);

        // Create HTML for PDF generation
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>TruthLens History Export</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #6C63FF; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #6C63FF; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .grade-A, .grade-B { color: green; font-weight: bold; }
                    .grade-C { color: orange; font-weight: bold; }
                    .grade-D, .grade-E { color: red; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>TruthLens - Scan & Search History</h1>
                <p>Export Date: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Product Name</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        history.forEach(item => {
            const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
            const type = item.type === 'scan' ? 'Scan' : 'Search';
            const title = item.title;
            const grade = item.grade || 'N/A';
            const gradeClass = grade !== 'N/A' ? `grade-${grade}` : '';

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${type}</td>
                    <td>${title}</td>
                    <td class="${gradeClass}">${grade}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        return html;
    } catch (error) {
        console.error("Error exporting to PDF: ", error);
        throw error;
    }
};
