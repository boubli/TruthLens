/**
 * Stats Card Component
 * Displays key metrics with icons, trends, and animations
 */

'use client';

import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<SvgIconProps>;
    trend?: number;
    color?: string;
    onClick?: () => void;
}

export default function StatsCard({ title, value, icon: Icon, trend, color = '#6C63FF', onClick }: StatsCardProps) {
    return (
        <Paper
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            elevation={2}
            sx={{
                p: 3,
                height: '100%',
                background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
                borderLeft: `4px solid ${color}`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box
                    sx={{
                        p: 1.5,
                        bgcolor: `${color}20`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon sx={{ fontSize: 32, color }} />
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        {value}
                    </Typography>
                </Box>
            </Box>

            {trend !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    {trend > 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography
                        variant="body2"
                        sx={{
                            color: trend > 0 ? 'success.main' : 'error.main',
                            fontWeight: 600,
                        }}
                    >
                        {Math.abs(trend)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        vs last month
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}
