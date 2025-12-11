'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Scan, Upload, Camera, Zap, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReliableBarcodeScannerProps {
    onResult: (result: string) => void;
    onError?: (error: Error) => void;
    autoStart?: boolean;
}

const ReliableBarcodeScanner: React.FC<ReliableBarcodeScannerProps> = ({
    onResult,
    onError,
    autoStart = true,
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize
    useEffect(() => {
        codeReader.current = new BrowserMultiFormatReader();
        return () => {
            stopScanning();
        };
    }, []);

    useEffect(() => {
        if (autoStart) startScanning();
    }, [autoStart]);

    const startScanning = useCallback(async () => {
        if (!codeReader.current || !videoRef.current) return;
        setError(null);
        setIsScanning(true);

        try {
            await codeReader.current.decodeFromVideoDevice(
                null,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        handleSuccess(result.getText());
                    }
                    // Ignore noise errors
                }
            );
        } catch (err) {
            console.error("Camera failed:", err);
            setError("Camera access failed. Switch to photo mode.");
            setIsScanning(false);
            if (onError) onError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [onError]);

    const stopScanning = useCallback(() => {
        codeReader.current?.reset();
        setIsScanning(false);
    }, []);

    const handleSuccess = (code: string) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
        }
        onResult(code);
        stopScanning();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !codeReader.current) return;

        try {
            const imageUrl = URL.createObjectURL(file);
            const result = await codeReader.current.decodeFromImageUrl(imageUrl);
            if (result) {
                handleSuccess(result.getText());
            }
            URL.revokeObjectURL(imageUrl);
        } catch (err) {
            setError("Could not read barcode from image.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black z-0" />

            {/* Main Scanner Window */}
            <div className="relative z-10 w-full max-w-lg aspect-[3/4] sm:aspect-[9/16] max-h-[80vh] bg-black/50 rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm">

                {/* Hidden Fallback Input */}
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />

                {/* Camera View */}
                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isScanning ? 'opacity-100' : 'opacity-0'}`}
                    playsInline
                    muted
                />

                {/* AI Overlay / HUD */}
                {isScanning && !error && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Corner Brackets */}
                        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg opacity-80" />
                        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg opacity-80" />
                        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg opacity-80" />
                        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-cyan-500 rounded-br-lg opacity-80" />

                        {/* Scanning Laser */}
                        <motion.div
                            animate={{ top: ['10%', '90%', '10%'] }}
                            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                        />

                        {/* Grid Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

                        {/* Status Text */}
                        <div className="absolute top-12 left-0 right-0 text-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md"
                            >
                                <Zap className="w-3 h-3 text-cyan-400 mr-2 animate-pulse" />
                                <span className="text-xs font-medium text-cyan-300 tracking-wider">AI VISION ACTIVE</span>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Error / Fallback State (AI Theme) */}
                {!isScanning || error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-950/90 backdrop-blur-md z-20">
                        <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 ring-1 ring-white/5">
                            {error ? <Zap className="w-8 h-8 text-red-400" /> : <Camera className="w-8 h-8 text-cyan-400" />}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                            {error ? "Vision Stream Offline" : "Scanner Standby"}
                        </h3>
                        <p className="text-sm text-gray-400 mb-8 max-w-[200px]">
                            {error ? "Unable to access camera feed. Engage manual override." : "Initialize scanning sequence."}
                        </p>

                        <div className="space-y-3 w-full max-w-xs">
                            <button
                                onClick={startScanning}
                                className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group"
                            >
                                <Camera className="w-4 h-4 text-black" />
                                <span>Initialize Camera</span>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3.5 px-6 rounded-xl bg-white/5 text-white font-medium border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                                <span>Manual Image Analysis</span>
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Manual File Upload Trigger (Floating Action, visible during scan) */}
            {isScanning && !error && (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-8 right-8 p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all z-20"
                    aria-label="Upload Image"
                >
                    <ImageIcon className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export default ReliableBarcodeScanner;
