'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to fetch keys securely from Firestore (Admin-only collection)
async function getSecureKeys() {
    try {
        const doc = await adminDb.collection('_system_secrets').doc('ai_config').get();
        if (!doc.exists) {
            console.warn('System secrets not found. Using fallback env vars.');
            return {
                groq: process.env.GROQ_API_KEY,
                gemini: process.env.GEMINI_API_KEY
            };
        }
        const data = doc.data();
        return {
            groq: data?.groq || process.env.GROQ_API_KEY,
            gemini: data?.gemini || process.env.GEMINI_API_KEY
        };
    } catch (error) {
        console.error('Failed to fetch secure keys:', error);
        return { groq: process.env.GROQ_API_KEY, gemini: process.env.GEMINI_API_KEY };
    }
}

export async function generateAIResponse(prompt: string, provider: 'groq' | 'gemini' = 'groq') {
    const keys = await getSecureKeys();

    try {
        if (provider === 'groq') {
            if (!keys.groq) throw new Error('Groq API Key missing in _system_secrets');
            const groq = new Groq({ apiKey: keys.groq });

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
            });
            return completion.choices[0]?.message?.content || 'No response';
        }
        else if (provider === 'gemini') {
            if (!keys.gemini) throw new Error('Gemini API Key missing in _system_secrets');
            const genAI = new GoogleGenerativeAI(keys.gemini);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const result = await model.generateContent(prompt);
            return result.response.text();
        }
    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return `Error: ${error.message}`;
    }
    return '';
}
