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
        console.log(`[SearXNG] Searching: ${query}`);

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
                img_src: r.img_src || r.thumbnail_src || null,
                thumbnail: r.thumbnail || r.thumbnail_src || null,
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
