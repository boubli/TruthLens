/**
 * Groq Service
 * Fallback AI provider for PC build intelligence
 */

import { getSystemSettings } from './systemService';
import { PCComponent, PCBuildMetrics, GrokBuildResponse, PCBuildComponents, HardwareInput } from '@/types/pcBuilder';
import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama3-8b-8192';

import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Make a request to Groq API
 */
async function callGroq(
    messages: { role: string; content: string }[],
    maxTokens: number = 2000
): Promise<string> {

    // ...

    const settings = await getSystemSettings();
    let token = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    let model = DEFAULT_MODEL;

    // 1. Check Secure Admin Secrets First (Server-Side Only)
    if (adminDb) {
        try {
            const secretDoc = await adminDb.collection('_system_secrets').doc('api_keys').get();
            if (secretDoc.exists) {
                const secrets = secretDoc.data();
                if (secrets?.groq) {
                    token = secrets.groq;
                    console.log('[Groq] Using Secure Admin Key');
                }
            }
        } catch (e) {
            console.warn('[Groq] Failed to fetch admin secrets:', e);
        }
    }

    // 2. Fallback to Public/Legacy Settings (Admin overrides)
    if (!token && settings.apiKeys?.groq) {
        token = settings.apiKeys.groq;
    }
    if (settings.apiKeys?.models?.groq) {
        model = settings.apiKeys.models.groq;
    }

    if (!token) {
        throw new Error('Groq API Key not configured.');
    }

    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model,
                messages,
                max_tokens: maxTokens,
                temperature: 0.7,
                response_format: { type: "json_object" } // Force JSON mode if supported, or rely on prompt
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices?.[0]?.message?.content || '';
    } catch (error: any) {
        console.error('[Groq] API Error:', error.response?.status, error.response?.data || error.message);
        throw new Error(`Groq API error: ${error.response?.status || 'Unknown'}`);
    }
}

/**
 * Generate a PC build recommendation using Groq
 */
export async function generateBuildWithGroq(
    mode: 'budget' | 'hardware',
    input: { budget?: number; existingHardware?: HardwareInput }
): Promise<GrokBuildResponse> {
    const systemPrompt = `You are a professional PC hardware expert and system builder. 
You analyze hardware compatibility, calculate bottlenecks, and recommend optimal builds.
Always respond with valid JSON only, no markdown formatting.`;

    // Format the existing hardware object into a clear list
    const hardwareList = input.existingHardware
        ? Object.entries(input.existingHardware)
            .filter(([_, value]) => value && value.trim() !== '')
            .map(([key, value]) => `- ${key.toUpperCase()}: ${value}`)
            .join('\n')
        : 'None specified';

    const userPrompt = mode === 'budget'
        ? `User has a budget of $${input.budget} USD for a complete PC build.
Recommend the best components (CPU, GPU, RAM, Motherboard, PSU, Case, Storage, Cooler) that:
1. Minimize CPU-GPU bottleneck
2. Maximize gaming/workstation performance
3. Stay within budget
4. Are currently available to purchase

Respond ONLY with this JSON structure:
{
  "cpu": {"name": "Model Name", "brand": "Brand", "specifications": {"cores": 8, "threads": 16, "baseClock": "3.5GHz"}},
  "gpu": {"name": "Model Name", "brand": "Brand", "specifications": {"vram": "12GB", "architecture": "..."}},
  "ram": {"name": "Model Name", "brand": "Brand", "specifications": {"capacity": "32GB", "speed": "DDR5-6000"}},
  "motherboard": {"name": "Model Name", "brand": "Brand", "specifications": {"socket": "AM5", "chipset": "..."}},
  "psu": {"name": "Model Name", "brand": "Brand", "specifications": {"wattage": 750, "rating": "80+ Gold"}},
  "case": {"name": "Model Name", "brand": "Brand", "specifications": {"formFactor": "ATX"}},
  "storage": {"name": "Model Name", "brand": "Brand", "specifications": {"capacity": "1TB", "type": "NVMe SSD"}},
  "cooler": {"name": "Model Name", "brand": "Brand", "specifications": {"type": "Tower", "tdp": 250}},
  "bottleneckScore": 5,
  "estimatedWattage": 550,
  "reasoning": "Brief explanation of choices"
}`
        : `User ALREADY OWNS the following hardware:
${hardwareList}

Recommend compatible components to COMPLETE the build.
RULES:
1. DO NOT recommend components that the user already has (unless the existing one is incompatible/garbage, then explain why).
2. Ensure 100% compatibility (Socket, Chipset, Dimension, PSU wattage).
3. Minimize bottleneck.

Respond ONLY with this JSON structure (omit components the user already has):
{
  "cpu": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "gpu": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "ram": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "motherboard": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "psu": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "case": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "storage": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "cooler": {"name": "Model Name", "brand": "Brand", "specifications": {...}},
  "bottleneckScore": 10,
  "estimatedWattage": 600,
  "reasoning": "Brief explanation"
}`;

    const content = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    // Clean and parse JSON response
    const cleanedJson = content
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    try {
        return JSON.parse(cleanedJson) as GrokBuildResponse;
    } catch (parseError) {
        console.error('[Groq] Failed to parse response:', cleanedJson);
        throw new Error('Failed to parse AI response from Groq.');
    }
}

/**
 * Calculate bottleneck score for a given set of components using Groq
 */
export async function calculateBottleneckWithGroq(
    components: PCBuildComponents
): Promise<PCBuildMetrics> {
    const systemPrompt = `You are a PC hardware bottleneck analyzer. Analyze component pairings and estimate performance metrics. Respond only in JSON.`;
    const userPrompt = `Analyze this PC build for CPU-GPU bottleneck and power consumption:
${JSON.stringify(components, null, 2)}
Respond with this JSON only:
{
  "bottleneckScore": 0-100 (lower is better, 0=perfect balance),
  "estimatedWattage": total system power draw in watts,
  "performanceScore": 0-100 (overall performance rating),
  "compatibilityIssues": ["issue1", "issue2"] or empty array
}`;

    try {
        const content = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 500);

        const cleanedJson = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        return {
            bottleneckScore: parsed.bottleneckScore ?? 10,
            estimatedWattage: parsed.estimatedWattage ?? 500,
            performanceScore: parsed.performanceScore,
            compatibilityIssues: parsed.compatibilityIssues || []
        };
    } catch (error) {
        console.error('[Groq] Bottleneck calculation failed:', error);
        return {
            bottleneckScore: 15,
            estimatedWattage: 550,
            compatibilityIssues: []
        };
    }
}
