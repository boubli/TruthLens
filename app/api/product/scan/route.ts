import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { searchWithSearXNG } from '@/services/searxngService';
import { EnhancedProductData, mapOpenFoodFactsToEnhanced } from '@/services/productMapper';

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { barcode } = body;

        if (!barcode) {
            return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
        }

        console.log(`[Scan API] Processing barcode: ${barcode}`);

        // Step 1: Check Open Food Facts
        try {
            console.log(`[Scan API] Checking Open Food Facts...`);
            const offResponse = await axios.get(`${OFF_API_URL}/${barcode}.json`);

            if (offResponse.data.status === 1) {
                console.log(`[Scan API] Found in Open Food Facts.`);
                const enhancedData = mapOpenFoodFactsToEnhanced(offResponse.data.product);
                return NextResponse.json(enhancedData);
            }
        } catch (error) {
            console.warn(`[Scan API] OFF check failed or 404, proceeding to fallback.`);
        }

        // Step 2: Fallback to SearXNG (Azure VM)
        console.log(`[Scan API] Fallback: Searching SearXNG...`);
        const query = `${barcode} product details`;
        const searchResults = await searchWithSearXNG(query, 'general');

        if (!searchResults || searchResults.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Parse Top Result
        const topResult = searchResults[0];
        console.log(`[Scan API] Top Result: ${topResult.title}`);

        // Extract Name and potentially Brand from Title
        // Heuristic: "Brand - Product Name" or "Product Name by Brand"
        let name = topResult.title;
        let brand = 'Unknown Brand';

        if (name.includes(' - ')) {
            const parts = name.split(' - ');
            brand = parts[0]; // Assumption
            name = parts.slice(1).join(' - ');
        } else if (name.toLowerCase().includes(' by ')) {
            const parts = name.split(/ by /i);
            name = parts[0];
            brand = parts[1];
        }

        // Synthetic Scoring Logic
        const description = topResult.content.toLowerCase() + " " + topResult.title.toLowerCase();
        let score = 50; // Base score

        // Positive Keywords
        if (description.includes('organic')) score += 15;
        if (description.includes('natural')) score += 10;
        if (description.includes('healthy')) score += 5;
        if (description.includes('vegan')) score += 5;
        if (description.includes('gluten free')) score += 5;
        if (description.includes('no sugar')) score += 10;

        // Negative Keywords
        if (description.includes('sugar')) score -= 10;
        if (description.includes('corn syrup')) score -= 15;
        if (description.includes('processed')) score -= 10;
        if (description.includes('artificial')) score -= 10;
        if (description.includes('salt') || description.includes('sodium')) score -= 5;
        if (description.includes('fat') && !description.includes('healthy fat')) score -= 5;

        // Clamp Score
        score = Math.max(0, Math.min(100, score));

        // Map Score to Nutri-Score (approximate)
        let nutriScore = 'E'; // Default low
        if (score >= 80) nutriScore = 'A';
        else if (score >= 60) nutriScore = 'B';
        else if (score >= 40) nutriScore = 'C';
        else if (score >= 20) nutriScore = 'D';

        // Price extraction heuristic
        const priceRegex = /([$€£¥]\d+(\.\d{2})?)|(\d+(\.\d{2})?\s*[$€£¥])/;
        const priceMatch = (topResult.content + " " + topResult.title).match(priceRegex);
        const price = priceMatch ? priceMatch[0] : null;

        const descriptionWithPrice = (topResult.content || 'Details found via web search.') + (price ? `\n\nApprox. Price: ${price}` : '');

        // Construct Enhanced Response
        const enhancedData: EnhancedProductData = {
            id: barcode, // Use barcode as ID for external products
            identity: {
                name: name,
                brand: brand,
                barcode: barcode,
                category: 'Scanned Product',
                description: descriptionWithPrice
            },
            media: {
                front_image: topResult.img_src || topResult.thumbnail || '',
                thumbnail: topResult.thumbnail || topResult.img_src || '',
            },
            grades: {
                nutri_score: nutriScore,
                eco_score: '?',
                processing_score: '?',
                quality_comment: `AI-Estimated Score: ${score}/100 based on web analysis.`
            },
            nutrition: {
                // Cannot reliably parse nutrition from snippet text easily without complex NLP
                nutriments_raw: {}
            },
            sensory_profile: {
                flavors: [],
            },
            ingredients: []
        };

        return NextResponse.json(enhancedData);

    } catch (error: any) {
        console.error(`[Scan API] Error:`, error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
