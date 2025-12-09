'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, CircularProgress, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { checkScanLimit, getScanLimitMessage } from '@/services/scanService';
import PageTransition from '@/components/animation/PageTransition';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { getProductAction } from '@/app/actions';
import { useTranslation } from 'react-i18next';

// Dynamically import QrScanner
const QrScanner = dynamic(() => import('react-qr-scanner'), {
    ssr: false,
    loading: () => <LoadingSpinner />
});

export default function ScanPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [scanAllowed, setScanAllowed] = useState(true);
    const [remainingScans, setRemainingScans] = useState<number | null>(null);
    const router = useRouter();
    const { user, tier, isPro, isUltimate } = useAuth();

    useEffect(() => {
        const verifyLimit = async () => {
            if (user) {
                const { allowed, remaining } = await checkScanLimit(user.uid, tier);
                setScanAllowed(allowed);
                setRemainingScans(remaining);
            }
            setInitializing(false);
        };

        verifyLimit();
    }, [user, tier]);

    const handleScan = async (scanData: any) => {
        if (loading || !scanAllowed) return;

        // Parse scan data
        const code = scanData?.text || (typeof scanData === 'string' ? scanData : null);

        if (code) {
            setLoading(true);
            try {
                console.log(`[Scan] Processing code: ${code}`);

                // 1. Check if product exists directly (FooDB or OFF)
                const product = await getProductAction(code);

                if (product) {
                    // ✅ Found! Go straight to product page
                    console.log('[Scan] Product found, redirecting to detail page...');
                    router.push(`/product/${code}?source=scan`);
                } else {
                    // ❌ Not found - Fallback Logic
                    console.log('[Scan] Product not found, applying fallback...');

                    if (isUltimate) {
                        // Ultimate User -> Global Search
                        router.push(`/global-search?q=${encodeURIComponent(code)}`);
                    } else {
                        // Free/Pro User -> Standard Local Search
                        router.push(`/?search=${encodeURIComponent(code)}`);
                    }
                }
            } catch (error) {
                console.error("Scan error:", error);
                setLoading(false);
            }
        }
    };

    const handleError = (err: any) => {
        console.error(err);
    };

    if (initializing) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <PageTransition>
            <Container maxWidth="sm" sx={{ mt: 4, mb: 10, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <AnimatedButton
                        variant="text"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/')}
                        sx={{ color: 'text.secondary' }}
                    >
                        {t('scan_back_home')}
                    </AnimatedButton>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {t('scan_page_title')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('scan_page_instruction')}
                    </Typography>

                    {!isPro && remainingScans !== null && (
                        <Box sx={{ mt: 1, display: 'inline-block' }}>
                            <Alert
                                severity={remainingScans > 0 ? "info" : "error"}
                                icon={remainingScans > 0 ? <QrCodeScannerIcon /> : <StarIcon />}
                                sx={{ py: 0 }}
                            >
                                {getScanLimitMessage(tier, remainingScans)}
                            </Alert>
                        </Box>
                    )}
                </Box>

                <Paper
                    elevation={4}
                    sx={{
                        p: 1,
                        overflow: 'hidden',
                        bgcolor: '#000',
                        borderRadius: 6,
                        position: 'relative',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}
                >
                    {loading ? (
                        <LoadingSpinner message={t('scan_processing_message')} />
                    ) : !scanAllowed ? (
                        <Box sx={{
                            height: 320,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            p: 3,
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                        }}>
                            <StarIcon sx={{ fontSize: 60, color: '#FCD34D', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>{t('scan_limit_reached_title')}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>
                                {t('scan_limit_reached_desc')}
                            </Typography>
                            <AnimatedButton
                                variant="contained"
                                color="warning"
                                component={Link}
                                href="/upgrade"
                            >
                                {t('scan_upgrade_now')}
                            </AnimatedButton>
                        </Box>
                    ) : (
                        <>
                            <QrScanner
                                delay={300}
                                onError={handleError}
                                onScan={handleScan}
                                style={{ width: '100%', borderRadius: 24 }}
                                constraints={{
                                    audio: false,
                                    video: { facingMode: 'environment' }
                                }}
                            />
                            {/* Animated Scanner Overlay */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '80%',
                                    height: '50%',
                                    border: '2px solid rgba(255,255,255,0.8)',
                                    borderRadius: 3,
                                    pointerEvents: 'none',
                                    boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '2px',
                                        bgcolor: '#00F0FF',
                                        animation: 'scanLine 2s linear infinite',
                                        boxShadow: '0 0 4px #00F0FF'
                                    },
                                    '@keyframes scanLine': {
                                        '0%': { top: '0%', opacity: 0.5 },
                                        '50%': { opacity: 1 },
                                        '100%': { top: '100%', opacity: 0.5 }
                                    }
                                }}
                            />
                            {/* Corner Markers */}
                            <Box sx={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderTop: '4px solid #00F0FF', borderLeft: '4px solid #00F0FF', borderRadius: '8px 0 0 0' }} />
                            <Box sx={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderTop: '4px solid #00F0FF', borderRight: '4px solid #00F0FF', borderRadius: '0 8px 0 0' }} />
                            <Box sx={{ position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, borderBottom: '4px solid #00F0FF', borderLeft: '4px solid #00F0FF', borderRadius: '0 0 0 8px' }} />
                            <Box sx={{ position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderBottom: '4px solid #00F0FF', borderRight: '4px solid #00F0FF', borderRadius: '0 0 8px 0' }} />
                        </>
                    )}
                </Paper>

                <Box sx={{ mt: 4 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{t('scan_trouble_scanning')}</Typography>
                    <AnimatedButton
                        variant="text"
                        color="warning"
                        onClick={() => handleScan('3017620422003')}
                        disabled={loading || !scanAllowed}
                    >
                        {t('scan_simulate_button')}
                    </AnimatedButton>
                </Box>
            </Container>
        </PageTransition>
    );
}
