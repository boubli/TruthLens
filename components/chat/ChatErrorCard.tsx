'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import KeyIcon from '@mui/icons-material/Key';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimerIcon from '@mui/icons-material/Timer';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AIChatError, AIChatErrorCode, AIProvider, AI_PROVIDERS } from '@/types/aiChat';

interface ChatErrorCardProps {
    error: AIChatError;
    onOpenSettings?: () => void;
    onRetry?: () => void;
    onDismiss?: () => void;
}

interface ErrorConfig {
    icon: React.ReactNode;
    title: string;
    description: string;
    bgColor: string;
    borderColor: string;
    iconBgColor: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
        icon: React.ReactNode;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export default function ChatErrorCard({ error, onOpenSettings, onRetry, onDismiss }: ChatErrorCardProps) {
    const getErrorConfig = (): ErrorConfig => {
        const providerName = error.provider ? AI_PROVIDERS[error.provider].name : 'API';

        switch (error.code) {
            case 'MISSING_KEY':
                return {
                    icon: <KeyIcon sx={{ fontSize: 28, color: '#F59E0B' }} />,
                    title: 'API Key Required',
                    description: `You need to add your ${providerName} API key to use AI Chat. It's free to get one!`,
                    bgColor: 'rgba(245, 158, 11, 0.08)',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    iconBgColor: 'rgba(245, 158, 11, 0.15)',
                    primaryAction: onOpenSettings ? {
                        label: 'Add API Key',
                        onClick: onOpenSettings,
                        icon: <SettingsIcon sx={{ fontSize: 18 }} />
                    } : undefined
                };

            case 'INVALID_KEY':
                return {
                    icon: <WarningAmberIcon sx={{ fontSize: 28, color: '#EF4444' }} />,
                    title: 'Invalid API Key',
                    description: `Your ${providerName} API key is invalid or expired. Please check and update it.`,
                    bgColor: 'rgba(239, 68, 68, 0.08)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    iconBgColor: 'rgba(239, 68, 68, 0.15)',
                    primaryAction: onOpenSettings ? {
                        label: 'Update Key',
                        onClick: onOpenSettings,
                        icon: <KeyIcon sx={{ fontSize: 18 }} />
                    } : undefined
                };

            case 'RATE_LIMIT':
                return {
                    icon: <TimerIcon sx={{ fontSize: 28, color: '#8B5CF6' }} />,
                    title: 'Too Many Requests',
                    description: 'You\'ve sent too many messages. Please wait a moment before trying again.',
                    bgColor: 'rgba(139, 92, 246, 0.08)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    iconBgColor: 'rgba(139, 92, 246, 0.15)',
                    primaryAction: onRetry ? {
                        label: 'Try Again',
                        onClick: onRetry,
                        icon: <RefreshIcon sx={{ fontSize: 18 }} />
                    } : undefined
                };

            case 'API_ERROR':
            default:
                return {
                    icon: <ErrorOutlineIcon sx={{ fontSize: 28, color: '#6366F1' }} />,
                    title: 'Something Went Wrong',
                    description: 'There was an issue connecting to the AI. Please try again.',
                    bgColor: 'rgba(99, 102, 241, 0.08)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    iconBgColor: 'rgba(99, 102, 241, 0.15)',
                    primaryAction: onRetry ? {
                        label: 'Try Again',
                        onClick: onRetry,
                        icon: <RefreshIcon sx={{ fontSize: 18 }} />
                    } : undefined
                };
        }
    };

    const config = getErrorConfig();

    return (
        <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            elevation={0}
            sx={{
                p: 3,
                mb: 2,
                borderRadius: 4,
                bgcolor: config.bgColor,
                border: '1px solid',
                borderColor: config.borderColor,
                overflow: 'hidden'
            }}
        >
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                {/* Icon Container */}
                <Box
                    component={motion.div}
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        bgcolor: config.iconBgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    {config.icon}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 0.5, color: 'text.primary' }}
                    >
                        {config.title}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, lineHeight: 1.5 }}
                    >
                        {config.description}
                    </Typography>

                    {/* How to Fix - Step by step */}
                    {error.code === 'MISSING_KEY' && (
                        <Box sx={{ mb: 2, pl: 2, borderLeft: '2px solid', borderColor: 'warning.main' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                How to get your free API key:
                            </Typography>
                            <Box component="ol" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Click "Add API Key" below
                                </Typography>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Choose Groq or Gemini provider
                                </Typography>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Get your free key from their website
                                </Typography>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Paste it and save!
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {error.code === 'INVALID_KEY' && (
                        <Box sx={{ mb: 2, pl: 2, borderLeft: '2px solid', borderColor: 'error.main' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                Common reasons for invalid keys:
                            </Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Key has expired or been revoked
                                </Typography>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Typo when copying the key
                                </Typography>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Using wrong provider's key
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {config.primaryAction && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={config.primaryAction.icon}
                                onClick={config.primaryAction.onClick}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2.5,
                                    py: 1,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                {config.primaryAction.label}
                            </Button>
                        )}
                        {onDismiss && (
                            <Button
                                variant="text"
                                size="small"
                                onClick={onDismiss}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    color: 'text.secondary'
                                }}
                            >
                                Dismiss
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
}
