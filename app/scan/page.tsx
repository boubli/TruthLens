'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Image from 'next/image';

const SCANNER_REGION_ID = 'scanner-region';

// Project Theme Colors (from theme/theme.ts)
const THEME = {
    primary: '#6C63FF',    // Vibrant Purple
    secondary: '#00F0FF',  // Cyber Neon Cyan
    bgDark: '#0A0A0A',     // Deep Black
    bgPaper: '#1F1F1F',    // Dark Gray
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
};

export default function ScanPage() {
    const router = useRouter();
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const [showStartScreen, setShowStartScreen] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Result Modal State
    const [showResult, setShowResult] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [scannedFormat, setScannedFormat] = useState('');

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        setShowStartScreen(false);
        setError(null);

        try {
            // Check HTTPS
            if (typeof window !== 'undefined' && !window.isSecureContext) {
                setError('Camera requires HTTPS.');
                return;
            }

            const html5QrCode = new Html5Qrcode(SCANNER_REGION_ID, {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.QR_CODE
                ],
                verbose: false
            });
            scannerRef.current = html5QrCode;

            const aspectRatio = window.innerWidth / window.innerHeight;

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: aspectRatio
                },
                onScanSuccess,
                () => { } // Ignore per-frame errors
            );

            setIsScanning(true);

        } catch (err: any) {
            console.error('Scanner start error:', err);
            setError(err.message || 'Camera access denied.');
            setShowStartScreen(true);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                console.warn('Error stopping scanner:', e);
            }
        }
        setIsScanning(false);
        setShowStartScreen(true);
    };

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        // Beep Sound
        playBeep();

        // Pause scanning
        scannerRef.current?.pause();

        setScannedCode(decodedText);
        setScannedFormat(decodedResult?.result?.format?.formatName || 'Unknown');
        setShowResult(true);
    };

    const handleProcessProduct = async () => {
        setIsProcessing(true);
        setShowResult(false);

        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
        }

        try {
            const response = await fetch('/api/product/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: scannedCode })
            });

            if (response.ok) {
                await stopScanner();
                router.push(`/product/${scannedCode}?source=scan`);
            } else if (response.status === 404) {
                setError('Product not found.');
                setIsProcessing(false);
                scannerRef.current?.resume();
            } else {
                const data = await response.json();
                setError(data.error || 'Scan failed');
                setIsProcessing(false);
                scannerRef.current?.resume();
            }
        } catch (err) {
            console.error('API Error:', err);
            setError('Network error.');
            setIsProcessing(false);
            scannerRef.current?.resume();
        }
    };

    const handleScanNext = () => {
        setShowResult(false);
        scannerRef.current?.resume();
    };

    const handleClose = () => {
        stopScanner();
        router.back();
    };

    const playBeep = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            oscillator.start();
            setTimeout(() => oscillator.stop(), 100);
        } catch { }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: THEME.bgDark,
            color: THEME.text,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'sans-serif',
            overflow: 'hidden',
            zIndex: 9999
        }}>
            {/* Header Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '16px',
                zIndex: 30,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${THEME.primary}40`
                    }}>
                        <Image src="/icons/icon-192x192.png" alt="Logo" width={20} height={20} style={{ borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.5px' }}>TruthLens</span>
                </div>
                <div style={{
                    fontSize: 12,
                    color: isScanning ? THEME.secondary : THEME.textSecondary,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.1)',
                    pointerEvents: 'auto'
                }}>
                    {isScanning ? 'Scanning' : 'Ready'}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>

                {/* Camera Feed */}
                <div id={SCANNER_REGION_ID} style={{ width: '100%', height: '100%' }} />

                {/* Scan Overlay (Visible when scanning) */}
                {isScanning && !showStartScreen && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: 10
                    }}>
                        {/* Top Dim */}
                        <div style={{ flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' }} />

                        {/* Middle Row */}
                        <div style={{ display: 'flex', width: '100%', height: 260 }}>
                            <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />

                            {/* Viewfinder */}
                            <div style={{
                                position: 'relative',
                                width: 260,
                                height: 260,
                                backgroundColor: 'transparent'
                            }}>
                                {/* Corners */}
                                <Corner position="tl" color={THEME.secondary} />
                                <Corner position="tr" color={THEME.secondary} />
                                <Corner position="bl" color={THEME.secondary} />
                                <Corner position="br" color={THEME.secondary} />

                                {/* Laser */}
                                <div style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: 4,
                                    background: `linear-gradient(to right, transparent, ${THEME.secondary}, ${THEME.primary}, ${THEME.secondary}, transparent)`,
                                    boxShadow: `0 0 15px ${THEME.secondary}CC, 0 0 5px ${THEME.secondary}80`,
                                    borderRadius: 10,
                                    animation: 'scan 1.5s infinite ease-in-out alternate'
                                }} />

                                {/* Instruction */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: -48,
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center'
                                }}>
                                    <span style={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: THEME.text,
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                    }}>
                                        Align code within frame
                                    </span>
                                </div>
                            </div>

                            <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                        </div>

                        {/* Bottom Dim */}
                        <div style={{ flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
                    </div>
                )}

                {/* Start Screen */}
                {showStartScreen && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: THEME.bgDark,
                        zIndex: 20,
                        padding: 24
                    }}>
                        {/* Icon */}
                        <div style={{
                            position: 'relative',
                            marginBottom: 32
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: -20,
                                background: `radial-gradient(circle, ${THEME.primary}40 0%, transparent 70%)`,
                                filter: 'blur(20px)'
                            }} />
                            <div style={{
                                width: 96,
                                height: 96,
                                borderRadius: 24,
                                backgroundColor: THEME.bgPaper,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${THEME.bgPaper}`,
                                boxShadow: `0 20px 60px ${THEME.primary}30`
                            }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={THEME.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                </svg>
                            </div>
                        </div>

                        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>TruthLens</h2>
                        <p style={{
                            color: THEME.textSecondary,
                            marginBottom: 32,
                            textAlign: 'center',
                            maxWidth: 280,
                            lineHeight: 1.6
                        }}>
                            Scan barcodes and QR codes to reveal product truths instantly.
                        </p>

                        <button
                            onClick={startScanner}
                            style={{
                                padding: '16px 32px',
                                background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`,
                                border: 'none',
                                borderRadius: 24,
                                color: THEME.text,
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: 'pointer',
                                boxShadow: `0 8px 32px ${THEME.primary}50`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Activate Scanner
                        </button>
                    </div>
                )}

                {/* Controls (when scanning) */}
                {isScanning && !showStartScreen && (
                    <div style={{
                        position: 'absolute',
                        bottom: 40,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 24,
                        zIndex: 20,
                        pointerEvents: 'none'
                    }}>
                        <button
                            onClick={handleClose}
                            style={{
                                pointerEvents: 'auto',
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: THEME.text,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Result Modal */}
            {showResult && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: 420,
                        maxHeight: '85vh',
                        backgroundColor: THEME.bgPaper,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 24,
                        overflow: 'auto',
                        position: 'relative'
                    }}>
                        {/* Decorative Top Line */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 80,
                            height: 4,
                            borderRadius: 2,
                            background: `linear-gradient(90deg, ${THEME.primary}, ${THEME.secondary})`,
                            opacity: 0.6
                        }} />

                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 16,
                            marginTop: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Code Detected</h2>
                                    <span style={{ fontSize: 12, color: THEME.textSecondary }}>{scannedFormat}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleScanNext}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    backgroundColor: THEME.bgDark,
                                    border: 'none',
                                    color: THEME.textSecondary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Raw Data */}
                        <div style={{
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                            border: `1px solid ${THEME.bgDark}`
                        }}>
                            <p style={{ fontSize: 12, color: THEME.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Scanned Data
                            </p>
                            <p style={{
                                fontSize: 18,
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                                margin: 0
                            }}>
                                {scannedCode}
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <button
                                onClick={() => navigator.clipboard.writeText(scannedCode)}
                                style={{
                                    padding: 14,
                                    backgroundColor: THEME.bgDark,
                                    border: `1px solid ${THEME.bgPaper}`,
                                    borderRadius: 12,
                                    color: THEME.text,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                                Copy
                            </button>
                            <button
                                onClick={handleProcessProduct}
                                disabled={isProcessing}
                                style={{
                                    padding: 14,
                                    background: `linear-gradient(135deg, ${THEME.primary} 0%, #8B5CF6 100%)`,
                                    border: 'none',
                                    borderRadius: 12,
                                    color: THEME.text,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    boxShadow: `0 4px 12px ${THEME.primary}40`,
                                    opacity: isProcessing ? 0.7 : 1
                                }}
                            >
                                {isProcessing ? 'Loading...' : '✨ View Product'}
                            </button>
                        </div>

                        <button
                            onClick={handleScanNext}
                            style={{
                                width: '100%',
                                marginTop: 12,
                                padding: 14,
                                background: THEME.secondary,
                                border: 'none',
                                borderRadius: 12,
                                color: '#000',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: `0 4px 12px ${THEME.secondary}40`
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Scan Next
                        </button>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div style={{
                    position: 'fixed',
                    top: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    backdropFilter: 'blur(8px)',
                    color: THEME.text,
                    padding: '12px 24px',
                    borderRadius: 24,
                    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 500
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {error}
                </div>
            )}

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0%; transform: scaleX(0.9); }
                    100% { top: calc(100% - 4px); transform: scaleX(1); }
                }
                
                #${SCANNER_REGION_ID} video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 0 !important;
                }
                
                #${SCANNER_REGION_ID} > div {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}

// Corner Component
function Corner({ position, color }: { position: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
    const styles: React.CSSProperties = {
        position: 'absolute',
        width: 32,
        height: 32,
        borderStyle: 'solid',
        borderColor: color,
        boxShadow: `0 0 8px ${color}60`
    };

    switch (position) {
        case 'tl':
            return <div style={{ ...styles, top: 0, left: 0, borderWidth: '4px 0 0 4px', borderTopLeftRadius: 8 }} />;
        case 'tr':
            return <div style={{ ...styles, top: 0, right: 0, borderWidth: '4px 4px 0 0', borderTopRightRadius: 8 }} />;
        case 'bl':
            return <div style={{ ...styles, bottom: 0, left: 0, borderWidth: '0 0 4px 4px', borderBottomLeftRadius: 8 }} />;
        case 'br':
            return <div style={{ ...styles, bottom: 0, right: 0, borderWidth: '0 4px 4px 0', borderBottomRightRadius: 8 }} />;
    }
}
