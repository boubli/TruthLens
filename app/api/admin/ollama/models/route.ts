
import { NextResponse } from 'next/server';
import axios from 'axios';
import { getSystemSettings } from '@/services/systemService';

import { adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const debug: any = {};
    try {
        // --------------------------------------------------------------------------
        // SECURITY CHECK
        // --------------------------------------------------------------------------
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await adminAuth!.verifyIdToken(idToken);
            // Relaxed Security for Development: Allow any authenticated user to access this endpoint
            // TODO: Re-enable strict admin check in production
            /* 
            if (decodedToken.uid !== 'admin' && !decodedToken.admin) {
                if (decodedToken.role !== 'admin' && decodedToken.admin !== true) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            } 
            */
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const settings = await getSystemSettings();
        const { searchParams } = new URL(request.url);
        const forcedUrl = searchParams.get('url');

        // Use provided URL or saved URL (SSH tunnel on 11435 → VM's 11434)
        let ollamaUrl = forcedUrl || settings.apiKeys?.ollamaUrl || 'http://localhost:11435';

        // Normalize URL (remove trailing slash)
        if (ollamaUrl.endsWith('/')) {
            ollamaUrl = ollamaUrl.slice(0, -1);
        }

        debug.targetUrl = `${ollamaUrl}/api/tags`;
        console.log(`[API] Proxying Ollama tags request to: ${debug.targetUrl}`);

        const response = await axios.get(debug.targetUrl, {
            timeout: 10000 // Increased timeout
        });

        debug.status = response.status;
        debug.dataLength = response.data ? JSON.stringify(response.data).length : 0;

        return NextResponse.json({
            ...response.data,
            debug // Send debug info to client
        });
    } catch (error: any) {
        console.error('[API] Ollama Proxy Error:', error.message);

        // AUTO-FALLBACK: If the primary URL failed (e.g., blocked port), try the SSH tunnel
        if (!debug.targetUrl?.includes('localhost:11435')) {
            console.log('[API] ⚠️ Primary connection failed. Attempting fallback to SSH Tunnel (localhost:11435)...');
            try {
                const fallbackUrl = 'http://localhost:11435/api/tags';
                const retryResponse = await axios.get(fallbackUrl, { timeout: 5000 });
                console.log('[API] ✅ Fallback to SSH Tunnel successful!');
                return NextResponse.json({
                    ...retryResponse.data,
                    debug: { ...debug, recovered: true, note: 'Recovered via SSH Tunnel' }
                });
            } catch (retryError: any) {
                console.error('[API] Fallback failed:', retryError.message);
            }
        }

        debug.error = error.message;
        debug.stack = error.stack;

        return NextResponse.json(
            { error: `Failed to connect to Ollama: ${error.message}`, debug },
            { status: 502 }
        );
    }
}
