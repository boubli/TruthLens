'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Robust iOS/iPadOS detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
        setIsIOS(isIosDevice);

        // Check Persistence (1 Week Cooldown)
        const checkPersistence = () => {
            const isInstalled = localStorage.getItem('pwa_installed') === 'true';
            if (isInstalled) return false;

            const dismissedAt = localStorage.getItem('pwa_dismissed_at');
            if (dismissedAt) {
                const diff = Date.now() - parseInt(dismissedAt, 10);
                const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
                if (diff < ONE_WEEK) {
                    return false; // Still in cooldown
                }
            }
            return true;
        };

        const shouldShow = checkPersistence();
        if (!shouldShow) return;

        // Capture the event (Android/Desktop Chrome)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Check if already installed
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
            if (!isInstalled) {
                // Show prompt after a delay
                setTimeout(() => setIsVisible(true), 3000);
            }
        };

        const handleAppInstalled = () => {
            localStorage.setItem('pwa_installed', 'true');
            setIsVisible(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // iOS Logic
        if (isIosDevice) {
            // Check if installed (standalone mode)
            const isInstalled = (window.navigator as any).standalone === true;
            if (!isInstalled && shouldShow) {
                setTimeout(() => setIsVisible(true), 3000);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
            localStorage.setItem('pwa_installed', 'true');
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Save dismissal time
        localStorage.setItem('pwa_dismissed_at', Date.now().toString());
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[99999] p-4 flex justify-center pointer-events-none"
                >
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex items-start gap-4 backdrop-blur-xl w-full max-w-md pointer-events-auto relative overflow-hidden">
                        {/* Background Gradient Mesh */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

                        <div className="shrink-0 relative z-10">
                            <img
                                src="/icons/icon-192x192.png"
                                alt="App Icon"
                                className="w-12 h-12 rounded-xl shadow-lg"
                            />
                        </div>

                        <div className="flex-1 min-w-0 pt-1 relative z-10">
                            <h3 className="font-bold text-white text-base">Install TruthLens</h3>
                            <p className="text-sm text-gray-400 mt-0.5 leading-snug">
                                {isIOS
                                    ? "Install specifically for iOS/iPad for the best experience."
                                    : "Add to your home screen for instant access."}
                            </p>

                            {isIOS ? (
                                <div className="mt-3 text-sm text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        1. Tap the <span className='mx-1 inline-flex items-center justify-center bg-white/10 w-6 h-6 rounded'><ShareIcon className="w-3 h-3" /></span> button in your browser/toolbar
                                    </div>
                                    <div className="flex items-center gap-2">
                                        2. Select <span className='font-bold text-white'>Add to Home Screen</span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleInstallClick}
                                    className="mt-3 w-full bg-gradient-to-r from-[#6C63FF] to-[#00F0FF] text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95 transition-all shadow-md"
                                >
                                    Install App
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="p-2 -mr-2 -mt-2 text-gray-500 hover:text-white transition-colors relative z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Simple Share Icon for iOS instructions
const ShareIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);
