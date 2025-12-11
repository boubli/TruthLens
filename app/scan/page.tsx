'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ScanBarcode from '@/components/scanner/ScanBarcode';
import { ArrowLeft } from 'lucide-react';

// Simplified Scan Page - No Backend Logic
export default function ScanPage() {
    const router = useRouter();
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

    // Navigation Handler
    const handleScanResult = (code: string) => {
        if (lastScannedCode === code) return;
        setLastScannedCode(code);

        // Direct navigation to product
        router.push(`/product/${code}?source=scan`);
    };

    return (
        <div className="fixed inset-0 bg-black text-white">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="pointer-events-auto p-3 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Immersive Scanner */}
            <ScanBarcode
                onResult={handleScanResult}
            />
        </div>
    );
}
