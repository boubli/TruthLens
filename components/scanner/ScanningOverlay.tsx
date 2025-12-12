import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, ZapOff } from 'lucide-react';

interface ScanningOverlayProps {
    onClose: () => void;
    onToggleFlash?: () => void;
    isFlashOn?: boolean;
    hasFlash?: boolean;
}

export default function ScanningOverlay({ onClose, onToggleFlash, isFlashOn, hasFlash }: ScanningOverlayProps) {
    return (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
            {/* 1. Header (Top Bar) - Absolute to stick to top */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pt-safe-top pointer-events-auto z-50">
                <button
                    onClick={onClose}
                    className="p-3.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white active:scale-95 transition-all shadow-lg hover:bg-black/60"
                    aria-label="Close Scanner"
                >
                    <X size={26} />
                </button>

                {hasFlash && (
                    <button
                        onClick={onToggleFlash}
                        className={`p-3.5 rounded-full backdrop-blur-xl border active:scale-95 transition-all shadow-lg hover:bg-opacity-80 ${isFlashOn
                                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                                : 'bg-black/40 border-white/10 text-white'
                            }`}
                        aria-label="Toggle Flash"
                    >
                        {isFlashOn ? <Zap size={26} fill="currentColor" /> : <ZapOff size={26} />}
                    </button>
                )}
            </div>

            {/* 2. Main Scanner Frame (Centered via Flexbox parent) */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 z-30">

                {/* BACKDROP HACK: Huge shadow to create the 'hole' */}
                {/* This shadow draws a semi-transparent black overlay everywhere EXCEPT inside this div */}
                <div
                    className="absolute inset-0 rounded-[2.5rem] shadow-[0_0_0_4000px_rgba(0,0,0,0.75)] pointer-events-auto"
                />

                {/* Border Ring (The glowing frame) */}
                <div className="absolute inset-0 rounded-[2.5rem] border-[3px] border-white/20 pointer-events-none" />

                {/* Animated Scanner Laser */}
                <div className="absolute inset-[3px] rounded-[2.5rem] overflow-hidden pointer-events-none">
                    <motion.div
                        initial={{ top: '-10%', opacity: 0 }}
                        animate={{ top: ['0%', '50%', '100%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-sm"
                    />
                    <motion.div
                        initial={{ top: '-10%', opacity: 0 }}
                        animate={{ top: ['0%', '50%', '100%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5 bg-cyan-400"
                    />
                </div>

                {/* Active Corners (Cyan) */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-cyan-400 rounded-tl-[2rem] -mt-[3px] -ml-[3px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-cyan-400 rounded-tr-[2rem] -mt-[3px] -mr-[3px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-cyan-400 rounded-bl-[2rem] -mb-[3px] -ml-[3px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-cyan-400 rounded-br-[2rem] -mb-[3px] -mr-[3px] pointer-events-none" />

                {/* Status Text (Below the frame) */}
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-max text-center z-50 pointer-events-none">
                    <div className="px-6 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xl">
                        <span className="text-white text-sm font-medium tracking-wide">
                            Align barcode to scan
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. Bottom Gradient (Footer Area) - Absolute to stick to bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
        </div>
    );
}
