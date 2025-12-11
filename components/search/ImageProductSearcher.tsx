'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ImageProductSearcher() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user } = useAuth();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Updated: Direct Visual Search (No local barcode decoding)
            await performVisualSearch(file);

        } catch (err: any) {
            console.error('Search failed:', err);
            setError(err.message || 'Failed to process image. Please try again.');
            setIsProcessing(false);
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
