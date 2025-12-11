import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Placeholder for user's SearXNG instance. 
// In production, this should be in .env.local: SEARXNG_API_URL=https://your-searxng-instance.com
const SEARXNG_URL = process.env.SEARXNG_API_URL || 'https://searxng.example.com';

export async function POST(req: NextRequest) {
    try {
        // --------------------------------------------------------------------------
        // 1. SECURITY & ELIGIBILITY CHECK
        // --------------------------------------------------------------------------
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            // Verify the ID token first
            if (adminAuth) {
                decodedToken = await adminAuth.verifyIdToken(idToken);
            } else {
                throw new Error('Firebase Admin Auth not initialized');
            }
        } catch (authError) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 403 });
        }

        const uid = decodedToken.uid;

        // Fetch User Profile for Tier/Beta Status
        // We need to check Firestore because 'tier' in custom claims might not be up to date or used yet
        if (!adminDb) {
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();
        const tier = userData?.subscription?.tier || userData?.tier || 'free'; // Check both new and legacy locations
        const hasBetaAccess = userData?.hasBetaAccess === true;

        const isEligible =
            tier === 'pro' ||
            tier === 'ultimate' ||
            hasBetaAccess === true;

        if (!isEligible) {
            return NextResponse.json({ error: 'Upgrade required: This feature is for Pro/Ultimate users only.' }, { status: 403 });
        }

        // --------------------------------------------------------------------------
        // 2. IMAGE PROCESSING & SEARXNG PROXY
        // --------------------------------------------------------------------------
        const formData = await req.formData();
        const imageFile = formData.get('image');

        if (!imageFile) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Call SearXNG
        // Note: Actual SearXNG implementation for image upload varies. 
        // We assume a standard endpoint that accepts multipart form data for reverse search.
        // If SearXNG is unavailable, we might mock this or fail.
        let searchResults;
        let searchQuery = "";

        try {
            // Re-construct FormData for the upstream request
            const upstreamFormData = new FormData();
            upstreamFormData.append('image', imageFile);
            upstreamFormData.append('format', 'json'); // Request JSON response

            // Example endpoint: /search?q=!images&... or specialized /image_search
            // Adjust path based on actual SearXNG configuration
            const searxRes = await fetch(`${SEARXNG_URL}/search?categories=images&format=json`, {
                method: 'POST',
                body: upstreamFormData,
                // Do NOT set Content-Type header manually for FormData, fetch handles boundary
            });

            if (!searxRes.ok) {
                console.warn('SearXNG request failed:', searxRes.status, searxRes.statusText);
                // Fallback or error? For now, we'll error if we can't search.
                // UNLESS we are in demo mode/env not set.
                if (SEARXNG_URL.includes('example.com')) {
                    // MOCK RESULT for Demo if URL is not set
                    searchResults = { results: [{ title: "Mock Product: Organic Protein Powder" }] };
                } else {
                    throw new Error(`SearXNG Error: ${searxRes.statusText}`);
                }
            } else {
                searchResults = await searxRes.json();
            }

            // Extract best query from results
            // Assume results[0].title is the best match
            if (searchResults.results && searchResults.results.length > 0) {
                searchQuery = searchResults.results[0].title || "Unknown Product";
                // Clean up query (remove file extensions, etc if generic)
            } else {
                searchQuery = "Unknown Item";
            }

        } catch (searchError: any) {
            console.error('Visual Search Error:', searchError);
            return NextResponse.json({ error: 'Visual search service unavailable' }, { status: 502 });
        }

        // --------------------------------------------------------------------------
        // 3. INTERNAL PRODUCT LOOKUP
        // --------------------------------------------------------------------------
        // Try to find a matching product in OUR database using the extracted query
        // Simple case-insensitive prefix match or similar
        let matchedProductId = null;

        if (searchQuery) {
            // normalize
            const normalizedQuery = searchQuery.toLowerCase().split(' ').slice(0, 3).join(' '); // Take first 3 words for better fuzzy match chance

            // This is a basic simulation. Real world would use Algolia/Elastic or more complex query
            const productsSnapshot = await adminDb.collection('products')
                .where('keywords', 'array-contains', normalizedQuery)
                .limit(1)
                .get();

            // If strict keyword match fails, maybe try a direct name query?
            // Firestore doesn't support 'contains' natively easily without full text search engines.
            // We'll skip complex logic here and just return the query if no direct match.

            if (!productsSnapshot.empty) {
                matchedProductId = productsSnapshot.docs[0].id;
            }
        }

        // --------------------------------------------------------------------------
        // 4. LOG HISTORY (FIREBASE)
        // --------------------------------------------------------------------------
        try {
            await adminDb.collection('search_history').add({
                userId: uid,
                timestamp: new Date(),
                searchType: 'Visual_Search',
                searchQuery: searchQuery,
                productId: matchedProductId,
                metadata: {
                    source: 'quick_action_camera'
                }
            });
        } catch (histError) {
            console.error('Failed to save history:', histError);
            // Non-blocking error
        }

        return NextResponse.json({
            success: true,
            query: searchQuery,
            productId: matchedProductId,
            data: searchResults // Debug info?
        });

    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
