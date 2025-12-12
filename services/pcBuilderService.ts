/**
 * PC Builder Service
 * Orchestrates build generation, price lookups, and storage
 */

import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    doc,
    deleteDoc,
    limit
} from 'firebase/firestore';
import { searchWithSearXNG } from './searxngService';
import { generateBuildWithGitHubModels, calculateBottleneckWithGitHubModels } from './githubModelsService';
import { getSystemSettings } from './systemService';
import { SavedBuild, PCComponent, GenerateBuildRequest, PCBuildComponents } from '@/types/pcBuilder';

const BUILDS_COLLECTION = 'pc_builds';

/**
 * Search for component price using SearXNG
 */
async function fetchComponentPrice(
    component: PCComponent,
    location: string
): Promise<{ price: number; source: string; url: string } | null> {
    try {
        const searchQuery = `${component.brand} ${component.name} price ${location} buy online`;
        console.log(`[PCBuilder] Searching price for: ${searchQuery}`);

        const results = await searchWithSearXNG(searchQuery, 'general');

        if (results.length === 0) {
            console.log(`[PCBuilder] No results for ${component.name}`);
            return null;
        }

        // Try to extract price from results
        for (const result of results.slice(0, 5)) {
            // Match various price formats: $999, $1,299.99, USD 999, 999$, etc.
            const pricePatterns = [
                /\$[\d,]+\.?\d*/,           // $1,299.99
                /USD\s*[\d,]+\.?\d*/i,      // USD 1299
                /[\d,]+\.?\d*\s*\$/,        // 1299$
                /€[\d,]+\.?\d*/,            // €999
                /[\d,]+\.?\d*\s*€/,         // 999€
                /£[\d,]+\.?\d*/,            // £999
            ];

            const textToSearch = `${result.title} ${result.content}`;

            for (const pattern of pricePatterns) {
                const match = textToSearch.match(pattern);
                if (match) {
                    const priceStr = match[0].replace(/[$€£,\s]|USD/gi, '');
                    const price = parseFloat(priceStr);
                    if (!isNaN(price) && price > 10 && price < 50000) { // Reasonable price range
                        return {
                            price,
                            source: result.engine || 'SearXNG',
                            url: result.url
                        };
                    }
                }
            }
        }

        console.log(`[PCBuilder] Could not extract price for ${component.name}`);
        return null;
    } catch (error) {
        console.error(`[PCBuilder] Price fetch failed for ${component.name}:`, error);
        return null;
    }
}

/**
 * Generate a complete PC build
 */
export async function generatePCBuild(
    userId: string,
    request: GenerateBuildRequest
): Promise<SavedBuild> {
    const settings = await getSystemSettings();
    const location = request.location || settings.apiKeys?.defaultPcBuilderLocation || 'USA';

    // ===== Step A: Generate build with GitHub Models =====
    console.log('[PCBuilder] Step A: Consulting AI for build recommendations...');
    const aiResponse = await generateBuildWithGitHubModels(request.mode, {
        budget: request.budget,
        existingHardware: request.existingHardware
    });

    // Build components object with proper types
    const components: PCBuildComponents = {};

    if (aiResponse.cpu) {
        components.cpu = { ...aiResponse.cpu, type: 'cpu' };
    }
    if (aiResponse.gpu) {
        components.gpu = { ...aiResponse.gpu, type: 'gpu' };
    }
    if (aiResponse.ram) {
        components.ram = { ...aiResponse.ram, type: 'ram' };
    }
    if (aiResponse.motherboard) {
        components.motherboard = { ...aiResponse.motherboard, type: 'motherboard' };
    }
    if (aiResponse.psu) {
        components.psu = { ...aiResponse.psu, type: 'psu' };
    }
    if (aiResponse.case) {
        components.case = { ...aiResponse.case, type: 'case' };
    }
    if (aiResponse.storage) {
        components.storage = { ...aiResponse.storage, type: 'storage' };
    }
    if (aiResponse.cooler) {
        components.cooler = { ...aiResponse.cooler, type: 'cooler' };
    }

    // ===== Step B: Fetch prices via SearXNG =====
    console.log('[PCBuilder] Step B: Fetching prices via SearXNG...');
    let totalPrice = 0;

    const componentEntries = Object.entries(components) as [keyof PCBuildComponents, PCComponent][];

    for (const [key, component] of componentEntries) {
        if (component) {
            const priceData = await fetchComponentPrice(component, location);
            if (priceData) {
                component.price = priceData.price;
                component.priceSource = priceData.source;
                component.priceUrl = priceData.url;
                totalPrice += priceData.price;
            }
        }
    }

    // ===== Step C: Calculate/verify bottleneck =====
    console.log('[PCBuilder] Step C: Optimizing build metrics...');
    let metrics = {
        bottleneckScore: aiResponse.bottleneckScore ?? 10,
        estimatedWattage: aiResponse.estimatedWattage ?? 500,
        compatibilityIssues: [] as string[]
    };

    // If AI didn't provide metrics, calculate them
    if (!aiResponse.bottleneckScore || !aiResponse.estimatedWattage) {
        const calculated = await calculateBottleneckWithGitHubModels(components);
        metrics = {
            ...calculated,
            compatibilityIssues: calculated.compatibilityIssues || []
        };
    }

    // Create the build object
    const build: SavedBuild = {
        userId,
        buildName: request.mode === 'budget'
            ? `$${request.budget} Build`
            : `Build for ${request.existingHardware}`,
        buildType: request.mode,
        components,
        metrics,
        totalPrice,
        userInput: {
            budget: request.budget,
            existingHardware: request.existingHardware,
            location
        },
        createdAt: new Date(),
        updatedAt: new Date()
    };

    console.log('[PCBuilder] Build generated successfully:', build.buildName);
    return build;
}

/**
 * Save a build to Firestore
 */
export async function saveBuild(build: SavedBuild): Promise<string> {
    const docRef = await addDoc(collection(db, BUILDS_COLLECTION), {
        ...build,
        createdAt: Timestamp.fromDate(build.createdAt),
        updatedAt: Timestamp.fromDate(build.updatedAt)
    });
    console.log('[PCBuilder] Build saved with ID:', docRef.id);
    return docRef.id;
}

/**
 * Get user's saved builds
 */
export async function getUserBuilds(userId: string, maxBuilds: number = 20): Promise<SavedBuild[]> {
    const q = query(
        collection(db, BUILDS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(maxBuilds)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnapshot.data().updatedAt?.toDate() || new Date()
    })) as SavedBuild[];
}

/**
 * Delete a saved build
 */
export async function deleteBuild(buildId: string): Promise<void> {
    await deleteDoc(doc(db, BUILDS_COLLECTION, buildId));
    console.log('[PCBuilder] Build deleted:', buildId);
}
