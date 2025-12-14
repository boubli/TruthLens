/**
 * Loading Spinner Component
 * Beautiful animated loader with theme-aware colors
 */

'use client';

import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

interface LoadingSpinnerProps {
    size?: number;
    message?: string;
    fullScreen?: boolean;
}

export default function LoadingSpinner({
    size = 40,
    message,
    fullScreen = false,
}: LoadingSpinnerProps) {
    const dotVariants = {
        start: { y: 0 },
        end: { y: -10 }
    };

    const dotTransition = {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
    } as any;

    const content = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
            }}
        >
            {/* Animated Icon with Pulse */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Pulsing Gradient Background */}
                    <motion.div
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{
                            position: 'absolute',
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.4) 0%, rgba(0, 240, 255, 0.4) 100%)',
                            filter: 'blur(20px)',
                        }}
                    />

                    {/* Icon */}
                    <QrCodeScannerIcon
                        sx={{
                            fontSize: { xs: 50, sm: 60 },
                            color: '#6C63FF',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    />
                </Box>
            </motion.div>

            {/* Bouncing Dots */}
            <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, alignItems: 'center' }}>
                <motion.div
                    variants={dotVariants}
                    animate="end"
                    transition={{ ...dotTransition, delay: 0 }}
                >
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: '#6C63FF',
                        }}
                    />
                </motion.div>
                <motion.div
                    variants={dotVariants}
                    animate="end"
                    transition={{ ...dotTransition, delay: 0.2 }}
                >
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: '#00F0FF',
                        }}
                    />
                </motion.div>
                <motion.div
                    variants={dotVariants}
                    animate="end"
                    transition={{ ...dotTransition, delay: 0.4 }}
                >
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: '#6C63FF',
                        }}
                    />
                </motion.div>
            </Box>

            {/* Message with Fade Animation */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 600,
                            textAlign: 'center',
                        }}
                    >
                        {message}
                    </Typography>
                </motion.div>
            )}
        </Box>
    );

    if (fullScreen) {
        return (
            <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    zIndex: 9999,
                    px: 2, // Horizontal padding for mobile
                    m: 0, // Ensure no margin
                }}
            >
                {content}
            </Box>
        );
    }

    return content;
}
