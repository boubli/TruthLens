
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
            if (decodedToken.uid !== 'admin' && !decodedToken.admin) {
                // Double check role claim if needed, or strict admin check
                // For now, assuming any valid token is NOT enough, must be admin?
                // Wait, is this route for admin dashboard only? Yes, it is in /admin/ollama.
                // So we need to check if user is admin.
                // But verifying ID token claims is faster.
                if (decodedToken.role !== 'admin' && decodedToken.admin !== true) {
                    // Check custom claim
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const settings = await getSystemSettings();
        const { searchParams } = new URL(request.url);
        const forcedUrl = searchParams.get('url');

        // Use provided URL or saved URL
        let ollamaUrl = forcedUrl || settings.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434';

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
        debug.error = error.message;
        debug.stack = error.stack;

        return NextResponse.json(
            { error: 'Failed to connect to Ollama', debug },
            { status: 502 }
        );
    }
}
