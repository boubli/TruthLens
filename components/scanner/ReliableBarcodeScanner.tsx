'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Scan, Upload, Camera, AlertCircle, RefreshCw, X } from 'lucide-react';

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

    // Initialize the reader
    useEffect(() => {
        codeReader.current = new BrowserMultiFormatReader();
        return () => {
            stopScanning();
        };
    }, []);

    useEffect(() => {
        if (autoStart) {
            startScanning();
        }
    }, [autoStart]);

    const startScanning = useCallback(async () => {
        if (!codeReader.current || !videoRef.current) return;

        setError(null);
        setIsScanning(true);

        try {
            // List cameras - helpful for debugging or selection future features
            // const videoInputDevices = await codeReader.current.listVideoInputDevices();

            // Attempt to decode from video device
            // undefined typically chooses the environment facing camera by default on mobile
            await codeReader.current.decodeFromVideoDevice(
                null,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        onResult(result.getText());
                        // Optional: Stop after first scan? For now, we keep scanning or let parent control mount
                    }
                    if (err && !(err instanceof NotFoundException)) {
                        // Real errors (not just "no code found yet")
                        console.warn("Scanning minor error:", err);
                    }
                }
            );
        } catch (err) {
            console.error("Failed to start camera scan:", err);
            setError("Could not access camera. Please use the 'Upload/Photo' button.");
            setIsScanning(false);
            if (onError) onError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [onResult, onError]);

    const stopScanning = useCallback(() => {
        if (codeReader.current) {
            codeReader.current.reset();
        }
        setIsScanning(false);
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !codeReader.current) return;

        setError(null);

        try {
            // Create an image URL for the decoder
            const imageUrl = URL.createObjectURL(file);

            // Decode directly from the image file
            const result = await codeReader.current.decodeFromImageUrl(imageUrl);

            if (result) {
                onResult(result.getText());
            }

            // Clean up
            URL.revokeObjectURL(imageUrl);
        } catch (err) {
            console.error("Failed to decode from file:", err);
            setError("No barcode found in image. Please try again with a clearer photo.");
            if (onError) onError(err instanceof Error ? err : new Error('Failed to decode image'));
        } finally {
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            {/* Hidden File Input for Fallback */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />

            {/* Main Scanning Area */}
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800">

                {/* Video Element */}
                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${!isScanning ? 'hidden' : 'block'}`}
                    playsInline // Important for iOS
                    muted // Important for autoplay policies
                />

                {/* Overlay scans / Guide */}
                {isScanning && !error && (
                    <div className="absolute inset-0 border-2 border-red-500/50 m-8 rounded-lg animate-pulse pointer-events-none flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                    </div>
                )}

                {/* Idle / Error State UI */}
                {(!isScanning || error) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-900/90 text-white">
                        {error ? (
                            <>
                                <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                                <p className="text-sm font-medium text-red-200 mb-4">{error}</p>
                            </>
                        ) : (
                            <>
                                <Camera className="w-12 h-12 text-gray-500 mb-2" />
                                <p className="text-gray-400">Camera is off</p>
                            </>
                        )}

                        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                            {/* Retry Real-time Button */}
                            {!isScanning && (
                                <button
                                    onClick={startScanning}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {error ? "Retry Camera" : "Start Camera"}
                                </button>
                            )}

                            {/* Fallback Button - Prominent for iOS reliability */}
                            <button
                                onClick={triggerFileUpload}
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                {error ? "Take Photo / Upload" : "Scan via Photo (Reliable)"}
                            </button>
                        </div>

                    </div>
                )}

                {/* Close/Stop Button Overlay */}
                {isScanning && (
                    <button
                        onClick={stopScanning}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                        aria-label="Stop Scanning"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Instructions / Help Text */}
            <div className="text-center space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Point your camera at a barcode.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Having trouble? Use the <strong>"Scan via Photo"</strong> button to take a picture instead.
                </p>
            </div>
        </div>
    );
};

export default ReliableBarcodeScanner;
