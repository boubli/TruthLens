import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

/**
 * Test AI API credentials without saving them
 * Returns detailed error messages for troubleshooting
 */
export async function POST(req: NextRequest) {
    try {
        const { provider, apiKey, modelId, baseUrl } = await req.json();

        if (!provider || !apiKey) {
            return NextResponse.json(
                { success: false, error: 'Missing provider or API key' },
                { status: 400 }
            );
        }

        let testResult = { success: false, error: 'Unknown error', details: '' };

        // Test based on provider
        if (provider === 'groq') {
            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelId || 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    })
                });

                if (response.ok) {
                    testResult = { success: true, error: '', details: '✅ Groq API is working!' };
                } else {
                    const errorData = await response.json();
                    const status = response.status;

                    if (status === 401) {
                        testResult = { success: false, error: '🔑 Invalid API Key', details: 'The Groq API key is incorrect or expired.' };
                    } else if (status === 429) {
                        testResult = { success: false, error: '⏱️ Rate Limit Exceeded', details: 'Too many requests. Wait and try again.' };
                    } else if (status === 404) {
                        testResult = { success: false, error: '❌ Model Not Found', details: `Model "${modelId}" doesn't exist.` };
                    } else {
                        testResult = { success: false, error: `❌ API Error (${status})`, details: errorData.error?.message || 'Unknown error' };
                    }
                }
            } catch (error: any) {
                testResult = { success: false, error: '🌐 Network Error', details: error.message || 'Unable to reach Groq API' };
            }

        } else if (provider === 'gemini') {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelId || 'gemini-1.5-flash' });
                const result = await model.generateContent("Hello");

                if (result.response) {
                    testResult = { success: true, error: '', details: '✅ Gemini API is working!' };
                }
            } catch (error: any) {
                const errorMessage = error.message || '';

                if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
                    testResult = { success: false, error: '🔑 Invalid API Key', details: 'The Gemini API key is incorrect.' };
                } else if (errorMessage.includes('quota')) {
                    testResult = { success: false, error: '💰 Quota Exceeded', details: 'Your Gemini API quota has been exceeded.' };
                } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                    testResult = { success: false, error: '❌ Model Not Found', details: `Model "${modelId}" doesn't exist.` };
                } else {
                    testResult = { success: false, error: '❌ Gemini Error', details: errorMessage };
                }
            }

        } else if (provider === 'deepseek') {
            try {
                const endpoint = baseUrl || 'https://api.deepseek.com';
                const url = endpoint.includes('/chat/completions')
                    ? endpoint
                    : `${endpoint}/chat/completions`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelId || 'deepseek-chat',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    })
                });

                if (response.ok) {
                    testResult = { success: true, error: '', details: '✅ DeepSeek API is working!' };
                } else {
                    const errorData = await response.json();
                    const status = response.status;

                    if (status === 401) {
                        testResult = { success: false, error: '🔑 Invalid API Key', details: 'The DeepSeek API key is incorrect.' };
                    } else if (status === 429) {
                        testResult = { success: false, error: '⏱️ Rate Limit Exceeded', details: 'Too many requests. Wait and try again.' };
                    } else if (status === 404) {
                        testResult = { success: false, error: '❌ Endpoint Not Found', details: `Check your base URL: ${endpoint}` };
                    } else {
                        testResult = { success: false, error: `❌ API Error (${status})`, details: errorData.error?.message || 'Unknown error' };
                    }
                }
            } catch (error: any) {
                testResult = { success: false, error: '🌐 Network Error', details: error.message || 'Unable to reach DeepSeek API' };
            }

        } else if (provider === 'openai') {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelId || 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    })
                });

                if (response.ok) {
                    testResult = { success: true, error: '', details: '✅ OpenAI API is working!' };
                } else {
                    const errorData = await response.json();
                    const status = response.status;

                    if (status === 401) {
                        testResult = { success: false, error: '🔑 Invalid API Key', details: 'The OpenAI API key is incorrect or revoked.' };
                    } else if (status === 429) {
                        testResult = { success: false, error: '⏱️ Rate Limit Exceeded', details: 'Too many requests. Wait and try again.' };
                    } else if (status === 404) {
                        testResult = { success: false, error: '❌ Model Not Found', details: `Model "${modelId}" doesn't exist or you don't have access.` };
                    } else if (status === 402) {
                        testResult = { success: false, error: '💳 Payment Required', details: 'Your OpenAI account has insufficient credits.' };
                    } else {
                        testResult = { success: false, error: `❌ API Error (${status})`, details: errorData.error?.message || 'Unknown error' };
                    }
                }
            } catch (error: any) {
                testResult = { success: false, error: '🌐 Network Error', details: error.message || 'Unable to reach OpenAI API' };
            }
        }

        return NextResponse.json(testResult);

    } catch (error: any) {
        console.error('[AI Test Error]:', error);
        return NextResponse.json(
            { success: false, error: '❌ Server Error', details: error.message },
            { status: 500 }
        );
    }
}
