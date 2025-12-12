
import { NextResponse } from 'next/server';
import axios from 'axios';
import { getSystemSettings } from '@/services/systemService';
import { adminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic'; // Prevent caching of authentication checks
export const maxDuration = 60; // Allow 60s for LLM responses (Vercel Hobby Limit is 10s, Pro is 300s. We set 60s for safety)

// Helper to normalize URL
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

export async function POST(request: Request) {
    try {
        // 1. Authentication Check (Fastest check first)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify token (Performance: This adds latency, but is required for security)
        // Optimization: In a high-perf scenario, we might use Edge Middleware for auth
        // but for now, we stick to robust Admin SDK verification.
        // Verify token
        if (!adminAuth) {
            console.error('Firebase Admin SDK not initialized. missing FIREBASE_SERVICE_ACCOUNT_KEY?');
            return NextResponse.json({ error: 'Server Configuration Error (Auth)' }, { status: 500 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        try {
            await adminAuth.verifyIdToken(idToken);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Get Configuration
        const body = await request.json();
        const settings = await getSystemSettings();

        // Resolve Target URL
        const ollamaUrl = normalizeUrl(settings.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434');
        const targetEndpoint = body.endpoint || '/api/chat'; // Default to chat
        const targetUrl = `${ollamaUrl}${targetEndpoint}`;

        // 3. Proxy Request
        // Optimization: Set a reasonable timeout and stream if possible (currently false for simplicity)
        const response = await axios.post(targetUrl, body.payload, {
            timeout: 60000, // 60s timeout
            responseType: 'json'
        });

        return NextResponse.json(response.data);

    } catch (error: any) {
        console.error('[Ollama Proxy] Error:', error.message);

        // Handle Timeout specifically
        if (error.code === 'ECONNABORTED') {
            return NextResponse.json({ error: 'Ollama Request Timed Out (Server took too long)' }, { status: 504 });
        }

        // Handle Connection Refused
        if (error.code === 'ECONNREFUSED') {
            return NextResponse.json({ error: 'Failed to connect to Ollama Server (Is it running?)' }, { status: 502 });
        }

        return NextResponse.json(
            { error: error.response?.data?.error || error.message || 'Internal Server Error' },
            { status: error.response?.status || 500 }
        );
    }
}
