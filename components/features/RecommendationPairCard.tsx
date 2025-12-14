'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { useRouter } from 'next/navigation';
import { Recommendation } from '@/services/recommendationService';
import { motion } from 'framer-motion';

interface RecommendationPairCardProps {
    rejected: Recommendation;
    recommended: Recommendation;
}

const ProductMiniCard = ({ item, type, onClick }: { item: Recommendation, type: 'rejected' | 'recommended', onClick: () => void }) => {
    const isRejected = type === 'rejected';
    const mainColor = isRejected ? '#d32f2f' : '#2e7d32'; // Red vs Green

    // Manage image state to handle load errors
    const [imgError, setImgError] = useState(false);
    const [imgSrc, setImgSrc] = useState(item.image);

    useEffect(() => {
        setImgSrc(item.image);
        setImgError(false);
    }, [item.image]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.id && (item.id.startsWith('rec-') || item.id.startsWith('rej-'))) {
            window.location.href = `/search?q=${encodeURIComponent(item.name)}`;
        } else {
            onClick();
        }
    };

    return (
        <motion.div
            whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', display: 'flex', flex: 1 }}
        >
            <Box
                onClick={handleClick}
                sx={{
                    flex: 1,
                    p: 3,
                    minHeight: 280,
                    borderRadius: 5,
                    background: isRejected
                        ? 'linear-gradient(180deg, rgba(211, 47, 47, 0.03) 0%, rgba(211, 47, 47, 0.08) 100%)'
                        : 'linear-gradient(180deg, rgba(46, 125, 50, 0.03) 0%, rgba(46, 125, 50, 0.08) 100%)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isRejected ? 'rgba(211, 47, 47, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                    transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    '&:hover': {
                        borderColor: isRejected ? 'rgba(211, 47, 47, 0.3)' : 'rgba(46, 125, 50, 0.3)',
                        boxShadow: `0 15px 35px ${isRejected ? 'rgba(211, 47, 47, 0.15)' : 'rgba(46, 125, 50, 0.15)'}`
                    }
                }}
            >
                {/* Status Icon Badge */}
                <Box sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isRejected
                        ? 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)'
                        : 'linear-gradient(135deg, #66bb6a 0%, #2e7d32 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    zIndex: 1
                }}>
                    {isRejected ? <CloseIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                </Box>

                {/* Product Image Area */}
                <Box sx={{
                    width: '100%',
                    height: 120,
                    mb: 2,
                    mt: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    {!imgError && imgSrc ? (
                        <Box
                            component={motion.img}
                            initial={{ scale: 0.9, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            src={imgSrc}
                            alt={item.name}
                            onError={() => setImgError(true)}
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                filter: isRejected ? 'grayscale(0.1) contrast(1.1)' : 'none',
                                dropShadow: '0 8px 16px rgba(0,0,0,0.1)'
                            }}
                        />
                    ) : (
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: isRejected ? 'rgba(211, 47, 47, 0.05)' : 'rgba(46, 125, 50, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed',
                            borderColor: isRejected ? 'rgba(211, 47, 47, 0.2)' : 'rgba(46, 125, 50, 0.2)'
                        }}>
                            <ImageNotSupportedIcon sx={{ fontSize: 24, opacity: 0.5, color: isRejected ? '#d32f2f' : '#2e7d32' }} />
                        </Box>
                    )}
                </Box>

                {/* Content Container */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', flex: 1 }}>
                    <Typography
                        variant="subtitle1"
                        align="center"
                        fontWeight="700"
                        sx={{
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                            mb: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: 40,
                            color: 'text.primary'
                        }}
                    >
                        {item.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, fontSize: '0.75rem', opacity: 0.8 }}>
                        {item.brand}
                    </Typography>

                    <Chip
                        label={isRejected ? 'Bad Choice' : 'Excellent Choice'}
                        size="small"
                        sx={{
                            mt: 'auto',
                            height: 28,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            bgcolor: isRejected ? 'rgba(211, 47, 47, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                            color: mainColor,
                            border: '1px solid',
                            borderColor: isRejected ? 'rgba(211, 47, 47, 0.15)' : 'rgba(46, 125, 50, 0.15)',
                            '& .MuiChip-label': { px: 2 }
                        }}
                    />
                </Box>
            </Box>
        </motion.div>
    );
};

export default function RecommendationPairCard({ rejected, recommended }: RecommendationPairCardProps) {
    const router = useRouter();

    return (
        <Card sx={{
            display: 'flex',
            borderRadius: 5,
            overflow: 'visible',
            boxShadow: 'none',
            bgcolor: 'transparent',
            position: 'relative',
            mb: 3
        }}>
            <Box sx={{ display: 'flex', flex: 1, position: 'relative', gap: 2 }}>
                {/* Rejected Column */}
                <ProductMiniCard
                    item={rejected}
                    type="rejected"
                    onClick={() => router.push(`/product/${rejected.id}`)}
                />

                {/* Visual Separator / Arrow - Animated */}
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    pointerEvents: 'none' // Click through to cards
                }}>
                    <motion.div
                        animate={{
                            boxShadow: ["0 4px 12px rgba(0,0,0,0.2)", "0 4px 20px rgba(255, 142, 83, 0.4)", "0 4px 12px rgba(0,0,0,0.2)"],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut"
                        }}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
                            border: '2px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}
                    >
                        <ArrowForwardIosIcon sx={{ fontSize: 16, ml: 0.5, opacity: 0.9 }} />
                    </motion.div>
                </Box>

                {/* Recommended Column */}
                <ProductMiniCard
                    item={recommended}
                    type="recommended"
                    onClick={() => router.push(`/product/${recommended.id}`)}
                />
            </Box>
        </Card>
    );
}
