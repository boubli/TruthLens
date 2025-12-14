/**
 * Student Verification Service
 * Uses Ollama AI to verify student ID documents
 */

import axios from 'axios';
import type { ExtendedSystemSettings } from '@/types/system';

interface StudentVerificationResult {
    verified: boolean;
    reason: string;
    extractedData?: {
        name?: string;
        university?: string;
        expiryDate?: string;
    };
}

/**
 * Convert image file to base64 string
 */
export async function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Verify student ID using Ollama Vision AI
 * @param base64Image - Base64 encoded image of student ID
 * @param userName - User's name from profile for cross-check
 * @param ollamaUrl - Ollama server URL
 * @returns Verification result
 */
export async function verifyStudentWithOllama(
    base64Image: string,
    userName: string,
    ollamaUrl: string = 'http://localhost:11435'
): Promise<StudentVerificationResult> {
    try {
        // Use llava model for vision (or any vision-capable model you have installed)
        const prompt = `You are a student ID verification AI. Analyze this student ID image and verify if it's valid.

Check for:
1. Is this a valid student ID? (must have student name, university name, photo, and expiry/valid date)
2. Does the name match or is similar to: ${userName}
3. Is the ID still valid (not expired)?
4. Does it look authentic (not a fake or screenshot)?

Extract:
- Student name
- University name
- Expiry date (if shown)

Respond in JSON format:
{
  "verified": true/false,
  "reason": "Brief explanation",
  "name": "extracted name",
  "university": "extracted university",
  "expiryDate": "extracted date or null"
}`;

        const response = await axios.post(
            `${ollamaUrl}/api/generate`,
            {
                model: 'llava', // Vision model
                prompt: prompt,
                images: [base64Image],
                stream: false
            },
            { timeout: 30000 }
        );

        if (response.data?.response) {
            // Parse AI response
            const aiResponse = response.data.response;

            // Try to extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    verified: parsed.verified === true,
                    reason: parsed.reason || 'AI verification completed',
                    extractedData: {
                        name: parsed.name,
                        university: parsed.university,
                        expiryDate: parsed.expiryDate
                    }
                };
            }

            // Fallback: Check if response contains positive keywords
            const isVerified = aiResponse.toLowerCase().includes('valid') &&
                aiResponse.toLowerCase().includes('student');

            return {
                verified: isVerified,
                reason: isVerified ? 'Student ID appears valid' : 'Could not verify student ID',
                extractedData: {}
            };
        }

        throw new Error('No response from AI');
    } catch (error: any) {
        console.error('Ollama verification error:', error);
        return {
            verified: false,
            reason: `AI verification failed: ${error.message}`
        };
    }
}

/**
 * Server-side verification (for API routes)
 */
export async function verifyStudentServerSide(
    base64Image: string,
    userName: string
): Promise<StudentVerificationResult> {
    try {
        // Call internal API endpoint that has access to system settings
        const response = await fetch('/api/verify-student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image, userName })
        });

        if (!response.ok) {
            throw new Error('Verification API failed');
        }

        return await response.json();
    } catch (error: any) {
        return {
            verified: false,
            reason: `Verification failed: ${error.message}`
        };
    }
}
