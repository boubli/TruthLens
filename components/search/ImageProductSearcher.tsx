'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ImageProductSearcher() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user } = useAuth(); // Needed for auth token call if we were doing it manually, but api route handles cookie/header check generally, 
    // Next.js app router automatically passes cookies. 
    // But for a custom backend call we might need ID token if using Bearer.
    // We'll rely on session cookies if NextAuth, or getting token if Firebase.
    // TruthLens uses Firebase client SDK, so we need to get the token.

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            // 1. Attempt Local Barcode Decode
            const code = await attemptLocalBarcodeDecode(file);

            if (code) {
                console.log('Use Local Barcode:', code);
                router.push(`/products/${code}`);
                return;
            }

            // 2. If Barcode Not Found, Send to Backend for Visual Search
            await performVisualSearch(file);

        } catch (err: any) {
            console.error('Search failed:', err);
            setError(err.message || 'Failed to process image. Please try again.');
            setIsProcessing(false);
        }
    };

    const attemptLocalBarcodeDecode = async (file: File): Promise<string | null> => {
        const reader = new BrowserMultiFormatReader();
        try {
            const imageUrl = URL.createObjectURL(file);
            const result = await reader.decodeFromImageUrl(imageUrl);
            URL.revokeObjectURL(imageUrl); // Cleanup
            return result.getText();
        } catch (err) {
            // Not a barcode or failed to decode
            return null;
        }
    };

    const performVisualSearch = async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        // Get ID token for secure backend access
        const token = user ? await user.getIdToken() : '';

        const response = await fetch('/api/search-by-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle eligibility error specifically
            if (response.status === 403) {
                throw new Error('Premium feature. Please upgrade to use Visual Search.');
            }
            throw new Error(data.error || 'Visual search server error');
        }

        // Logic based on backend response
        if (data.productId) {
            router.push(`/products/${data.productId}`);
        } else if (data.query) {
            // Redirect to text search if no direct product found
            router.push(`/search?q=${encodeURIComponent(data.query)}`);
        } else {
            throw new Error('No results found for this image.');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
            />

            <button
                onClick={triggerFileInput}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all ${isProcessing
                        ? 'bg-gray-50 border-gray-300 cursor-wait'
                        : 'bg-white hover:bg-gray-50 border-emerald-500/50 hover:border-emerald-500 text-emerald-700 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-emerald-500/50 dark:text-emerald-400'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="font-medium text-gray-600 dark:text-gray-400">Analyzing Image...</span>
                    </>
                ) : (
                    <>
                        <Camera className="w-6 h-6" />
                        <span className="font-medium">Tap to Scan or Search by Photo</span>
                    </>
                )}
            </button>

            {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
