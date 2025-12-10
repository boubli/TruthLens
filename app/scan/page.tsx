'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { checkScanLimit } from '@/services/scanService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Dynamically import QrScanner with no SSR
const QrScanner = dynamic(() => import('react-qr-scanner'), {
    ssr: false,
    loading: () => <Box sx={{ bgcolor: 'black', height: '100vh', width: '100vw' }} />
});

export default function ScanPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user, tier } = useAuth();

    // State
    const [scanAllowed, setScanAllowed] = useState(true);
    const [loading, setLoading] = useState(false);
    const [flash, setFlash] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Check Limits on Mount
    useEffect(() => {
        const verifyLimit = async () => {
            if (user) {
                const { allowed } = await checkScanLimit(user.uid, tier);
                setScanAllowed(allowed);
            }
            setInitializing(false);
        };
        verifyLimit();
    }, [user, tier]);

    // Handle Successful Scan
    const handleScan = async (scanData: any) => {
        if (loading || !scanAllowed) return;

        const code = scanData?.text || (typeof scanData === 'string' ? scanData : null);

        if (code) {
            setLoading(true);

            // Haptic Feedback
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200);
            }

            // Immediate Redirect (Fast Logic)
            console.log(`[Scan] Code detected: ${code}. Redirecting...`);
            router.push(`/product/${code}?source=scan`);
        }
    };

    const handleError = (err: any) => {
        console.warn("[Scanner Error]", err);
    };

    if (initializing) return <LoadingSpinner fullScreen />;

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'black',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {/* Camera Feed - Full Screen */}
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                    constraints={{
                        audio: false,
                        video: {
                            facingMode: 'environment', // Rear Camera
                            // @ts-ignore - torch is standard but TS might complain
                            advanced: [{ torch: flash }]
                        }
                    }}
                />
            </Box>

            {/* Dark Gradient Overlay for Readability */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '150px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />

            {/* Back Button */}
            <IconButton
                onClick={() => router.back()}
                sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                }}
            >
                <ArrowBackIcon />
            </IconButton>

            {/* Flash/Torch Toggle */}
            <IconButton
                onClick={() => setFlash(!flash)}
                sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    color: flash ? '#FCD34D' : 'white',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                }}
            >
                {flash ? <FlashOnIcon /> : <FlashOffIcon />}
            </IconButton>

            {/* Central Scanning HUD */}
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70vw',
                height: '40vh',
                maxWidth: 400,
                maxHeight: 300,
                pointerEvents: 'none',
                zIndex: 5
            }}>
                {/* Corner Brackets */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: '3px solid #00F0FF', borderLeft: '3px solid #00F0FF', borderRadius: '12px 0 0 0' }} />
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: '3px solid #00F0FF', borderRight: '3px solid #00F0FF', borderRadius: '0 12px 0 0' }} />
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: '3px solid #00F0FF', borderLeft: '3px solid #00F0FF', borderRadius: '0 0 0 12px' }} />
                <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: '3px solid #00F0FF', borderRight: '3px solid #00F0FF', borderRadius: '0 0 12px 0' }} />

                {/* Laser Animation */}
                {!loading && (
                    <Box sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '2px',
                        bgcolor: 'rgba(0, 240, 255, 0.8)',
                        boxShadow: '0 0 10px #00F0FF',
                        animation: 'scanLaser 2s ease-in-out infinite'
                    }} />
                )}

                {/* Loading State Overlay */}
                {loading && (
                    <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <LoadingSpinner />
                        <Typography variant="caption" sx={{ color: '#00F0FF', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Processing Product...
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Bottom Instructions */}
            <Box sx={{
                position: 'absolute',
                bottom: 40,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 10
            }}>
                <Paper sx={{
                    bgcolor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Typography variant="body2" fontWeight="medium">
                        {loading ? 'Analyzing Code...' : 'Align barcode within frame'}
                    </Typography>
                </Paper>
            </Box>

            {/* CSS Animation for Laser */}
            <style jsx global>{`
                @keyframes scanLaser {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </Box>
    );
}
