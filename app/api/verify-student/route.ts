import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import axios from 'axios';

export async function POST(req: NextRequest) {
    try {
        const { base64Image, userName } = await req.json();

        if (!base64Image || !userName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get Ollama URL from system settings
        const settingsDoc = await adminDb?.collection('system').doc('settings').get();
        const settings = settingsDoc?.data();
        const ollamaUrl = settings?.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434';

        // Use llava vision model for verification
        const prompt = `You are a student ID verification AI. Analyze this student ID image.

User's name: ${userName}

Check:
1. Valid student ID? (has name, university, photo, expiry)
2. Name matches "${userName}"? (allow minor differences)
3. Not expired?
4. Looks authentic?

Respond ONLY in this JSON format:
{
  "verified": true|false,
  "reason": "brief explanation",
  "name": "student name or null",
  "university": "university name or null",
  "expiryDate": "expiry date or null"
}`;

        const response = await axios.post(
            `${ollamaUrl}/api/generate`,
            {
                model: 'llava',
                prompt: prompt,
                images: [base64Image],
                stream: false
            },
            { timeout: 60000 } // 60 second timeout for vision processing
        );

        if (response.data?.response) {
            const aiResponse = response.data.response;

            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return NextResponse.json({
                    verified: parsed.verified === true,
                    reason: parsed.reason || 'AI verification completed',
                    extractedData: {
                        name: parsed.name,
                        university: parsed.university,
                        expiryDate: parsed.expiryDate
                    }
                });
            }

            // Fallback: keyword check
            const isVerified = aiResponse.toLowerCase().includes('valid') &&
                aiResponse.toLowerCase().includes('student');

            return NextResponse.json({
                verified: isVerified,
                reason: isVerified ? 'Student ID appears valid' : 'Could not verify student ID'
            });
        }

        return NextResponse.json(
            { verified: false, reason: 'No AI response' },
            { status: 500 }
        );
    } catch (error: any) {
        console.error('Student verification error:', error);
        return NextResponse.json(
            { verified: false, reason: `Verification failed: ${error.message}` },
            { status: 500 }
        );
    }
}
