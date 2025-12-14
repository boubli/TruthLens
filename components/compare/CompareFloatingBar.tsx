'use client';

import React from 'react';
import { Box, Button, Typography, Avatar, IconButton, Paper, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useCompare } from '@/context/CompareContext';
import { useRouter } from 'next/navigation';

export default function CompareFloatingBar() {
    const { selectedProducts, removeFromCompare, clearComparison } = useCompare();
    const router = useRouter();

    if (selectedProducts.length === 0) return null;

    return (
        <Slide direction="up" in={selectedProducts.length > 0} mountOnEnter unmountOnExit>
            <Paper
                elevation={4}
                sx={{
                    position: 'fixed',
                    bottom: { xs: 80, sm: 24 }, // Higher on mobile to avoid nav bars if any
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: { xs: '96%', sm: '90%' },
                    maxWidth: 600,
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 1300,
                    bgcolor: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, overflowX: 'auto', mr: 1 }}>
                    {selectedProducts.map((product) => (
                        <Box key={product.id} sx={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                                src={product.image}
                                alt={product.name}
                                sx={{
                                    width: { xs: 40, sm: 48 },
                                    height: { xs: 40, sm: 48 },
                                    border: '2px solid #5a5a5a'
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => removeFromCompare(product.id)}
                                sx={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    bgcolor: 'background.paper',
                                    p: 0.25,
                                    '&:hover': { bgcolor: 'background.paper' },
                                    boxShadow: 1
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 10 }} />
                            </IconButton>
                        </Box>
                    ))}
                    <Typography variant="body2" color="white" sx={{ ml: 1, display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}>
                        {selectedProducts.length} / 3
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Button
                        color="inherit"
                        onClick={clearComparison}
                        size="small"
                        sx={{ color: 'text.secondary', minWidth: 'auto', px: 1 }}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="contained"
                        endIcon={<ArrowForwardIcon fontSize="small" />}
                        onClick={() => router.push('/compare')}
                        disabled={selectedProducts.length < 2}
                        size="small"
                        sx={{
                            bgcolor: '#6C63FF',
                            '&:hover': { bgcolor: '#5a52d5' },
                            borderRadius: 4,
                            px: { xs: 2, sm: 3 },
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                    >
                        Compare
                    </Button>
                </Box>
            </Paper>
        </Slide>
    );
}
