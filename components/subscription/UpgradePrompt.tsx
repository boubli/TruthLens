'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Chip, Divider } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
    feature: string;
    variant?: 'compact' | 'full';
}

/**
 * Upgrade Prompt - Encourage Free users to upgrade to Pro
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, variant = 'compact' }) => {
    const router = useRouter();

    if (variant === 'compact') {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon sx={{ color: 'warning.main' }} />
                        <Typography variant="body2">
                            Unlock <strong>{feature}</strong> by upgrading
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => router.push('/upgrade')}
                        startIcon={<StarIcon />}
                    >
                        Upgrade
                    </Button>
                </Box>
            </Paper>
        );
    }

    // Full variant with feature comparison
    return (
        <Paper
            elevation={3}
            sx={{
                p: 4,
                background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
                border: '2px solid rgba(255, 215, 0, 0.4)',
                borderRadius: 3,
                textAlign: 'center',
            }}
        >
            <Chip
                icon={<StarIcon />}
                label="PREMIUM FEATURE"
                color="warning"
                sx={{ mb: 2, fontWeight: 'bold' }}
            />

            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Unlock {feature}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
                Upgrade to Plus, Pro, or Ultimate to access this feature.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Premium Features Include:
                </Typography>
                {[
                    'Advanced AI Analysis & Smart Grading',
                    'Higher Daily Scan Limits',
                    'Multi-Scan Capability',
                    'Extended History & CSV/PDF Exports',
                    'Priority Processing (Fast Lane)',
                    'Ad-Free Experience',
                ].map((feature, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="body2">{feature}</Typography>
                    </Box>
                ))}
            </Box>

            <Button
                variant="contained"
                color="warning"
                size="large"
                fullWidth
                onClick={() => router.push('/upgrade')}
                startIcon={<StarIcon />}
                sx={{ py: 1.5 }}
            >
                View Plans & Pricing
            </Button>

            <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
                Join thousands of health-conscious users
            </Typography>
        </Paper>
    );
};

export default UpgradePrompt;
