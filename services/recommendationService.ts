import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getUserHistory } from './historyService';
import { getSwarmRecommendations, getSwarmPairedRecommendations, searchExternalDatabases } from './aiService';
import { searchProducts, ProductData } from './productService';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface Recommendation {
    id: string; // Product ID or temporary ID
    name: string;
    brand: string;
    description: string;
    image: string;
    grade: string;
    reason: string; // Why AI suggested it
    source: 'off' | 'external' | 'ai' | 'usda' | 'foodb' | 'generic'; // Expanded sources
}

interface UserRecommendationsFunc {
    items: Recommendation[];
    lastUpdated: Date;
}

/**
 * Main function to get recommendations for a user.
 * Checks cache first, then generates new ones.
 */
export interface RecommendationPairResult {
    id: string;
    rejected: Recommendation;
    recommended: Recommendation;
}

/**
 * Main function to get PAIRED recommendations for a user.
 */
export const getUserPairedRecommendations = async (userId: string): Promise<RecommendationPairResult[]> => {
    try {
        const userRecsRef = doc(db, 'users', userId, 'data', 'paired_recommendations');
        const snapshot = await getDoc(userRecsRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            const lastUpdated = (data.lastUpdated as Timestamp)?.toDate().getTime();
            const now = Date.now();

            if (now - lastUpdated < CACHE_DURATION_MS && data.items && data.items.length > 0) {
                console.log('✅ [Recommendations] Returning cached pairs');
                return data.items as RecommendationPairResult[];
            }
        }

        console.log('🔄 [Recommendations] Cache expired or missing. Generating new pairs...');
        return await generateAndCachePairedRecommendations(userId);

    } catch (error) {
        console.error("Error getting paired recommendations:", error);
        return [];
    }
};

import { searchAllSources } from './externalProductService';

// ... other imports

const enrichPair = async (pair: any, historyItems: any[] = []): Promise<RecommendationPairResult> => {
    // A. Enrich Rejected Item
    let rejectedItem: Recommendation = {
        id: `rej-${Date.now()}-${Math.random()}`,
        name: pair.rejected.name,
        brand: pair.rejected.brand,
        description: pair.rejected.reason,
        image: '',
        grade: 'E',
        reason: pair.rejected.reason,
        source: 'ai'
    };

    // 1. Try finding EXACT image in history (Best "Real Photo" source)
    // Supports matching by exact name OR fuzzy if history item has image
    const historyMatch = historyItems.find(h =>
    (h.title.toLowerCase().includes(pair.rejected.name.toLowerCase()) ||
        pair.rejected.name.toLowerCase().includes(h.title.toLowerCase()))
    );

    if (historyMatch && historyMatch.imageUrl) {
        // Use the actual image from history (Scan/Search)
        rejectedItem = { ...rejectedItem, image: historyMatch.imageUrl, name: historyMatch.title };
        if (historyMatch.grade) rejectedItem.grade = historyMatch.grade;
    } else {
        // 2. If not in history or no image, Search External Sources (OFF, USDA, etc.)
        // Try precise search first: Brand + Name
        let searchResults = await searchAllSources(`${pair.rejected.brand} ${pair.rejected.name}`);

        // If no results, try just Name (broader)
        if (searchResults.length === 0) {
            searchResults = await searchAllSources(pair.rejected.name);
        }

        if (searchResults.length > 0) {
            const best = searchResults[0];
            rejectedItem = {
                ...rejectedItem,
                id: best.id,
                image: best.image,
                grade: best.grade || 'E',
                name: best.name,
                source: best.source
            };
        }
    }

    // B. Enrich Recommended Item
    let recommendedItem: Recommendation = {
        id: `rec-${Date.now()}-${Math.random()}`,
        name: pair.recommended.name,
        brand: pair.recommended.brand,
        description: pair.recommended.reason,
        image: '',
        grade: 'A',
        reason: pair.recommended.reason,
        source: 'ai'
    };

    // Search External Sources for the Good Item
    let recResults = await searchAllSources(`${pair.recommended.brand} ${pair.recommended.name}`);

    // If empty, try broader search to find SOMETHING to show
    if (recResults.length === 0) {
        // Try searching just the name
        recResults = await searchAllSources(pair.recommended.name);
    }

    if (recResults.length > 0) {
        // Filter: Prioritize items with REAL Brands over "Unknown Brand"
        // Since we sort by popularity, usually the famous brand is top, but we double check.
        const validBrandResults = recResults.filter(p =>
            p.brand &&
            !['unknown brand', 'unbranded commodity', 'generic'].includes(p.brand.toLowerCase())
        );

        // Use valid brand list if available, otherwise fallback to full list
        const candidates = validBrandResults.length > 0 ? validBrandResults : recResults;

        // Prefer items with images and good grades
        const bestRec = candidates.find(p => p.image && ['a', 'b'].includes(p.grade?.toLowerCase() || ''))
            || candidates.find(p => p.image) // At least has image
            || candidates[0];

        recommendedItem = {
            ...recommendedItem,
            id: bestRec.id,
            name: bestRec.name,
            brand: bestRec.brand,
            image: bestRec.image,
            grade: bestRec.grade || 'A',
            source: bestRec.source
        };
    }

    return {
        id: `pair-${Date.now()}-${Math.random()}`,
        rejected: rejectedItem,
        recommended: recommendedItem
    };
}

const generateAndCachePairedRecommendations = async (userId: string): Promise<RecommendationPairResult[]> => {
    try {
        // 1. Get recent bad history
        const history = await getUserHistory(userId);
        const badItems = history.filter(h => ['d', 'e'].includes(h.grade?.toLowerCase() || ''));

        if (badItems.length === 0) return [];

        // 2. Prepare context for AI
        const historyContext = badItems.slice(0, 10).map(h => `- ${h.title} (Grade: ${h.grade})`).join('\n');

        // 3. Get generic pairings from Swarm
        const rawPairs = await getSwarmPairedRecommendations(historyContext);

        // 4. Enrich them with real data
        const enrichedPairs: RecommendationPairResult[] = [];
        for (const pair of rawPairs) {
            const enriched = await enrichPair(pair, history);
            enrichedPairs.push(enriched);
        }

        // 5. Cache
        if (enrichedPairs.length > 0) {
            const userRecsRef = doc(db, 'users', userId, 'data', 'paired_recommendations');
            await setDoc(userRecsRef, {
                items: enrichedPairs,
                lastUpdated: serverTimestamp()
            });
        }

        return enrichedPairs;
    } catch (e) {
        console.error("Error generating pairs:", e);
        return [];
    }
};

/**
 * TRIGGER: Called when a new item is added to history.
 * If grade is bad, generates a recommendation immediately.
 */
export const triggerRecommendationAdded = async (userId: string, historyItem: { title: string, grade?: string | null, imageUrl?: string }) => {
    // Only process if it's potentially "bad" or unknown
    const grade = historyItem.grade?.toLowerCase();
    if (grade && ['a', 'b'].includes(grade)) return;

    try {
        console.log(`[RecTrigger] Generating pair for new bad item: ${historyItem.title}`);
        const context = `- ${historyItem.title} (Grade: ${grade || 'Unknown'})`;
        const pairs = await getSwarmPairedRecommendations(context);

        if (pairs.length > 0) {
            // Pass the single history item array to checking logic so it finds the image!
            const mockHistoryList = [{
                title: historyItem.title,
                grade: historyItem.grade,
                imageUrl: historyItem.imageUrl
            }];
            const newPair = await enrichPair(pairs[0], mockHistoryList);

            // Fetch existing
            const userRecsRef = doc(db, 'users', userId, 'data', 'paired_recommendations');
            const snapshot = await getDoc(userRecsRef);
            let existing: RecommendationPairResult[] = [];
            if (snapshot.exists()) {
                existing = snapshot.data().items || [];
            }

            // Prepend new pair
            const updated = [newPair, ...existing].slice(0, 50);

            await setDoc(userRecsRef, {
                items: updated,
                lastUpdated: serverTimestamp()
            });
            console.log(`[RecTrigger] Added new recommendation pair.`);
        }
    } catch (e) {
        console.error("[RecTrigger] Error:", e);
    }
};

/**
 * TRIGGER: Called when an item is removed from history.
 * Removes associated recommendations.
 */
export const triggerRecommendationRemoved = async (userId: string, itemTitle: string) => {
    try {
        const userRecsRef = doc(db, 'users', userId, 'data', 'paired_recommendations');
        const snapshot = await getDoc(userRecsRef);

        if (snapshot.exists()) {
            const existing: RecommendationPairResult[] = snapshot.data().items || [];
            // Remove where rejected item name is similar to deleted item
            const updated = existing.filter(p => !p.rejected.name.toLowerCase().includes(itemTitle.toLowerCase()));

            if (updated.length !== existing.length) {
                await setDoc(userRecsRef, {
                    items: updated,
                    lastUpdated: serverTimestamp()
                });
                console.log(`[RecTrigger] Removed ${existing.length - updated.length} pairs linked to "${itemTitle}".`);
            }
        }
    } catch (e) {
        console.error("[RecTrigger] Error removing pair:", e);
    }
};

/**
 * Deprecated: Generates fresh recommendations using AI Swarm and verifies against data sources.
 */
export const getUserRecommendations = async (userId: string): Promise<Recommendation[]> => {
    return [];
};
