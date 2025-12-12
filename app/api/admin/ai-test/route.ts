
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import axios from 'axios';

// Admin-only route to test AI credentials without saving them
export async function POST(request: Request) {
    try {
        const { provider, apiKey, modelId } = await request.json();

        if (!provider || !apiKey) {
            return NextResponse.json({ success: false, error: 'Missing provider or API key' }, { status: 400 });
        }

        console.log(`[AI_TEST] Testing connection for ${provider} with model ${modelId || 'default'}`);

        let responseText = '';

        if (provider === 'groq') {
            const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: "Hello" }],
                model: modelId || "llama-3.3-70b-versatile",
                max_tokens: 5
            });
            responseText = completion.choices[0]?.message?.content || '';

        } else if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelId || "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            responseText = result.response.text();

        } else if (provider === 'deepseek') {
            const response = await axios.post(
                'https://api.deepseek.com/chat/completions',
                {
                    model: modelId || "deepseek-chat",
                    messages: [{ role: "user", content: "Hello" }],
                    max_tokens: 5
                },
                { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
            );
            responseText = response.data.choices[0]?.message?.content || "";
        } else if (provider === 'openai') {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: modelId || "gpt-4o-mini",
                    messages: [{ role: "user", content: "Hello" }],
                    max_tokens: 5
                },
                { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
            );
            responseText = response.data.choices[0]?.message?.content || "";
        } else {
            return NextResponse.json({ success: false, error: 'Provider not supported for testing yet' }, { status: 400 });
        }

        // If we got here without error, it works
        return NextResponse.json({
            success: true,
            message: `Connection Verified! Response: "${responseText.substring(0, 20)}..."`
        });

    } catch (error: any) {
        console.error('[AI_TEST] Connection Failed:', error.message);
        // Extract useful error message
        let errorMsg = error.message;
        if (error.response?.data?.error?.message) {
            errorMsg = error.response.data.error.message;
        }
        return NextResponse.json({ success: false, error: errorMsg }, { status: 400 }); // Return 400 to indicate validation fail
    }
}
