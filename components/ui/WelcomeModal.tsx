'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Modal, Fade, Container } from '@mui/material';
import { motion } from 'framer-motion';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';

interface WelcomeModalProps {
    open: boolean;
    onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
    const router = useRouter();

    const handleGetStarted = () => {
        onClose();
        router.push('/signup');
    };

    const handleExplore = () => {
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Fade in={open}>
                <Box
                    component={motion.div}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    sx={{
                        position: 'relative',
                        width: { xs: '90%', sm: 500 },
                        bgcolor: '#121212', // Solid dark background
                        color: '#fff',
                        borderRadius: 4,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        p: 4,
                        outline: 'none',
                        // Gradient Overlay using background-image to not override color if possible, or just a solid gradient
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        // Additional readability
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {/* Decorative Elements */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 150,
                            height: 150,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)',
                            filter: 'blur(40px)',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Icon */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Box
                            component={motion.div}
                            animate={{ rotate: [0, 15, -15, 15, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: 'rgba(108, 99, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <WavingHandIcon sx={{ fontSize: 48, color: '#6C63FF' }} />
                        </Box>
                    </Box>

                    {/* Content */}
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        textAlign="center"
                        sx={{
                            mb: 2,
                            background: 'linear-gradient(45deg, #6C63FF, #00F0FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {'Welcome to TruthLens'}
                    </Typography>

                    <Typography
                        variant="body1"
                        textAlign="center"
                        color="text.secondary"
                        sx={{ mb: 4, lineHeight: 1.6 }}
                    >
                        {'Your personal AI-powered food analyst. Make healthier choices with instant product insights.'}
                    </Typography>

                    {/* Key Features */}
                    <Box sx={{ mb: 4 }}>
                        {[
                            '📸 Instant Product Analysis',
                            '🥗 Personalized Dietary Scoring',
                            '🤖 AI-Powered Health Insights',
                        ].map((feature, i) => (
                            <Box
                                key={i}
                                component={motion.div}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 + 0.3 }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <Typography variant="body2">{feature}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={handleGetStarted}
                            sx={{
                                py: 1.5,
                                background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                                boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 40px rgba(108, 99, 255, 0.5)',
                                },
                                transition: 'all 0.3s',
                            }}
                        >
                            {'Get Started'}
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            onClick={handleExplore}
                            sx={{
                                py: 1.5,
                                borderColor: 'rgba(108, 99, 255, 0.5)',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: '#6C63FF',
                                    bgcolor: 'rgba(108, 99, 255, 0.05)',
                                },
                            }}
                        >
                            {'Explore First'}
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
}
