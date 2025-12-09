/**
 * Theme Customizer Drawer
 * Advanced theme customization UI with color pickers and live preview
 */

'use client';

import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/hooks/useTheme';
import { themeList } from '@/lib/theme/themes';
import { CustomThemeColors, ThemeMode } from '@/types/theme';

interface ThemeCustomizerProps {
    open: boolean;
    onClose: () => void;
}

export default function ThemeCustomizer({ open, onClose }: ThemeCustomizerProps) {
    const { themeId, setTheme, customizeTheme, resetTheme, customColors } = useTheme();

    // Custom theme state
    const [customPrimary, setCustomPrimary] = useState(customColors?.primary || '#10B981');
    const [customSecondary, setCustomSecondary] = useState(customColors?.secondary || '#059669');
    const [customBackground, setCustomBackground] = useState(customColors?.background || '#F9FAFB');
    const [customMode, setCustomMode] = useState<ThemeMode>(customColors?.mode || 'light');
    const [customBorderRadius, setCustomBorderRadius] = useState(customColors?.borderRadius || 12);
    const [customFontFamily, setCustomFontFamily] = useState(customColors?.fontFamily || "'Inter', sans-serif");

    const handleSaveCustomTheme = () => {
        const colors: CustomThemeColors = {
            primary: customPrimary,
            secondary: customSecondary,
            background: customBackground,
            mode: customMode,
            borderRadius: customBorderRadius,
            fontFamily: customFontFamily,
        };
        customizeTheme(colors);
        onClose();
    };

    const handleReset = () => {
        resetTheme();
        onClose();
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: { xs: '100%', sm: 400 },
                    p: 3,
                },
            }}
        >
            <Box>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Theme Customizer
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Predefined Themes */}
                <Typography variant="h6" gutterBottom>
                    Predefined Themes
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {themeList.map((theme) => (
                        <Grid size={{ xs: 6 }} key={theme.id}>
                            <Card
                                component={motion.div as any}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                sx={{
                                    position: 'relative',
                                    border: themeId === theme.id ? 2 : 0,
                                    borderColor: 'primary.main',
                                }}
                            >
                                <CardActionArea onClick={() => setTheme(theme.id)}>
                                    <CardContent>
                                        {/* Color Preview */}
                                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 1,
                                                    bgcolor: theme.colors.primary.main,
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 1,
                                                    bgcolor: theme.colors.secondary.main,
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 1,
                                                    bgcolor: theme.colors.background.default,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="body2" fontWeight="medium">
                                            {theme.name}
                                        </Typography>

                                        {themeId === theme.id && (
                                            <CheckCircleIcon
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    color: 'primary.main',
                                                    fontSize: 20,
                                                }}
                                            />
                                        )}
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Custom Theme Builder */}
                <Typography variant="h6" gutterBottom>
                    Custom Theme
                </Typography>

                {/* Mode Toggle */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={customMode === 'dark'}
                            onChange={(e) => setCustomMode(e.target.checked ? 'dark' : 'light')}
                        />
                    }
                    label={`${customMode === 'dark' ? 'Dark' : 'Light'} Mode`}
                    sx={{ mb: 2 }}
                />

                {/* Primary Color */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Primary Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            type="color"
                            value={customPrimary}
                            onChange={(e) => setCustomPrimary(e.target.value)}
                            sx={{ width: 60 }}
                        />
                        <TextField
                            value={customPrimary}
                            onChange={(e) => setCustomPrimary(e.target.value)}
                            size="small"
                            fullWidth
                        />
                    </Box>
                </Box>

                {/* Secondary Color */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Secondary Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            type="color"
                            value={customSecondary}
                            onChange={(e) => setCustomSecondary(e.target.value)}
                            sx={{ width: 60 }}
                        />
                        <TextField
                            value={customSecondary}
                            onChange={(e) => setCustomSecondary(e.target.value)}
                            size="small"
                            fullWidth
                        />
                    </Box>
                </Box>

                {/* Background Color */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Background Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            type="color"
                            value={customBackground}
                            onChange={(e) => setCustomBackground(e.target.value)}
                            sx={{ width: 60 }}
                        />
                        <TextField
                            value={customBackground}
                            onChange={(e) => setCustomBackground(e.target.value)}
                            size="small"
                            fullWidth
                        />
                    </Box>
                </Box>

                {/* Border Radius */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Border Radius: {customBorderRadius}px
                    </Typography>
                    <Slider
                        value={customBorderRadius}
                        onChange={(_, value) => setCustomBorderRadius(value as number)}
                        min={0}
                        max={24}
                        step={2}
                        marks
                    />
                </Box>

                {/* Font Family */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Font Family</InputLabel>
                    <Select
                        value={customFontFamily}
                        onChange={(e) => setCustomFontFamily(e.target.value)}
                        label="Font Family"
                    >
                        <MenuItem value="'Inter', sans-serif">Inter</MenuItem>
                        <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
                        <MenuItem value="'Poppins', sans-serif">Poppins</MenuItem>
                        <MenuItem value="'Outfit', sans-serif">Outfit</MenuItem>
                        <MenuItem value="'Montserrat', sans-serif">Montserrat</MenuItem>
                    </Select>
                </FormControl>

                <Divider sx={{ my: 3 }} />

                {/* Live Preview */}
                <Typography variant="h6" gutterBottom>
                    Preview
                </Typography>
                <Box
                    sx={{
                        p: 2,
                        borderRadius: `${customBorderRadius}px`,
                        bgcolor: customBackground,
                        mb: 3,
                    }}
                >
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            bgcolor: customPrimary,
                            borderRadius: `${customBorderRadius}px`,
                            fontFamily: customFontFamily,
                            mb: 1,
                            '&:hover': {
                                bgcolor: customPrimary,
                                opacity: 0.9,
                            },
                        }}
                    >
                        Primary Button
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                            borderColor: customSecondary,
                            color: customSecondary,
                            borderRadius: `${customBorderRadius}px`,
                            fontFamily: customFontFamily,
                            '&:hover': {
                                borderColor: customSecondary,
                                bgcolor: `${customSecondary}20`,
                            },
                        }}
                    >
                        Secondary Button
                    </Button>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSaveCustomTheme}
                    >
                        Save Custom Theme
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
