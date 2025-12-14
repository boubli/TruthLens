/**
 * Skeleton Card Component
 * Loading placeholder for product cards
 */

'use client';

import { Card, CardContent, Skeleton, Box } from '@mui/material';
import { motion } from 'framer-motion';

interface SkeletonCardProps {
    variant?: 'product' | 'list' | 'grid';
}

export default function SkeletonCard({ variant = 'product' }: SkeletonCardProps) {
    if (variant === 'list') {
        return (
            <Card
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                sx={{ mb: 2 }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="rectangular" width={80} height={80} sx={{ borderRadius: 2 }} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={32} />
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="text" width="80%" />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (variant === 'grid') {
        return (
            <Card
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <CardContent>
                    <Skeleton variant="rectangular" width="100%" height={140} sx={{ borderRadius: 2, mb: 2 }} />
                    <Skeleton variant="text" width="80%" height={28} />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                </CardContent>
            </Card>
        );
    }

    // Default product variant
    return (
        <Card
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="text" width="70%" height={32} />
                    <Skeleton variant="text" width="50%" />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Skeleton variant="circular" width={60} height={60} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="100%" />
                            <Skeleton variant="text" width="80%" />
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}
