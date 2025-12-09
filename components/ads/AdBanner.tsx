'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdBannerProps {
    position?: 'top' | 'bottom';
}

/**
 * Ad Banner component - Shows ads for Free users only
 * Placeholder implementation - replace with actual ad network integration
 */
const AdBanner: React.FC<AdBannerProps> = ({ position = 'bottom' }) => {
    return (
        <Paper
            elevation={2}
            sx={{
                position: 'fixed',
                [position]: 0,
                left: 0,
                right: 0,
                zIndex: 1200,
                backgroundColor: '#f5f5f5',
                borderTop: position === 'bottom' ? '1px solid #ddd' : 'none',
                borderBottom: position === 'top' ? '1px solid #ddd' : 'none',
                py: 1,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 60,
            }}
        >
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Advertisement
                </Typography>
                <Box
                    sx={{
                        mt: 0.5,
                        p: 1.5,
                        backgroundColor: '#fff',
                        border: '1px dashed #ccc',
                        borderRadius: 1,
                        minWidth: 300,
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        [Ad Space - 728x90]
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                        Upgrade to Pro to remove ads
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default AdBanner;
