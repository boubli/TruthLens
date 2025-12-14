'use server';

import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import axios from 'axios';

// --- SECRET MANAGEMENT ---

async function getSystemKey(provider: string): Promise<string | undefined> {
    try {
        if (!adminDb) return undefined;
        const doc = await adminDb.collection('_system_secrets').doc('api_keys').get();
        return doc.data()?.[provider];
    } catch (e) {
        console.error('Failed to fetch system key', e);
        return undefined;
    }
}

// --- AI PROVIDERS ---

export async function serverCallGemini(prompt: string): Promise<string> {
    const key = (await getSystemKey('gemini')) || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini Key configuration missing");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e: any) {
        if (e.message?.includes('404')) {
            const fallback = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const res = await fallback.generateContent(prompt);
            return res.response.text();
        }
        throw e;
    }
}

export async function serverCallGroq(prompt: string): Promise<string> {
    const key = (await getSystemKey('groq')) || process.env.GROQ_API_KEY;
    if (!key) throw new Error("Groq Key configuration missing");

    const groq = new Groq({ apiKey: key });
    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
    });
    return completion.choices[0]?.message?.content || "";
}

export async function serverCallOpenAICompatible(prompt: string, provider: 'deepseek' | 'cerebras' | 'sambanova'): Promise<string> {
    const key = await getSystemKey(provider) || process.env[`${provider.toUpperCase()}_API_KEY`];
    if (!key) throw new Error(`${provider} Key configuration missing`);

    const config = {
        deepseek: { url: "https://api.deepseek.com/v1", model: "deepseek-chat" },
        cerebras: { url: "https://api.cerebras.ai/v1", model: "llama3.1-70b" },
        sambanova: { url: "https://api.sambanova.ai/v1", model: "Meta-Llama-3.1-70B-Instruct" }
    };

    const { url, model } = config[provider];

    const response = await axios.post(
        `${url}/chat/completions`,
        {
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
        },
        { headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' } }
    );
    return response.data.choices[0]?.message?.content || "";
}

// --- SWARM LOGIC (Server Side) ---

export async function serverSwarmResponse(prompt: string, providers: string[] = ['groq', 'gemini']): Promise<string> {
    console.log(`🐝 [Server Swarm] Racing ${providers.join(', ')}...`);

    const promises: Promise<string>[] = [];

    if (providers.includes('groq')) promises.push(serverCallGroq(prompt));
    if (providers.includes('gemini')) promises.push(serverCallGemini(prompt));
    if (providers.includes('deepseek')) promises.push(serverCallOpenAICompatible(prompt, 'deepseek'));
    if (providers.includes('cerebras')) promises.push(serverCallOpenAICompatible(prompt, 'cerebras'));
    if (providers.includes('sambanova')) promises.push(serverCallOpenAICompatible(prompt, 'sambanova'));

    try {
        const winner = await Promise.any(promises);
        return winner;
    } catch (error) {
        console.error("☠️ [Server Swarm] All providers failed:", error);
        throw new Error("All AI providers failed on server.");
    }
}
