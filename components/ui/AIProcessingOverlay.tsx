import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MemoryIcon from '@mui/icons-material/Memory';

interface AIProcessingOverlayProps {
    open: boolean;
    onComplete?: () => void;
}

const steps = [
    { text: "Securely receiving image...", icon: <SecurityIcon />, duration: 1500 },
    { text: "AI Vision analyzing ID details...", icon: <VisibilityIcon />, duration: 3000 },
    { text: "Verifying name and expiry...", icon: <VerifiedUserIcon />, duration: 2500 },
    { text: "Finalizing verification...", icon: <MemoryIcon />, duration: 1500 }
];

export default function AIProcessingOverlay({ open }: AIProcessingOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [showLongWait, setShowLongWait] = useState(false);

    useEffect(() => {
        if (open) {
            setShowLongWait(false);
            const interval = setInterval(() => {
                setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
            }, 2500); // Change step every 2.5s

            // Show "taking longer" message after 12 seconds
            const longWaitTimer = setTimeout(() => {
                setShowLongWait(true);
            }, 12000);

            return () => {
                clearInterval(interval);
                clearTimeout(longWaitTimer);
            };
        } else {
            setCurrentStep(0);
            setShowLongWait(false);
        }
    }, [open]);

    if (!open) return null;

    return (
        <Box
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            component={motion.div}
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0,0,0,0.85)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                backdropFilter: 'blur(8px)'
            }}
        >
            {/* Scanning Animation */}
            <Box sx={{ position: 'relative', width: 120, height: 120, mb: 4 }}>
                <Box
                    component={motion.div}
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                        borderColor: ['#10b981', '#3b82f6', '#10b981']
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '4px solid transparent',
                        borderTopColor: '#10b981',
                        borderRightColor: '#3b82f6',
                        position: 'absolute'
                    }}
                />
                <Box
                    component={motion.div}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    sx={{
                        width: '80%',
                        height: '80%',
                        top: '10%',
                        left: '10%',
                        borderRadius: '50%',
                        border: '4px solid transparent',
                        borderBottomColor: '#8b5cf6',
                        borderLeftColor: '#f43f5e',
                        position: 'absolute'
                    }}
                />
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Box sx={{ color: '#fff', '& .MuiSvgIcon-root': { fontSize: 40 } }}>
                                {steps[currentStep].icon}
                            </Box>
                        </motion.div>
                    </AnimatePresence>
                </Box>
            </Box>

            {/* Status Text */}
            <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 1, textAlign: 'center' }}>
                AI Verification in Progress
            </Typography>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <Typography variant="body1" sx={{ color: '#9ca3af', mb: 2, height: 24, textAlign: 'center' }}>
                        {steps[currentStep].text}
                    </Typography>
                </motion.div>
            </AnimatePresence>

            {showLongWait && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', mb: 3, maxWidth: 300, textAlign: 'center', bgcolor: 'rgba(251, 191, 36, 0.1)', p: 1, borderRadius: 1 }}>
                        ⚠️ Taking longer than usual (high server load). Please wait, do not refresh...
                    </Typography>
                </motion.div>
            )}

            {/* Privacy Reassurance Card */}
            <Paper
                component={motion.div}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                sx={{
                    p: 2,
                    maxWidth: 400,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <SecurityIcon sx={{ color: '#10b981', fontSize: 32 }} />
                <Box>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Privacy-First Verification
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', lineHeight: 1.4 }}>
                        We rely on in-memory processing. Your ID image is analyzed in real-time and
                        <Box component="span" sx={{ color: '#10b981', fontWeight: 'bold' }}> never stored </Box>
                        on our servers.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
