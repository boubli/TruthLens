/**
 * SearXNG Search Service
 * Uses a self-hosted SearXNG instance for web searches (replaces paid SerpAPI)
 */

import axios from 'axios';
import { getSystemSettings } from './systemService';

// Default SearXNG URL (can be overridden in Admin settings)
const DEFAULT_SEARXNG_URL = 'http://20.199.129.203:8080';

export interface SearXNGResult {
    title: string;
    url: string;
    content: string; // snippet/description
    engine: string;
    img_src?: string;
    thumbnail?: string;
    score?: number;
}

export interface SearXNGResponse {
    query: string;
    results: SearXNGResult[];
    suggestions: string[];
    infoboxes: any[];
}

/**
 * Get the configured SearXNG URL from Admin settings or use default
 */
const getSearXNGUrl = async (): Promise<string> => {
    try {
        const settings = await getSystemSettings();
        return settings.apiKeys?.searxngUrl || DEFAULT_SEARXNG_URL;
    } catch (e) {
        console.warn('[SearXNG] Could not fetch settings, using default URL');
        return DEFAULT_SEARXNG_URL;
    }
};

/**
 * Search using SearXNG
 * @param query - Search query
 * @param categories - Optional: 'general', 'images', 'news', 'science', etc.
 * @param engines - Optional: specific engines like 'google', 'bing', 'duckduckgo'
 */
/**
 * Search using SearXNG
 * @param query - Search query
 * @param categories - Optional: 'general', 'images', 'news', 'science', etc.
 * @param engines - Optional: specific engines like 'google', 'bing', 'duckduckgo'
 */
export const searchWithSearXNG = async (
    query: string,
    categories: string = 'general',
    engines?: string[]
): Promise<SearXNGResult[]> => {
    try {
        const baseUrl = await getSearXNGUrl();

        // Build search URL with JSON format
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            categories: categories,
        });

        if (engines && engines.length > 0) {
            params.append('engines', engines.join(','));
        }

        const searchUrl = `${baseUrl}/search?${params.toString()}`;
        console.log(`[SearXNG] Searching (${categories}): ${query}`);

        const response = await axios.get<SearXNGResponse>(searchUrl, {
            timeout: 10000, // 10 second timeout
            headers: {
                'Accept': 'application/json',
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            console.log(`[SearXNG] Found ${response.data.results.length} results`);
            // Map raw results to ensure all fields are present
            return response.data.results.map((r: any) => ({
                title: r.title,
                url: r.url,
                content: r.content,
                engine: r.engine,
                img_src: r.img_src || r.thumbnail_src || (categories === 'images' ? r.url : null), // Handle direct image URLs in image search
                thumbnail: r.thumbnail || r.thumbnail_src || r.img_src || null,
                score: r.score
            }));
        }

        return [];
    } catch (error: any) {
        console.error('[SearXNG] Search error:', error.message);

        // Check for common errors
        if (error.response?.status === 403) {
            console.error('[SearXNG] 403 Forbidden - JSON format may be disabled. Enable it in SearXNG settings.yaml');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('[SearXNG] Connection refused - check if SearXNG is running');
        }

        return [];
    }
};

/**
 * Find product images using SearXNG
 */
export const findProductImages = async (productName: string, limit: number = 1): Promise<string[]> => {
    try {
        console.log(`[SearXNG] Starting Optimized Parallel Image Search for: ${productName}`);

        // Define Queries (Relaxed "front view" quotes to improve recall)
        const strictQuery = `${productName} product official image front view -graph -chart -statistics -plot -diagram -logo -icon -vector -clipart -sketch -blueprint -layout`;
        const moderateQuery = `${productName} product photo -logo -icon`;

        // EXECUTE PARALLEL SEARCHES (Race for best quality, but don't wait sequentially)
        const [strictResults, moderateResults] = await Promise.all([
            searchWithSearXNG(strictQuery, 'images').catch(err => { console.warn('Strict search failed', err); return []; }),
            searchWithSearXNG(moderateQuery, 'images').catch(err => { console.warn('Moderate search failed', err); return []; })
        ]);

        // 1. Prefer Strict Results (High Quality)
        const strictImages = processAndFilterImages(strictResults, limit);
        if (strictImages.length > 0) {
            console.log(`[SearXNG] ✅ Using STRICT results (${strictImages.length})`);
            return strictImages;
        }

        // 2. Fallback to Moderate Results (Good Quality)
        const moderateImages = processAndFilterImages(moderateResults, limit);
        if (moderateImages.length > 0) {
            console.log(`[SearXNG] ⚠️ Fallback to MODERATE results (${moderateImages.length})`);
            return moderateImages;
        }

        // 3. Last Resort: Loose Search (Sequential, only if everything else failed)
        console.log('[SearXNG] ❌ All parallel searches failed. Trying LOOSE fallback.');
        const looseResults = await searchWithSearXNG(`${productName}`, 'images');
        return processAndFilterImages(looseResults, limit);

    } catch (error) {
        console.error('[SearXNG] Image search failed:', error);
        return [];
    }
};

/**
 * Helper to process and filter image results
 * Adds strict filtering against logos, icons, and noisy filenames
 */
function processAndFilterImages(results: SearXNGResult[], limit: number): string[] {
    return results
        .map(r => r.img_src || r.thumbnail) // Prefer high-res val, fallback to thumb
        .filter((url): url is string => {
            if (!url || !url.startsWith('http')) return false;

            const lowerUrl = url.toLowerCase();
            // Ban generic placeholders, logos, icons
            if (lowerUrl.includes('placeholder')) return false;
            if (lowerUrl.includes('logo')) return false;
            if (lowerUrl.includes('icon')) return false;
            if (lowerUrl.includes('avatar')) return false;
            if (lowerUrl.includes('svg')) return false; // Vectors are rarely photos

            // Ban generic naming patterns often associated with site assets
            if (lowerUrl.includes('/assets/')) return false;
            if (lowerUrl.includes('/static/')) return false;

            return true;
        })
        .slice(0, limit);
}

/**
 * Search for product information on trusted nutrition databases
 * Uses SearXNG to search USDA, EWG, Nutritionix, etc.
 */
export const searchProductInfo = async (productName: string): Promise<{
    name: string;
    brand: string;
    description: string;
    sources: string[];
} | null> => {
    try {
        // Search trusted nutrition sites
        const trustedSites = 'site:fdc.nal.usda.gov OR site:ewg.org OR site:nutritionix.com OR site:foodb.ca';
        const query = `${productName} ${trustedSites}`;

        const results = await searchWithSearXNG(query, 'general');

        if (results.length === 0) {
            return null;
        }

        // Extract useful information from top results
        const topResults = results.slice(0, 5);
        const snippets = topResults.map(r => r.content).filter(Boolean);
        const sources = topResults.map(r => r.url);

        // Return raw results for AI synthesis
        return {
            name: productName,
            brand: 'Unknown',
            description: snippets.join(' | '),
            sources: sources
        };
    } catch (error) {
        console.error('[SearXNG] Product search error:', error);
        return null;
    }
};

/**
 * Search for health/nutrition information
 */
export const searchHealthInfo = async (topic: string): Promise<string[]> => {
    try {
        const results = await searchWithSearXNG(topic, 'science');
        return results.slice(0, 5).map(r => r.content).filter(Boolean);
    } catch (error) {
        console.error('[SearXNG] Health search error:', error);
        return [];
    }
};

/**
 * Check if SearXNG is available and responding
 */
export const checkSearXNGHealth = async (): Promise<boolean> => {
    try {
        const baseUrl = await getSearXNGUrl();
        const response = await axios.get(`${baseUrl}/search?q=test&format=json`, {
            timeout: 5000
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
};
