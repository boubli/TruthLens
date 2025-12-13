import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { EnhancedProductData, mapOpenFoodFactsToEnhanced } from '@/services/productMapper';
import { fetchFromFooDB } from '@/services/external/foodbService';

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_API_KEY = process.env.USDA_API_KEY || '1y9SZmWjZZrLLc6FlydP2ofW2Q82T8fxlK1ulS17';

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await req.json();
        const { barcode } = body;

        if (!barcode) {
            return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
        }

        console.log(`[Scan API] Processing barcode: ${barcode}`);

        // =====================================================
        // FAST WATERFALL: Open Food Facts → FooDB → USDA
        // NO SearXNG - Direct database lookups only
        // =====================================================

        // Step 1: Check Open Food Facts (PRIMARY - Fastest, Best Data)
        try {
            console.log(`[Scan API] Checking Open Food Facts...`);
            const offResponse = await axios.get(`${OFF_API_URL}/${barcode}.json`, {
                timeout: 5000, // Fast timeout
                headers: { 'User-Agent': 'TruthLens/1.0' }
            });

            if (offResponse.data.status === 1 && offResponse.data.product) {
                const duration = Date.now() - startTime;
                console.log(`[Scan API] ✓ Found in Open Food Facts (${duration}ms): ${offResponse.data.product.product_name}`);
                const enhancedData = mapOpenFoodFactsToEnhanced(offResponse.data.product);
                return NextResponse.json(enhancedData);
            }
        } catch (error: any) {
            console.warn(`[Scan API] OFF lookup failed: ${error.message}`);
        }

        // Step 2: Check FooDB (Secondary - Compound/Flavor Data)
        try {
            console.log(`[Scan API] Checking FooDB...`);
            const foodbResult = await fetchFromFooDB(barcode);

            if (foodbResult) {
                const duration = Date.now() - startTime;
                console.log(`[Scan API] ✓ Found in FooDB (${duration}ms): ${foodbResult.name}`);
                const enhancedData: EnhancedProductData = {
                    id: foodbResult.id,
                    identity: {
                        name: foodbResult.name,
                        brand: foodbResult.brand || 'Unknown',
                        barcode: barcode,
                        category: 'Food',
                        description: foodbResult.description || 'FooDB Entry'
                    },
                    media: {
                        front_image: foodbResult.image || '',
                        thumbnail: foodbResult.image || '',
                    },
                    grades: {
                        nutri_score: foodbResult.nutrition_grades || '?',
                        eco_score: '?',
                        processing_score: '?'
                    },
                    nutrition: {
                        nutriments_raw: foodbResult.nutriments || {}
                    },
                    sensory_profile: { flavors: [] },
                    ingredients: foodbResult.ingredients || [],
                    source: 'FooDB'
                };
                return NextResponse.json(enhancedData);
            }
        } catch (error: any) {
            console.warn(`[Scan API] FooDB lookup failed: ${error.message}`);
        }

        // Step 3: Check USDA FoodData Central (Tertiary - Scientific Data)
        try {
            console.log(`[Scan API] Checking USDA...`);
            const usdaResponse = await axios.get(USDA_API_URL, {
                params: {
                    api_key: USDA_API_KEY,
                    query: barcode,
                    pageSize: 1,
                    dataType: ['Branded', 'Foundation']
                },
                timeout: 5000 // Fast timeout
            });

            if (usdaResponse.data.foods && usdaResponse.data.foods.length > 0) {
                const food = usdaResponse.data.foods[0];

                // Check if the GTIN/UPC matches or accept first result
                if (food.gtinUpc === barcode || food.gtinUpc?.includes(barcode) || !food.gtinUpc) {
                    const duration = Date.now() - startTime;
                    console.log(`[Scan API] ✓ Found in USDA (${duration}ms): ${food.description}`);

                    const enhancedData: EnhancedProductData = {
                        id: `usda_${food.fdcId}`,
                        identity: {
                            name: food.description,
                            brand: food.brandOwner || 'USDA Food',
                            barcode: barcode,
                            category: food.foodCategory || 'Food',
                            description: food.ingredients ? `Ingredients: ${food.ingredients}` : 'USDA Verified Food Data'
                        },
                        media: {
                            front_image: '',
                            thumbnail: '',
                        },
                        grades: {
                            nutri_score: '?',
                            eco_score: '?',
                            processing_score: '?'
                        },
                        nutrition: {
                            nutriments_raw: food.foodNutrients?.reduce((acc: any, n: any) => {
                                const name = n.nutrientName?.toLowerCase() || '';
                                if (name.includes('energy')) acc.energy_kcal = n.value;
                                if (name.includes('protein')) acc.proteins = n.value;
                                if (name.includes('carbohydrate')) acc.carbohydrates = n.value;
                                if (name.includes('total lipid')) acc.fat = n.value;
                                if (name.includes('fiber')) acc.fiber = n.value;
                                if (name.includes('sodium')) acc.sodium = n.value;
                                if (name.includes('sugar')) acc.sugars = n.value;
                                return acc;
                            }, {}) || {}
                        },
                        sensory_profile: { flavors: [] },
                        ingredients: food.ingredients ? food.ingredients.split(',').map((i: string) => i.trim()) : [],
                        source: 'USDA'
                    };
                    return NextResponse.json(enhancedData);
                }
            }
        } catch (error: any) {
            console.warn(`[Scan API] USDA lookup failed: ${error.message}`);
        }

        // NOT FOUND - Return 404
        const duration = Date.now() - startTime;
        console.log(`[Scan API] ✗ Product not found in any database (${duration}ms)`);
        return NextResponse.json({
            error: 'Product not found',
            barcode: barcode,
            searched: ['Open Food Facts', 'FooDB', 'USDA FoodData Central']
        }, { status: 404 });

    } catch (error: any) {
        console.error(`[Scan API] Error:`, error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
