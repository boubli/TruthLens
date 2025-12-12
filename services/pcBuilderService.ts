/**
 * PC Builder Service
 * Orchestrates build generation, price lookups, and storage
 */

import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebaseAdmin';
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
import { generateBuildWithGroq, calculateBottleneckWithGroq } from './groqService';
import { getSystemSettings } from './systemService';
import { SavedBuild, PCComponent, GenerateBuildRequest, PCBuildComponents, PCBuildMetrics, GrokBuildResponse } from '@/types/pcBuilder';

const BUILDS_COLLECTION = 'pc_builds';

/**
 * Fetch current price for a component using SearXNG
 */
async function fetchComponentPrice(
    component: PCComponent,
    location: string
): Promise<{ price: number; source: string; url: string } | null> {
    try {
        const currencySymbol = location === 'USA' ? '$' : (location === 'Europe' ? '€' : '$');
        const query = `buy ${component.name} price ${location}`;

        // Search "general" or "shopping" if available
        const results = await searchWithSearXNG(query);

        if (!results || results.length === 0) return null;

        for (const result of results) {
            // Check title and content for price
            const text = `${result.title} ${result.content}`;

            // Regex for price: $100, $100.00 (simple heuristic)
            const priceRegex = new RegExp(`[${currencySymbol}]\\s?(\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?)`, 'i');
            const match = text.match(priceRegex);

            if (match && match[1]) {
                const priceStr = match[1].replace(/,/g, '');
                const price = parseFloat(priceStr);

                if (!isNaN(price) && price > 0) {
                    return {
                        price,
                        source: result.engine || 'Web Search',
                        url: result.url
                    };
                }
            }
        }

    } catch (error) {
        console.warn(`[PCBuilder] Failed to fetch price for ${component.name}:`, error);
    }
    return null;
}

/**
 * Generate a complete PC build
 */
export async function generatePCBuild(
    userId: string,
    request: GenerateBuildRequest
): Promise<SavedBuild> {
    const settings = await getSystemSettings();

    // Get user's location preference from Firestore
    let location = 'USA'; // Default fallback
    try {
        const userDoc = await adminDb?.collection('users').doc(userId).get();
        const userData = userDoc?.data();
        location = userData?.preferences?.location || 'USA';
        console.log(`[PCBuilder] Using user location: ${location}`);
    } catch (error) {
        console.warn('[PCBuilder] Could not fetch user location, using default USD');
    }

    // ===== Step A: Generate build with GitHub Models (Fallback to Groq) =====
    console.log('[PCBuilder] Step A: Consulting AI for build recommendations...');
    let aiResponse: GrokBuildResponse;
    const inputPayload = {
        budget: request.budget,
        existingHardware: request.existingHardware
    };

    try {
        console.log('[PCBuilder] Trying GitHub Models...');
        aiResponse = await generateBuildWithGitHubModels(request.mode, inputPayload);
    } catch (githubError: any) {
        console.warn(`[PCBuilder] GitHub Models failed (${githubError.message}). Falling back to Groq...`);
        try {
            aiResponse = await generateBuildWithGroq(request.mode, inputPayload);
            console.log('[PCBuilder] Successfully generated build using Groq.');
        } catch (groqError: any) {
            console.error('[PCBuilder] All AI providers failed:', groqError.message);
            // Throw the specific error message to help the user debug (e.g., "Groq API Key not configured")
            throw new Error(`AI Service Error: ${groqError.message}`);
        }
    }

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
    let metrics: PCBuildMetrics = {
        bottleneckScore: aiResponse.bottleneckScore ?? 10,
        estimatedWattage: aiResponse.estimatedWattage ?? 500,
        compatibilityIssues: [] as string[]
    };

    // If AI didn't provide metrics, calculate them
    if (!aiResponse.bottleneckScore || !aiResponse.estimatedWattage) {
        try {
            const calculated = await calculateBottleneckWithGitHubModels(components);
            metrics = { ...calculated, compatibilityIssues: calculated.compatibilityIssues || [] };
        } catch (ghErr) {
            console.warn('[PCBuilder] GitHub Models bottleneck calc failed, trying Groq...');
            try {
                const calculated = await calculateBottleneckWithGroq(components);
                metrics = { ...calculated, compatibilityIssues: calculated.compatibilityIssues || [] };
            } catch (gErr) {
                console.warn('[PCBuilder] Bottleneck calculation failed entirely.');
            }
        }
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
