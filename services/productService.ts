import axios from 'axios';
import { fetchFromUSDA } from './external/usdaService';
import { fetchFromFooDB } from './external/foodbService';

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product';

export interface ProductData {
    id: string;
    name: string;
    brand: string;
    image: string;
    ingredients: string[];
    nutrition_grades: string;
    nutriments: any;
    description: string;
    source?: 'OpenFoodFacts' | 'USDA' | 'FooDB' | 'Aggregated';
}

const apiClient = axios.create();

// Simple in-memory cache for demo purposes (clears on refresh)
// In production, use localStorage or a dedicated caching library
const productCache: Map<string, { data: ProductData, timestamp: number }> = new Map();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

/**
 * -----------------------------------------------------------------------------
 * DATA AGGREGATION STRATEGY & "BRAND RESCUE" LOGIC
 * -----------------------------------------------------------------------------
 * 
 * 1. MANDATORY HIERARCHY: BRAND FIRST
 *    The UI requires a Brand Name to identify products.
 *    Structure: [Brand Name] -> [Product Name]
 * 
 * 2. BRAND RESCUE PROTOCOL (Priority Order):
 *    a. Open Food Facts (OFF): Check `brands` or `brands_tags`.
 *    b. USDA FoodData Central: If OFF returns null/"Unknown", query USDA 
 *       using the barcode/GTIN and extract `brandOwner`.
 *    c. FALLBACK: If both fail (common for raw produce), default to 
 *       "Unbranded Commodity".
 * 
 * 3. SERVICE CONSTRAINTS:
 *    - FooDB: Treated as TERTIARY/OPTIONAL. The implementation in 
 *      `foodbService.ts` is currently a placeholder/mock. 
 *      The agent must NOT block execution if FooDB data is missing.
 *    - Language: English only. Filter non-English fields.
 * -----------------------------------------------------------------------------
 */

/**
 * Helper: Check if a brand value is valid (not generic/missing)
 */
const isValidBrand = (brand: string | undefined | null): boolean => {
    if (!brand) return false;
    const normalized = brand.toLowerCase().trim();
    const invalidBrands = ['unknown', 'generic', 'unknown brand', 'n/a', ''];
    return !invalidBrands.includes(normalized);
};

/**
 * Helper: Extract English-first field from OFF product
 */
const getEnglishField = (product: any, field: string, fallback: string = ''): string => {
    // Priority: field_en > field > fallback
    const enField = `${field}_en`;
    return product[enField] || product[field] || fallback;
};

export const fetchProductData = async (barcode: string): Promise<ProductData | null> => {
    // 1. Check Cache
    const cached = productCache.get(barcode);
    if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_DURATION) {
            console.log(`[ProductService] Serving ${barcode} from cache`);
            return cached.data;
        } else {
            productCache.delete(barcode); // Expired
        }
    }

    console.log(`[ProductService] Fetching ${barcode} from APIs...`);

    try {
        // 2. PRIMARY SOURCE: Open Food Facts (Master Record)
        const offResponse = await apiClient.get(`${OFF_API_URL}/${barcode}.json`);
        let productData: ProductData | null = null;
        let needsBrandRescue = false;

        if (offResponse.data.status === 1) {
            const product = offResponse.data.product;

            // Extract English-prioritized fields
            const productName = getEnglishField(product, 'product_name', 'Unknown Product');
            const genericName = getEnglishField(product, 'generic_name', 'No description available.');

            // Extract brand with tags fallback
            let brand = product.brands || product.brands_tags?.[0] || '';

            // BRAND RESCUE RULE: Check if brand is valid
            if (!isValidBrand(brand)) {
                console.log(`[ProductService] Brand missing/invalid in OFF: "${brand}". Triggering Brand Rescue...`);
                needsBrandRescue = true;
            }

            // Build initial product data from OFF
            productData = {
                id: product._id || barcode,
                name: productName,
                brand: brand || 'Unbranded Commodity', // Temporary, will be updated if rescue succeeds
                image: product.image_url || product.image_front_url || '',
                ingredients: product.ingredients_text ? [product.ingredients_text] : [],
                nutrition_grades: product.nutrition_grades?.toUpperCase() || '?',
                nutriments: product.nutriments || {},
                description: genericName,
                source: 'OpenFoodFacts'
            };
        }

        // 3. BRAND RESCUE: Query USDA if brand is missing
        if (needsBrandRescue || !productData) {
            console.log(`[ProductService] Executing Brand Rescue via USDA...`);
            const usdaResult = await fetchFromUSDA(barcode);

            if (usdaResult) {
                if (needsBrandRescue && productData) {
                    // OFF had product but missing brand - use USDA's brand
                    if (isValidBrand(usdaResult.brand)) {
                        console.log(`[ProductService] Brand Rescue SUCCESS: "${usdaResult.brand}"`);
                        productData.brand = usdaResult.brand;
                        productData.source = 'Aggregated'; // Mark as aggregated from multiple sources
                    } else {
                        console.log(`[ProductService] Brand Rescue FAILED: USDA also lacks valid brand`);
                        productData.brand = 'Unbranded Commodity';
                    }
                } else if (!productData) {
                    // OFF didn't have product at all - use USDA as primary
                    productData = { ...usdaResult, source: 'USDA' };
                }
            } else if (productData) {
                // USDA failed, keep "Unbranded Commodity"
                console.log(`[ProductService] Brand Rescue FAILED: USDA returned null`);
                productData.brand = 'Unbranded Commodity';
            }
        }

        // 4. Fallback to FooDB (tertiary source)
        if (!productData) {
            const foodbResult = await fetchFromFooDB(barcode);
            if (foodbResult) {
                productData = { ...foodbResult, source: 'FooDB' };
            }
        }

        // 5. Update Cache
        if (productData) {
            productCache.set(barcode, { data: productData, timestamp: Date.now() });
            console.log(`[ProductService] Final Product: ${productData.brand} → ${productData.name} (Source: ${productData.source})`);
        } else {
            console.log(`[ProductService] No product data found for barcode: ${barcode}`);
        }

        return productData;

    } catch (error) {
        console.error("Error fetching product data:", error);
        return null;
    }
};

export const searchProducts = async (query: string): Promise<ProductData[]> => {
    try {
        console.log(`[ProductService] Searching for: ${query}`);
        // Search API is currently only OFF. 
        // Aggregating search across multiple providers is complex (pagination, ranking).
        // Added sort_by=unique_scans_n to prioritize popular products (likely to have images)
        const response = await apiClient.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&sort_by=unique_scans_n&page_size=20`);

        if (response.data.products) {
            return response.data.products.map((product: any) => {
                // Use English-first extraction
                const productName = getEnglishField(product, 'product_name', 'Unknown Product');
                const genericName = getEnglishField(product, 'generic_name', 'No description available.');
                let brand = product.brands || product.brands_tags?.[0] || 'Unknown Brand';

                // Normalize brand display
                if (!isValidBrand(brand)) {
                    brand = 'Unbranded Commodity';
                }

                return {
                    id: product._id || product.code,
                    name: productName,
                    brand: brand,
                    image: product.image_url || product.image_front_url || '',
                    ingredients: product.ingredients_text ? [product.ingredients_text] : [],
                    nutrition_grades: product.nutrition_grades?.toUpperCase() || '?',
                    nutriments: product.nutriments || {},
                    description: genericName,
                    source: 'OpenFoodFacts' as const
                };
            }).filter((p: ProductData) => p.name !== 'Unknown Product');
        }
        return [];
    } catch (error) {
        console.error("[ProductService] Error searching products:", error);
        return [];
    }
};
