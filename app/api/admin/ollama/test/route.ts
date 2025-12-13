import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
    let url, model, prompt;
    try {
        const body = await req.json();
        url = body.url;
        model = body.model;
        prompt = body.prompt;

        if (!url || !model) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Test the model with a simple prompt
        const response = await axios.post(
            `${url}/api/generate`,
            {
                model,
                prompt: prompt || 'Hello',
                stream: false
            },
            { timeout: 30000 }
        );

        if (response.data && response.data.response) {
            return NextResponse.json({
                success: true,
                response: response.data.response
            });
        }

        return NextResponse.json(
            { error: 'No response from model' },
            { status: 500 }
        );
    } catch (error: any) {
        console.error('Model test failed:', error.message);

        // AUTO-FALLBACK: If the primary URL failed, try the SSH tunnel
        if (!url?.includes('localhost:11435')) {
            console.log('[API] ⚠️ Primary connection failed. Attempting fallback to SSH Tunnel (localhost:11435)...');
            try {
                const fallbackUrl = 'http://localhost:11435';
                const retryResponse = await axios.post(
                    `${fallbackUrl}/api/generate`,
                    {
                        model,
                        prompt: prompt || 'Hello',
                        stream: false
                    },
                    { timeout: 30000 }
                );

                if (retryResponse.data && retryResponse.data.response) {
                    console.log('[API] ✅ Fallback to SSH Tunnel successful!');
                    return NextResponse.json({
                        success: true,
                        response: retryResponse.data.response,
                        debug: { recovered: true, note: 'Recovered via SSH Tunnel' }
                    });
                }
            } catch (retryError: any) {
                console.error('[API] Fallback failed:', retryError.message);
            }
        }

        return NextResponse.json(
            { error: error.message || 'Test failed' },
            { status: 500 }
        );
    }
}
