/**
 * Empty State Component
 * Display when no data is available
 */

'use client';

import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    ...props
}: EmptyStateProps) {
    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: 8,
                px: 3,
            }}
        >
            {icon && (
                <Box
                    component={motion.div}
                    animate={{
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    sx={{
                        fontSize: '4rem',
                        color: 'text.secondary',
                        mb: 3,
                    }}
                >
                    {icon}
                </Box>
            )}

            <Typography variant="h5" gutterBottom fontWeight="medium">
                {title}
            </Typography>

            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                    {description}
                </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {actionLabel && onAction && (
                    <Button
                        component={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="contained"
                        onClick={onAction}
                        sx={{ minWidth: 140 }}
                    >
                        {actionLabel}
                    </Button>
                )}
                {/* @ts-ignore */}
                {props.secondaryActionLabel && props.onSecondaryAction && (
                    <Button
                        component={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="outlined"
                        onClick={props.onSecondaryAction}
                        sx={{ minWidth: 140 }}
                    >
                        {props.secondaryActionLabel}
                    </Button>
                )}
            </Box>
        </Box>
    );
}
