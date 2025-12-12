import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Fetch available OpenRouter models
 * This endpoint fetches all models from OpenRouter and filters for free ones
 */
export async function GET(req: NextRequest) {
    try {
        const apiKey = req.headers.get('x-api-key');

        if (!apiKey) {
            return NextResponse.json({ error: 'API key required' }, { status: 401 });
        }

        // Fetch models from OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch models from OpenRouter');
        }

        const data = await response.json();

        // Filter for free models and extract relevant info
        const freeModels = data.data
            .filter((model: any) => model.pricing?.prompt === '0' || model.id.includes(':free'))
            .map((model: any) => ({
                id: model.id,
                name: model.name || model.id,
                context_length: model.context_length,
                description: model.description
            }));

        return NextResponse.json({ models: freeModels });

    } catch (error: any) {
        console.error('[OpenRouter Models Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch models' },
            { status: 500 }
        );
    }
}
