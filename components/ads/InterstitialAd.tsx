'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, LinearProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface InterstitialAdProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Interstitial Ad - Full screen ad shown every 5 scans for Free users
 */
const InterstitialAd: React.FC<InterstitialAdProps> = ({ open, onClose }) => {
    const [countdown, setCountdown] = useState(5);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        if (open) {
            setCountdown(5);
            setCanSkip(false);

            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setCanSkip(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={canSkip ? onClose : undefined}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#1a1a1a',
                    minHeight: 400,
                }
            }}
        >
            <DialogContent sx={{ position: 'relative', textAlign: 'center', py: 4 }}>
                {canSkip && (
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'white',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}

                <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Advertisement
                </Typography>

                {/* Placeholder Ad Content */}
                <Box
                    sx={{
                        backgroundColor: '#2a2a2a',
                        border: '2px dashed #555',
                        borderRadius: 2,
                        p: 6,
                        mb: 3,
                        minHeight: 250,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        [Full Screen Ad]
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        300x250 or video ad space
                    </Typography>
                </Box>

                {!canSkip ? (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            You can skip this ad in {countdown} seconds
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={((5 - countdown) / 5) * 100}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={onClose}
                        size="large"
                    >
                        Continue
                    </Button>
                )}

                <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
                    Upgrade to Pro to remove all ads
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default InterstitialAd;
