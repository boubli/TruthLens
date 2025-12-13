import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

/**
 * Helper to test OpenAI-Compatible APIs (Groq, DeepSeek, OpenRouter, etc.)
 */
async function testOpenAICompatible(url: string, key: string, model: string, providerName: string) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 5
            })
        });

        if (response.ok) {
            return { success: true, error: '', details: `✅ ${providerName} Connected! Model: ${model}` };
        }

        const errorData = await response.json().catch(() => ({}));
        const status = response.status;

        if (status === 401) return { success: false, error: '🔑 Invalid API Key', details: `The ${providerName} key is rejected.` };
        if (status === 429) return { success: false, error: '⏱️ Rate Limited', details: 'Too many requests.' };
        if (status === 404) return { success: false, error: '❌ Model/URL Not Found', details: `Model "${model}" or Endpoint unavailable.` };

        return {
            success: false,
            error: `❌ API Error (${status})`,
            details: errorData.error?.message || errorData.message || 'Unknown upstream error'
        };

    } catch (error: any) {
        return { success: false, error: '🌐 Network Error', details: error.message || `Unable to reach ${providerName}` };
    }
}

/**
 * Test AI API credentials without saving them
 */
export async function POST(req: NextRequest) {
    try {
        const { provider, apiKey, modelId, baseUrl } = await req.json();

        if (!provider || !apiKey) {
            return NextResponse.json({ success: false, error: 'Missing provider or API key' }, { status: 400 });
        }

        let result = { success: false, error: 'Unknown provider', details: '' };

        // Helper to parse models
        const getModels = (defaultModel: string) => {
            if (!modelId) return [defaultModel];
            return modelId.split(',').map((m: string) => m.trim()).filter((m: string) => m);
        };

        const testLoop = async (models: string[], testFn: (m: string) => Promise<any>) => {
            let lastResult = { success: false, error: 'No models', details: '' };
            for (const model of models) {
                lastResult = await testFn(model);
                if (lastResult.success) return lastResult;
                // If invalid key, stop immediately
                if (lastResult.error.includes('Key') || lastResult.error.includes('Auth')) return lastResult;
            }
            return lastResult;
        };

        switch (provider) {
            // --- NATIVE PROVIDERS ---
            case 'gemini':
                const geminiModels = getModels('gemini-1.5-flash');
                result = await testLoop(geminiModels, async (m) => {
                    try {
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const model = genAI.getGenerativeModel({ model: m });
                        const res = await model.generateContent("Hi");
                        if (res.response) {
                            return { success: true, error: '', details: `✅ Gemini Connected! Model: ${m}` };
                        }
                    } catch (e: any) {
                        const msg = e.message || '';
                        if (msg.includes('API_KEY_INVALID')) return { success: false, error: '🔑 Invalid Key', details: 'Gemini key rejected.' };
                        else if (msg.includes('404')) return { success: false, error: '❌ Model Not Found', details: `Model "${m}" invalid.` };
                        return { success: false, error: '❌ Gemini Error', details: msg };
                    }
                    return { success: false, error: 'Unknown', details: '' };
                });
                break;

            // --- OPENAI-COMPATIBLE PROVIDERS ---
            case 'groq':
                result = await testLoop(getModels('llama-3.1-8b-instant'), async (m) =>
                    testOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', apiKey, m, 'Groq')
                );
                break;

            case 'openai':
                result = await testLoop(getModels('gpt-3.5-turbo'), async (m) =>
                    testOpenAICompatible('https://api.openai.com/v1/chat/completions', apiKey, m, 'OpenAI')
                );
                break;

            case 'deepseek':
                result = await testLoop(getModels('deepseek-chat'), async (m) =>
                    testOpenAICompatible(
                        baseUrl ? `${baseUrl}/chat/completions` : 'https://api.deepseek.com/chat/completions',
                        apiKey,
                        m,
                        'DeepSeek'
                    )
                );
                break;

            case 'openrouter':
                result = await testLoop(getModels('meta-llama/llama-3.1-8b-instruct:free'), async (m) =>
                    testOpenAICompatible('https://openrouter.ai/api/v1/chat/completions', apiKey, m, 'OpenRouter')
                );
                break;

            case 'cerebras':
                result = await testLoop(getModels('llama3.1-8b'), async (m) =>
                    testOpenAICompatible('https://api.cerebras.ai/v1/chat/completions', apiKey, m, 'Cerebras')
                );
                break;

            case 'sambanova':
                result = await testLoop(getModels('Meta-Llama-3.1-8B-Instruct'), async (m) =>
                    testOpenAICompatible('https://api.sambanova.ai/v1/chat/completions', apiKey, m, 'Sambanova')
                );
                break;

            case 'github':
                result = await testLoop(getModels('gpt-4o'), async (m) =>
                    testOpenAICompatible('https://models.github.ai/inference/chat/completions', apiKey, m, 'GitHub Models')
                );
                break;

            case 'huggingface':
                // HuggingFace (Simple Inference)
                result = await testLoop(getModels('meta-llama/Meta-Llama-3-8B-Instruct'), async (m) => {
                    try {
                        const hfUrl = `https://api-inference.huggingface.co/models/${m}`;
                        const hfRes = await fetch(hfUrl, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ inputs: "Test" })
                        });

                        if (hfRes.ok) {
                            return { success: true, error: '', details: `✅ HuggingFace Connected! Model: ${m}` };
                        } else {
                            const err = await hfRes.json().catch(() => ({}));
                            return { success: false, error: `❌ Error ${hfRes.status}`, details: err.error || 'Check permissions or model name.' };
                        }
                    } catch (e: any) {
                        return { success: false, error: '🌐 Network Error', details: e.message };
                    }
                });
                break;

            default:
                result = { success: false, error: '⚠️ Provider Testing Not Implemented', details: `No test logic for ${provider}` };
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[AI Test Error]:', error);
        return NextResponse.json(
            { success: false, error: '❌ Server Error', details: error.message },
            { status: 500 }
        );
    }
}
