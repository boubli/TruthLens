'use client';

import React from 'react';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';

interface TechScoreDisplayProps {
    score: number;
    loading?: boolean;
}

export default function TechScoreDisplay({ score, loading = false }: TechScoreDisplayProps) {
    // Color Logic based on score
    const getColor = (s: number) => {
        if (s >= 90) return '#10B981'; // Emerald (Excellent)
        if (s >= 80) return '#34D399'; // Green (Very Good)
        if (s >= 70) return '#60A5FA'; // Blue (Good)
        if (s >= 50) return '#FBBF24'; // Amber (Average)
        return '#EF4444'; // Red (Poor)
    };

    const color = getColor(score);

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
                {/* Background Track */}
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={80}
                    thickness={4}
                    sx={{ color: (theme) => theme.palette.grey[200] }}
                />

                {/* Animated Progress */}
                <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <CircularProgress
                            variant={loading ? "indeterminate" : "determinate"}
                            value={loading ? undefined : score}
                            size={80}
                            thickness={4}
                            sx={{
                                color: color,
                                strokeLinecap: 'round',
                                filter: `drop-shadow(0 0 6px ${color})`
                            }}
                        />
                    </motion.div>
                </Box>

                {/* Center Text */}
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        variant="h5"
                        component="div"
                        fontWeight="900"
                        color="text.primary"
                    >
                        {loading ? '...' : score}
                    </Typography>
                </Box>
            </Box>

            <Typography variant="caption" sx={{ mt: 1, fontWeight: 'bold', color: color, textTransform: 'uppercase', letterSpacing: 1 }}>
                Antigravity Score
            </Typography>
        </Box>
    );
}
