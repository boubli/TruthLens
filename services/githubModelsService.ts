/**
 * GitHub Models Service
 * Communicates with GitHub Models API for PC build intelligence (replaces Azure ML)
 * Uses OpenAI-compatible API format
 */

import { getSystemSettings } from './systemService';
import { PCComponent, PCBuildMetrics, GrokBuildResponse, PCBuildComponents } from '@/types/pcBuilder';

const GITHUB_MODELS_ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4.1';

/**
 * Make a request to GitHub Models API
 */
async function callGitHubModels(
    messages: { role: string; content: string }[],
    maxTokens: number = 2000
): Promise<string> {
    const settings = await getSystemSettings();
    const token = settings.apiKeys?.githubModelsToken;
    const model = settings.apiKeys?.githubModelsModel || DEFAULT_MODEL;

    if (!token) {
        throw new Error('GitHub Models API not configured. Please set the token in Admin Settings.');
    }

    const response = await fetch(GITHUB_MODELS_ENDPOINT, {
        method: 'POST',
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[GitHub Models] API Error:', response.status, errorText);
        throw new Error(`GitHub Models API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate a PC build recommendation using GitHub Models (GPT-4.1 / Grok-style)
 */
export async function generateBuildWithGitHubModels(
    mode: 'budget' | 'hardware',
    input: { budget?: number; existingHardware?: string }
): Promise<GrokBuildResponse> {
    const systemPrompt = `You are a professional PC hardware expert and system builder. 
You analyze hardware compatibility, calculate bottlenecks, and recommend optimal builds.
Always respond with valid JSON only, no markdown formatting.`;

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
        : `User already has this hardware: ${input.existingHardware}
Recommend compatible components to complete a balanced PC build that:
1. Minimizes bottleneck with existing hardware
2. Offers best performance for the money
3. Is fully compatible

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

    const content = await callGitHubModels([
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
        console.error('[GitHub Models] Failed to parse response:', cleanedJson);
        throw new Error('Failed to parse AI response. Please try again.');
    }
}

/**
 * Calculate bottleneck score for a given set of components
 */
export async function calculateBottleneckWithGitHubModels(
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
        const content = await callGitHubModels([
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
        console.error('[GitHub Models] Bottleneck calculation failed:', error);
        // Fallback estimation
        return {
            bottleneckScore: 15,
            estimatedWattage: 550,
            compatibilityIssues: []
        };
    }
}

/**
 * Check if GitHub Models is configured and working
 */
export async function checkGitHubModelsHealth(): Promise<boolean> {
    try {
        const settings = await getSystemSettings();
        if (!settings.apiKeys?.githubModelsToken) {
            return false;
        }

        await callGitHubModels([
            { role: 'user', content: 'Say "OK" only' }
        ], 10);

        return true;
    } catch {
        return false;
    }
}
