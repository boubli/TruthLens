/**
 * Grade Display Component
 * Shows product grade with color-coded badge and description
 */

'use client';

import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';

interface GradeDisplayProps {
    grade: string;
    size?: 'small' | 'medium' | 'large';
    showDescription?: boolean;
}

const gradeInfo: Record<string, { color: string; label: string; description: string }> = {
    A: {
        color: '#10B981',
        label: 'Excellent',
        description: 'Highly recommended, minimal health concerns',
    },
    B: {
        color: '#84CC16',
        label: 'Good',
        description: 'Generally healthy with minor considerations',
    },
    C: {
        color: '#FCD34D',
        label: 'Fair',
        description: 'Moderate concerns, consume in moderation',
    },
    D: {
        color: '#FB923C',
        label: 'Poor',
        description: 'Notable health concerns, avoid if possible',
    },
    F: {
        color: '#EF4444',
        label: 'Very Poor',
        description: 'Significant health risks, strongly not recommended',
    },
};

const sizes = {
    small: { fontSize: 48, chipSize: 'small' as const },
    medium: { fontSize: 72, chipSize: 'medium' as const },
    large: { fontSize: 96, chipSize: 'medium' as const },
};

export default function GradeDisplay({ grade, size = 'medium', showDescription = true }: GradeDisplayProps) {
    const info = gradeInfo[grade] || { color: '#9CA3AF', label: 'N/A', description: 'Grade not available' };
    const sizeConfig = sizes[size];

    return (
        <Box sx={{ textAlign: 'center' }}>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: sizeConfig.fontSize * 1.2,
                        height: sizeConfig.fontSize * 1.2,
                        borderRadius: '50%',
                        bgcolor: info.color,
                        color: 'white',
                        fontSize: sizeConfig.fontSize,
                        fontWeight: 'bold',
                        mb: 2,
                        boxShadow: `0 8px 32px ${info.color}50`,
                    }}
                >
                    {grade}
                </Box>
            </motion.div>

            <Chip
                label={info.label}
                size={sizeConfig.chipSize}
                sx={{
                    bgcolor: `${info.color}20`,
                    color: info.color,
                    fontWeight: 'bold',
                    borderColor: info.color,
                    border: '1px solid',
                }}
            />

            {showDescription && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 300, mx: 'auto' }}>
                    {info.description}
                </Typography>
            )}
        </Box>
    );
}
