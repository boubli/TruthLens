'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    alpha,
    LinearProgress,
    Slide,
    Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const SCANNER_REGION_ID = 'scanner-region';

// Barcode formats for food products
const BARCODE_FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
];

// Red color for scanner frame
const SCANNER_RED = '#E53935';

// Detect iOS
const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isIOSPWA = () => {
    if (typeof window === 'undefined') return false;
    return isIOS() && (window.navigator as any).standalone === true;
};

export default function ScanPage() {
    const router = useRouter();
    const theme = useTheme();
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Permission & UI States
    const [showPermissionDialog, setShowPermissionDialog] = useState(true);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Result States
    const [showResult, setShowResult] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [scannedFormat, setScannedFormat] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);

    // Device detection
    const [isiOSDevice, setIsiOSDevice] = useState(false);
    const [isiOSPWAMode, setIsiOSPWAMode] = useState(false);

    useEffect(() => {
        setIsiOSDevice(isIOS());
        setIsiOSPWAMode(isIOSPWA());
    }, []);

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    // Play beep sound
    const playBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch { }
    }, []);

    // Vibrate
    const vibrate = useCallback(() => {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }, []);

    // Request camera permission
    const requestCameraPermission = async () => {
        setShowPermissionDialog(false);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream.getTracks().forEach(track => track.stop());

            // Permission granted - start scanner
            await startScanner();

        } catch (err: any) {
            console.error('Permission denied:', err);
            setPermissionDenied(true);
        }
    };

    // Start scanner
    const startScanner = async () => {
        setError(null);

        try {
            if (!window.isSecureContext) {
                setError('HTTPS required for camera.');
                return;
            }

            const html5QrCode = new Html5Qrcode(SCANNER_REGION_ID, {
                formatsToSupport: BARCODE_FORMATS,
                verbose: false,
            });
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: isiOSDevice ? 10 : 20,
                    qrbox: { width: 280, height: 140 },
                    aspectRatio: window.innerWidth / window.innerHeight,
                    disableFlip: true,
                },
                onScanSuccess,
                () => { }
            );

            setIsScanning(true);

        } catch (err: any) {
            console.error('Scanner error:', err);
            if (isiOSPWAMode) {
                setError('iOS PWA camera issue. Use "Scan from Photo".');
            } else {
                setError(err.message || 'Camera failed.');
            }
        }
    };

    // Stop scanner
    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch { }
        }
        setIsScanning(false);
    };

    // On scan success
    const onScanSuccess = async (decodedText: string, decodedResult: any) => {
        playBeep();
        vibrate();
        setScanSuccess(true);

        scannerRef.current?.pause();

        setScannedCode(decodedText);
        setScannedFormat(decodedResult?.result?.format?.formatName || 'Barcode');

        await processProduct(decodedText);
    };

    // Handle file scan
    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setShowPermissionDialog(false);

        try {
            const html5QrCode = new Html5Qrcode('temp-scanner', {
                formatsToSupport: BARCODE_FORMATS,
                verbose: false,
            });

            const result = await html5QrCode.scanFile(file, true);
            playBeep();
            vibrate();
            setScannedCode(result);
            setScannedFormat('Photo');
            await processProduct(result);

        } catch {
            setError('No barcode found in image.');
            setIsProcessing(false);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Process product
    const processProduct = async (barcode: string) => {
        setIsProcessing(true);

        try {
            const response = await fetch('/api/product/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode }),
            });

            if (response.ok) {
                await stopScanner();
                router.push(`/product/${barcode}?source=scan`);
            } else if (response.status === 404) {
                setShowResult(true);
                setError('Product not found.');
                setIsProcessing(false);
                setScanSuccess(false);
            } else {
                setError('Failed to fetch product.');
                setShowResult(true);
                setIsProcessing(false);
                setScanSuccess(false);
            }
        } catch {
            setError('Network error.');
            setShowResult(true);
            setIsProcessing(false);
            setScanSuccess(false);
        }
    };

    const handleScanNext = () => {
        setShowResult(false);
        setError(null);
        setScanSuccess(false);
        scannerRef.current?.resume();
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(scannedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        stopScanner();
        router.back();
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                bgcolor: '#1A1A1A',
                zIndex: 9999,
                overflow: 'hidden',
            }}
        >
            {/* Striped Background Pattern */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 2px,
                        rgba(255,255,255,0.03) 2px,
                        rgba(255,255,255,0.03) 4px
                    )`,
                    zIndex: 0,
                }}
            />

            {/* Hidden elements */}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} style={{ display: 'none' }} />
            <div id="temp-scanner" style={{ display: 'none' }} />

            {/* Permission Dialog */}
            <Dialog
                open={showPermissionDialog && !permissionDenied}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        bgcolor: 'background.paper',
                        p: 2,
                        maxWidth: 340,
                    }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                        }}
                    >
                        <CameraAltIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                        Camera Permission
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        TruthLens needs camera access to scan product barcodes and show you nutrition information.
                    </Typography>

                    {isiOSPWAMode && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                            <Typography variant="caption" color="warning.main">
                                ⚠️ iOS PWA may have camera limitations. You can also use &quot;Scan from Photo&quot;.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={requestCameraPermission}
                        startIcon={<CameraAltIcon />}
                        sx={{
                            py: 1.5,
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        }}
                    >
                        Allow Camera
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<PhotoCameraIcon />}
                        sx={{ py: 1.5, borderRadius: 3 }}
                    >
                        Scan from Photo
                    </Button>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={handleClose}
                        sx={{ color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Permission Denied State */}
            {permissionDenied && !isScanning && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        zIndex: 10,
                    }}
                >
                    <WarningAmberIcon sx={{ fontSize: 64, color: 'warning.main', mb: 3 }} />
                    <Typography variant="h5" fontWeight={700} color="white" textAlign="center" gutterBottom>
                        Camera Access Denied
                    </Typography>
                    <Typography variant="body1" color="grey.500" textAlign="center" sx={{ mb: 4, maxWidth: 300 }}>
                        Please enable camera access in your browser settings, or use the photo scan option.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<PhotoCameraIcon />}
                        sx={{
                            py: 1.5,
                            px: 4,
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        }}
                    >
                        Scan from Photo
                    </Button>
                    <Button variant="text" onClick={handleClose} sx={{ mt: 2, color: 'grey.500' }}>
                        Go Back
                    </Button>
                </Box>
            )}

            {/* Header */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    zIndex: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
                <Typography variant="h6" fontWeight={700} color="white">
                    SCAN
                </Typography>
                <Box sx={{ width: 40 }} />
            </Box>

            {/* Main Scanner Area */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Camera Feed (hidden when dialog is open) */}
                <Box
                    id={SCANNER_REGION_ID}
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: isScanning ? 1 : 0,
                        '& video': {
                            width: '100% !important',
                            height: '100% !important',
                            objectFit: 'cover !important',
                        },
                        '& > div': { display: 'none !important' },
                    }}
                />

                {/* Scanning Overlay */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                            }}
                        >
                            {/* Dark overlay with cutout */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'radial-gradient(ellipse 60% 35% at center, transparent 0%, rgba(0,0,0,0.85) 100%)',
                                }}
                            />

                            {/* Instruction Text */}
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                color="white"
                                sx={{ mb: 1, zIndex: 15, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                            >
                                Scan the barcode
                            </Typography>
                            <Typography
                                variant="body2"
                                color="grey.400"
                                textAlign="center"
                                sx={{ mb: 4, zIndex: 15, maxWidth: 280 }}
                            >
                                Line up the barcode inside the red corners and keep the phone steady!
                            </Typography>

                            {/* Scanner Frame */}
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: 300,
                                    height: 200,
                                    backgroundColor: 'white',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                    zIndex: 15,
                                }}
                            >
                                {/* Red Corner Brackets */}
                                {/* Top Left */}
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: `5px solid ${SCANNER_RED}`, borderLeft: `5px solid ${SCANNER_RED}` }} />
                                {/* Top Right */}
                                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: `5px solid ${SCANNER_RED}`, borderRight: `5px solid ${SCANNER_RED}` }} />
                                {/* Bottom Left */}
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: `5px solid ${SCANNER_RED}`, borderLeft: `5px solid ${SCANNER_RED}` }} />
                                {/* Bottom Right */}
                                <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: `5px solid ${SCANNER_RED}`, borderRight: `5px solid ${SCANNER_RED}` }} />

                                {/* Red Scanning Laser Line */}
                                {!scanSuccess && (
                                    <motion.div
                                        animate={{ top: ['10%', '90%', '10%'] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{
                                            position: 'absolute',
                                            left: 10,
                                            right: 10,
                                            height: 3,
                                            background: `linear-gradient(90deg, transparent 0%, ${SCANNER_RED} 15%, ${SCANNER_RED} 85%, transparent 100%)`,
                                            boxShadow: `0 0 10px ${SCANNER_RED}, 0 0 20px ${alpha(SCANNER_RED, 0.5)}`,
                                            zIndex: 5,
                                        }}
                                    />
                                )}

                                {/* Red glow around laser */}
                                {!scanSuccess && (
                                    <motion.div
                                        animate={{ top: ['10%', '90%', '10%'] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            height: 40,
                                            marginTop: -18,
                                            background: `linear-gradient(180deg, transparent, ${alpha(SCANNER_RED, 0.15)}, transparent)`,
                                            zIndex: 4,
                                        }}
                                    />
                                )}

                                {/* Success overlay */}
                                <AnimatePresence>
                                    {scanSuccess && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: alpha('#4CAF50', 0.9),
                                                zIndex: 10,
                                            }}
                                        >
                                            <CheckCircleIcon sx={{ fontSize: 64, color: 'white' }} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Box>

                            {/* Scanning Status */}
                            <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 15 }}>
                                {!scanSuccess && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        style={{
                                            width: 16,
                                            height: 16,
                                            border: '2px solid transparent',
                                            borderTopColor: 'white',
                                            borderRadius: '50%',
                                        }}
                                    />
                                )}
                                <Typography variant="body1" color="grey.400">
                                    {scanSuccess ? 'Barcode detected!' : 'Scanning...'}
                                </Typography>
                            </Box>

                            {/* Photo Scan Button */}
                            <Button
                                variant="text"
                                onClick={() => fileInputRef.current?.click()}
                                startIcon={<PhotoCameraIcon />}
                                sx={{ mt: 3, color: 'grey.500', zIndex: 15 }}
                            >
                                Or scan from photo
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            {/* Result Bottom Sheet */}
            <Slide direction="up" in={showResult} mountOnEnter unmountOnExit>
                <Paper
                    elevation={24}
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        p: 3,
                        zIndex: 50,
                        background: theme.palette.background.paper,
                    }}
                >
                    <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.text.secondary, 0.3), mx: 'auto', mb: 3 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: error ? alpha(theme.palette.error.main, 0.15) : alpha(theme.palette.success.main, 0.15),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {error ? <ErrorOutlineIcon color="error" /> : <CheckCircleIcon color="success" />}
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                {error ? 'Not Found' : 'Detected'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {scannedFormat}
                            </Typography>
                        </Box>
                    </Box>

                    <Paper
                        variant="outlined"
                        sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}
                    >
                        <Typography variant="caption" color="text.secondary">BARCODE</Typography>
                        <Typography variant="h5" fontFamily="monospace" fontWeight={600}>
                            {scannedCode}
                        </Typography>
                    </Paper>

                    {error && (
                        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                            onClick={handleCopy}
                            color={copied ? 'success' : 'inherit'}
                            sx={{ py: 1.5, borderRadius: 3 }}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => processProduct(scannedCode)}
                            sx={{
                                py: 1.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            }}
                        >
                            Retry
                        </Button>
                    </Box>

                    <Button
                        fullWidth
                        variant="text"
                        startIcon={<RefreshIcon />}
                        onClick={handleScanNext}
                        sx={{ color: theme.palette.secondary.main }}
                    >
                        Scan Another
                    </Button>
                </Paper>
            </Slide>

            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.9)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 60,
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <Box
                                sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    border: `4px solid ${alpha(SCANNER_RED, 0.3)}`,
                                    borderTopColor: SCANNER_RED,
                                }}
                            />
                        </motion.div>
                        <Typography variant="h6" fontWeight={600} sx={{ mt: 3, color: 'white' }}>
                            Looking up product...
                        </Typography>
                        <Typography variant="body2" color="grey.500" sx={{ mt: 1 }}>
                            Checking Open Food Facts, FooDB, USDA
                        </Typography>
                        <LinearProgress
                            sx={{
                                width: 180,
                                mt: 3,
                                borderRadius: 2,
                                '& .MuiLinearProgress-bar': { bgcolor: SCANNER_RED },
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
}
