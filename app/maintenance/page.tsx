'use client';

import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import BuildIcon from '@mui/icons-material/Build'; // Or a more creative icon if available
import EngineeringIcon from '@mui/icons-material/Engineering';
import Link from 'next/link';

export default function MaintenancePage() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#050505',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background Animation */}
            <Box
                component={motion.div}
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 50,
                    repeat: Infinity,
                    ease: "linear"
                }}
                sx={{
                    position: 'absolute',
                    width: '80vw',
                    height: '80vw',
                    maxWidth: 800,
                    maxHeight: 800,
                    borderRadius: '40%',
                    background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(0, 240, 255, 0.1) 100%)',
                    filter: 'blur(60px)',
                    zIndex: 0,
                }}
            />

            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Box
                    component={motion.div}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <Box
                        sx={{
                            display: 'inline-flex',
                            p: 3,
                            borderRadius: '30%',
                            bgcolor: 'rgba(255,255,255,0.05)',
                            mb: 4,
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 0 40px rgba(108, 99, 255, 0.3)'
                        }}
                    >
                        <EngineeringIcon sx={{ fontSize: 60, color: '#6C63FF' }} />
                    </Box>
                </Box>

                <Typography
                    component={motion.h1}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    variant="h2"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                        background: 'linear-gradient(45deg, #fff, #aaa)',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}
                >
                    Under Maintenance
                </Typography>

                <Typography
                    component={motion.p}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 6, lineHeight: 1.6 }}
                >
                    We are currently upgrading our systems to bring you a better experience.
                    <br />
                    TruthLens will be back shortly.
                </Typography>

                <Box
                    component={motion.div}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link href="/login" passHref style={{ textDecoration: 'none' }}>
                        <Button
                            variant="outlined"
                            sx={{
                                color: 'rgba(255,255,255,0.5)',
                                borderColor: 'rgba(255,255,255,0.2)',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: 'white',
                                    color: 'white',
                                    bgcolor: 'transparent'
                                }
                            }}
                        >
                            Admin Login
                        </Button>
                    </Link>
                </Box>
            </Container>
        </Box>
    );
}
