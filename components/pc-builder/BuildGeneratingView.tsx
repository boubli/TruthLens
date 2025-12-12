/**
 * Build Generating View
 * Animated loading component showing PC assembly progress
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Icons for PC Parts
import MemoryIcon from '@mui/icons-material/Memory';           // CPU
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'; // GPU
import StorageIcon from '@mui/icons-material/Storage';         // Storage
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard'; // Motherboard
import PowerIcon from '@mui/icons-material/Power';             // PSU
import ComputerIcon from '@mui/icons-material/Computer';       // Case

export type BuildStage = 'drafting' | 'pricing' | 'optimizing' | 'complete';

interface BuildGeneratingViewProps {
    stage: BuildStage;
}

const statusMessages: Record<BuildStage, string> = {
    drafting: 'Consulting AI for compatibility...',
    pricing: 'Searching local prices via SearXNG...',
    optimizing: 'Optimizing build metrics...',
    complete: 'Build ready!'
};

const partIcons = [
    { Icon: MemoryIcon, label: 'CPU', color: '#6C63FF' },
    { Icon: SportsEsportsIcon, label: 'GPU', color: '#00F0FF' },
    { Icon: StorageIcon, label: 'Storage', color: '#10B981' },
    { Icon: DeveloperBoardIcon, label: 'Motherboard', color: '#F59E0B' },
    { Icon: PowerIcon, label: 'PSU', color: '#EF4444' },
];

export default function BuildGeneratingView({ stage }: BuildGeneratingViewProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    // Animate through parts
    useEffect(() => {
        if (stage === 'complete') return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % partIcons.length);
        }, 800);

        return () => clearInterval(interval);
    }, [stage]);

    const progress =
        stage === 'drafting' ? 25 :
            stage === 'pricing' ? 60 :
                stage === 'optimizing' ? 85 :
                    100;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                px: 3,
                textAlign: 'center'
            }}
        >
            {/* Animated PC Assembly */}
            <Box
                sx={{
                    position: 'relative',
                    width: 220,
                    height: 220,
                    mb: 4
                }}
            >
                {/* Center Case Icon */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 3,
                            bgcolor: 'rgba(108, 99, 255, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(108, 99, 255, 0.4)',
                            boxShadow: '0 0 30px rgba(108, 99, 255, 0.3)'
                        }}
                    >
                        <ComputerIcon sx={{ fontSize: 44, color: '#6C63FF' }} />
                    </Box>
                </motion.div>

                {/* Orbiting Parts */}
                {partIcons.map((part, index) => {
                    const angle = (index * 72 - 90) * (Math.PI / 180); // Start from top
                    const radius = 85;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const isActive = index === activeIndex;

                    return (
                        <motion.div
                            key={part.label}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: isActive ? 1.2 : 1,
                                opacity: 1,
                                x: 110 + x - 24,
                                y: 110 + y - 24,
                            }}
                            transition={{
                                delay: index * 0.1,
                                duration: 0.3,
                                type: 'spring',
                                stiffness: 200
                            }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            }}
                        >
                            <motion.div
                                animate={{
                                    y: isActive ? [0, -8, 0] : 0,
                                    boxShadow: isActive
                                        ? `0 0 20px ${part.color}60`
                                        : '0 0 0 transparent'
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: isActive ? Infinity : 0
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: `${part.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `2px solid ${isActive ? part.color : part.color + '40'}`,
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <part.Icon sx={{ fontSize: 24, color: part.color }} />
                                </Box>
                            </motion.div>
                        </motion.div>
                    );
                })}

                {/* Connection Lines */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                    }}
                >
                    {partIcons.map((_, index) => {
                        const angle = (index * 72 - 90) * (Math.PI / 180);
                        const radius = 85;
                        const x = Math.cos(angle) * radius + 110;
                        const y = Math.sin(angle) * radius + 110;
                        const isActive = index === activeIndex;

                        return (
                            <motion.line
                                key={index}
                                x1="110"
                                y1="110"
                                x2={x}
                                y2={y}
                                stroke={isActive ? '#6C63FF' : 'rgba(108, 99, 255, 0.2)'}
                                strokeWidth={isActive ? 2 : 1}
                                strokeDasharray={isActive ? '0' : '4 4'}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                            />
                        );
                    })}
                </svg>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ width: '100%', maxWidth: 300, mb: 3 }}>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'rgba(108, 99, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            background: 'linear-gradient(90deg, #6C63FF 0%, #00F0FF 100%)'
                        }
                    }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {progress}%
                </Typography>
            </Box>

            {/* Status Message */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={stage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 600,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        {statusMessages[stage]}
                    </Typography>
                </motion.div>
            </AnimatePresence>

            {/* Stage Indicator */}
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                {['drafting', 'pricing', 'optimizing'].map((s, i) => (
                    <Box
                        key={s}
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: stage === s || (stage === 'complete' && i === 2)
                                ? '#6C63FF'
                                : progress > (i + 1) * 30
                                    ? '#00F0FF'
                                    : 'rgba(108, 99, 255, 0.2)',
                            transition: 'all 0.3s'
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
}
