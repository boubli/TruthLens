/**
 * Theme Selector Component
 * Creative visual theme picker with animated gradients and interaction
 */

'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    IconButton,
    Tooltip,
    Skeleton,
    alpha,
    Collapse,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaletteIcon from '@mui/icons-material/Palette';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/hooks/useTheme';
import { themeList } from '@/lib/theme/themes';
import ThemeCustomizer from './ThemeCustomizer';
import { ThemeConfig } from '@/types/theme';

interface ThemeSelectorProps {
    showCustomizer?: boolean;
}

export default function ThemeSelector({ showCustomizer = true }: ThemeSelectorProps) {
    const { themeId, setTheme, isLoading, globalThemes, systemMode } = useTheme();
    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Combine built-in themes with system option
    const allThemes: (ThemeConfig | { id: 'system'; name: string; mode: 'light' | 'dark'; colors: any })[] = [
        {
            id: 'system',
            name: 'System Default',
            mode: systemMode,
            colors: themeList.find(t => t.mode === systemMode)?.colors || themeList[0].colors
        },
        ...themeList,
    ];

    if (isLoading) {
        return (
            <Paper sx={{ p: 4, borderRadius: 4 }}>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
                <Skeleton variant="text" width={300} height={20} sx={{ mb: 4 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 4 }} key={i}>
                            <Skeleton variant="rounded" height={160} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        );
    }

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Decorative background blur */}
                <Box sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: theme => `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                    zIndex: 0
                }} />

                <Box
                    onClick={() => setIsOpen(!isOpen)}
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: isOpen ? 1 : 0,
                        position: 'relative',
                        zIndex: 1,
                        cursor: 'pointer'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AutoAwesomeIcon color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="h5" fontWeight="800">
                            Appearance
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {showCustomizer && isOpen && (
                            <Tooltip title="Create Custom Theme">
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomizerOpen(true);
                                    }}
                                    size="small"
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        mr: 1,
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        }
                                    }}
                                >
                                    <PaletteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <IconButton size="small">
                            {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    </Box>
                </Box>

                <Collapse in={isOpen}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
                        Choose a theme that matches your vibe.
                    </Typography>

                    <Grid container spacing={2.5} sx={{ position: 'relative', zIndex: 1, pb: 2 }}>
                        {allThemes.map((theme) => {
                            const isSelected = themeId === theme.id;
                            const primaryColor = theme.colors.primary.main;
                            const secondaryColor = theme.colors.secondary.main;
                            const bgColor = theme.colors.background.default;
                            const textColor = theme.colors.text.primary;
                            const isDark = theme.mode === 'dark';

                            return (
                                <Grid size={{ xs: 6, md: 4, lg: 3 }} key={theme.id}>
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Box
                                            onClick={() => setTheme(theme.id as any)}
                                            sx={{
                                                height: 140,
                                                borderRadius: 4,
                                                position: 'relative',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                bgcolor: bgColor, // Use real background color of the theme
                                                border: isSelected ? `2px solid ${primaryColor}` : '1px solid',
                                                borderColor: isSelected ? primaryColor : 'divider',
                                                boxShadow: isSelected ? `0 8px 24px ${alpha(primaryColor, 0.25)}` : 'none',
                                                transition: 'border-color 0.3s, box-shadow 0.3s',
                                            }}
                                        >
                                            {/* Animated Color Blobs */}
                                            <Box
                                                component={motion.div}
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    rotate: [0, 5, -5, 0],
                                                    x: [0, 10, -10, 0]
                                                }}
                                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: -20,
                                                    right: -20,
                                                    width: 100,
                                                    height: 100,
                                                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                                                    bgcolor: primaryColor,
                                                    opacity: 0.8,
                                                    filter: 'blur(10px)',
                                                }}
                                            />
                                            <Box
                                                component={motion.div}
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    rotate: [0, -10, 10, 0],
                                                    x: [0, -5, 5, 0]
                                                }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: -30,
                                                    left: -10,
                                                    width: 120,
                                                    height: 120,
                                                    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                                                    bgcolor: secondaryColor,
                                                    opacity: 0.6,
                                                    filter: 'blur(15px)',
                                                }}
                                            />

                                            {/* Glassmorphism Overlay */}
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: `linear-gradient(135deg, ${alpha('#fff', 0.1)} 0%, ${alpha('#fff', 0.0)} 100%)`,
                                                backdropFilter: 'blur(0px)', // subtle 
                                                zIndex: 1
                                            }} />

                                            {/* Content */}
                                            <Box sx={{
                                                position: 'relative',
                                                zIndex: 2,
                                                height: '100%',
                                                p: 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}>
                                                {/* Selected Checkmark */}
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                                        >
                                                            <CheckCircleIcon sx={{ color: isDark ? '#fff' : primaryColor, fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                                        </motion.div>
                                                    )}
                                                </Box>

                                                {/* Theme Name */}
                                                <Box>
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight="700"
                                                        sx={{
                                                            color: textColor, // Use theme text color
                                                            textShadow: isDark || isSelected ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
                                                        }}
                                                    >
                                                        {theme.name}
                                                    </Typography>
                                                    {theme.id === 'system' && (
                                                        <Typography variant="caption" sx={{ color: textColor, opacity: 0.7 }}>
                                                            Auto-detect
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            );
                        })}

                        {/* Global Admin Themes */}
                        {globalThemes.map((theme) => (
                            <Grid size={{ xs: 6, md: 4, lg: 3 }} key={theme.id}>
                                <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Box
                                        onClick={() => setTheme(theme.id)}
                                        sx={{
                                            height: 140,
                                            borderRadius: 4,
                                            position: 'relative',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            bgcolor: theme.colors.background.default,
                                            border: themeId === theme.id ? `2px solid ${theme.colors.primary.main}` : '1px solid',
                                            borderColor: themeId === theme.id ? theme.colors.primary.main : 'divider',
                                            boxShadow: themeId === theme.id ? 4 : 0,
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {/* Simple gradient blob for custom themes */}
                                        <Box sx={{
                                            position: 'absolute',
                                            top: -30, right: -30,
                                            width: 140, height: 140,
                                            borderRadius: '50%',
                                            background: `radial-gradient(circle, ${theme.colors.primary.main} 0%, transparent 70%)`,
                                            opacity: 0.4
                                        }} />

                                        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        bgcolor: alpha(theme.colors.primary.main, 0.1),
                                                        color: theme.colors.primary.main,
                                                        px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold'
                                                    }}
                                                >
                                                    CUSTOM
                                                </Typography>
                                                {themeId === theme.id && <CheckCircleIcon color="primary" />}
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="700" sx={{ color: theme.colors.text.primary }}>
                                                {theme.name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Grid>
                        ))}

                        {/* Custom Theme Creator Card */}
                        {showCustomizer && (
                            <Grid size={{ xs: 6, md: 4, lg: 3 }}>
                                <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Box
                                        onClick={() => setCustomizerOpen(true)}
                                        sx={{
                                            height: 140,
                                            borderRadius: 4,
                                            border: '2px dashed',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            bgcolor: 'action.hover',
                                            color: 'text.secondary',
                                            gap: 1,
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                color: 'primary.main',
                                                bgcolor: alpha('#6366F1', 0.05)
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '50%',
                                                bgcolor: 'background.paper',
                                                boxShadow: 1,
                                                display: 'flex',
                                                mb: 1
                                            }}
                                        >
                                            <PaletteIcon />
                                        </Box>
                                        <Typography variant="body2" fontWeight="600">Create New</Typography>
                                    </Box>
                                </motion.div>
                            </Grid>
                        )}
                    </Grid>
                </Collapse>
            </Paper>

            <ThemeCustomizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
        </>
    );
}
