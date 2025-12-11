
import { NextResponse } from 'next/server';
import axios from 'axios';
import { getSystemSettings } from '@/services/systemService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const debug: any = {};
    try {
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
