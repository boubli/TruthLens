'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share, PlusSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InstallGuidePage() {
    const router = useRouter();

    const steps = [
        {
            title: "Tap the Share Button",
            description: "Look for the share icon in your browser toolbar (bottom on iPhone, top on iPad).",
            image: "/images/install-guide/ios-share-step.png",
            icon: <Share className="w-6 h-6 text-blue-400" />
        },
        {
            title: "Select 'Add to Home Screen'",
            description: "Scroll down the list until you see 'Add to Home Screen' and tap it.",
            image: "/images/install-guide/ios-add-home-step.png",
            icon: <PlusSquare className="w-6 h-6 text-green-400" />
        },
        {
            title: "Confirm Install",
            description: "Tap 'Add' in the top right corner. The app will appear on your home screen.",
            image: "/icons/icon-192x192.png", // Using icon as generic confirmation or if I had a confirm image
            icon: null
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 sticky top-0 bg-black/80 backdrop-blur-xl py-4 z-50 border-b border-white/10">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Install TruthLens
                </h1>
            </div>

            {/* Intro */}
            <div className="text-center mb-10">
                <p className="text-gray-400 text-lg">
                    Follow these simple steps to install the app on your iPhone or iPad.
                </p>
            </div>

            {/* Steps */}
            <div className="space-y-12 max-w-md mx-auto">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="relative"
                    >
                        {/* Step Number */}
                        <div className="absolute -left-4 -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg z-10">
                            {index + 1}
                        </div>

                        {/* Card */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            {/* Image Container */}
                            <div className="aspect-[4/3] bg-black/50 relative flex items-center justify-center p-4">
                                {step.image ? (
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        className="rounded-xl shadow-lg max-h-full object-contain border border-white/5"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-white/10 rounded-xl" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-3">
                                    {step.icon && <span className="p-1.5 bg-white/10 rounded-lg">{step.icon}</span>}
                                    {step.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer / Done */}
            <div className="mt-12 text-center pb-8">
                <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                    <p className="text-blue-200 font-medium">
                        Looking forward to seeing you in the app!
                    </p>
                </div>
            </div>
        </div>
    );
}
