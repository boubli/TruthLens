/**
 * Dietary Preferences Section
 * Modern, card-based UI for managing user dietary settings
 */

'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Switch,
    Chip,
    Button,
    Alert,
    IconButton,
    TextField,
    Autocomplete,
    alpha,
    CardActionArea,
    Collapse,
    Fade
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EggAltIcon from '@mui/icons-material/EggAlt'; // Protein/Keto
import GrassIcon from '@mui/icons-material/Grass'; // Vegan
import WaterDropIcon from '@mui/icons-material/WaterDrop'; // Diabetic/Sugar
import FavoriteIcon from '@mui/icons-material/Favorite'; // Heart/Sodium
import SpaIcon from '@mui/icons-material/Spa'; // Gluten Free
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveIcon from '@mui/icons-material/Save';
import Brightness3Icon from '@mui/icons-material/Brightness3'; // Halal
import { motion } from 'framer-motion';
import { DietaryPreferences } from '@/types/user';

interface DietaryPreferencesSectionProps {
    preferences: DietaryPreferences;
    onChange: (key: keyof DietaryPreferences) => void;
    onUpdateGranular: (key: 'allergens' | 'avoidIngredients' | 'healthGoals', value: string[]) => void;
    onSave: () => void;
    onAiSetup: () => void;
    isSaving: boolean;
}

const DIET_TYPES = [
    { key: 'isKeto' as const, labelKey: 'diet_keto_label', descKey: 'diet_keto_desc', icon: EggAltIcon, color: '#F59E0B' },
    { key: 'isVegan' as const, labelKey: 'diet_vegan_label', descKey: 'diet_vegan_desc', icon: GrassIcon, color: '#10B981' },
    { key: 'isDiabetic' as const, labelKey: 'diet_diabetic_label', descKey: 'diet_diabetic_desc', icon: WaterDropIcon, color: '#3B82F6' },
    { key: 'lowSodium' as const, labelKey: 'diet_lowsodium_label', descKey: 'diet_lowsodium_desc', icon: FavoriteIcon, color: '#EF4444' },
    { key: 'glutenFree' as const, labelKey: 'diet_glutenfree_label', descKey: 'diet_glutenfree_desc', icon: SpaIcon, color: '#8B5CF6' },
    { key: 'isHalal' as const, labelKey: 'diet_halal_label', descKey: 'diet_halal_desc', icon: Brightness3Icon, color: '#059669' },
];

export default function DietaryPreferencesSection({
    preferences,
    onChange,
    onUpdateGranular,
    onSave,
    onAiSetup,
    isSaving
}: DietaryPreferencesSectionProps) {
    const { t } = useTranslation();

    return (
        <Paper elevation={0} sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="800" gutterBottom>
                        {t('dietary_preferences_title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('dietary_preferences_subtitle')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    sx={{
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
                        textTransform: 'none',
                        px: 3
                    }}
                    startIcon={<AutoAwesomeIcon />}
                    onClick={onAiSetup}
                >
                    {t('ai_setup_button')}
                </Button>
            </Box>

            <Alert
                icon={<AutoAwesomeIcon fontSize="inherit" />}
                severity="info"
                sx={{
                    mb: 4,
                    borderRadius: 3,
                    bgcolor: alpha('#6366F1', 0.05),
                    color: 'text.primary',
                    border: '1px solid',
                    borderColor: alpha('#6366F1', 0.1),
                    '& .MuiAlert-icon': { color: '#6366F1' }
                }}
            >
                {t('ai_analysis_info')}
            </Alert>

            {/* Diet Types Grid */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                {t('core_diets_title')}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
                {DIET_TYPES.map((diet) => {
                    const isActive = preferences[diet.key];
                    const Icon = diet.icon;

                    return (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={diet.key}>
                            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                <Paper
                                    elevation={0}
                                    onClick={() => onChange(diet.key)}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        border: '1px solid',
                                        borderColor: isActive ? diet.color : 'divider',
                                        bgcolor: isActive ? alpha(diet.color, 0.05) : 'background.paper',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: '50%',
                                        bgcolor: isActive ? diet.color : alpha(diet.color, 0.1),
                                        color: isActive ? '#fff' : diet.color,
                                        display: 'flex'
                                    }}>
                                        <Icon />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" fontWeight="bold">
                                            {t(diet.labelKey)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t(diet.descKey)}
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={isActive as boolean}
                                        onChange={() => onChange(diet.key)}
                                        onClick={(e) => e.stopPropagation()}
                                        color="primary"
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: diet.color,
                                                '&:hover': { backgroundColor: alpha(diet.color, 0.08) },
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: diet.color,
                                            },
                                        }}
                                    />
                                </Paper>
                            </motion.div>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Granular Preferences */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                {t('specific_needs_title')}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', borderColor: alpha('#EF4444', 0.2), bgcolor: alpha('#EF4444', 0.02) }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                            <WarningAmberIcon color="error" />
                            <Typography variant="subtitle1" fontWeight="bold">{t('allergens_title')}</Typography>
                        </Box>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={[]}
                            value={preferences.allergens || []}
                            onChange={(e, newValue) => onUpdateGranular('allergens', newValue as string[])}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="filled" label={option} color="error" size="small" {...getTagProps({ index })} key={index} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    placeholder={t('placeholder_add_allergens')}
                                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                                />
                            )}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {t('allergens_help')}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', borderColor: alpha('#F59E0B', 0.2), bgcolor: alpha('#F59E0B', 0.02) }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                            <WarningAmberIcon color="warning" />
                            <Typography variant="subtitle1" fontWeight="bold">{t('avoid_ingredients_title')}</Typography>
                        </Box>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={[]}
                            value={preferences.avoidIngredients || []}
                            onChange={(e, newValue) => onUpdateGranular('avoidIngredients', newValue as string[])}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="filled" label={option} color="warning" size="small" {...getTagProps({ index })} key={index} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    placeholder={t('placeholder_add_ingredients')}
                                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                                />
                            )}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {t('avoid_ingredients_help')}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: alpha('#10B981', 0.2), bgcolor: alpha('#10B981', 0.02) }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                            <AutoAwesomeIcon color="success" />
                            <Typography variant="subtitle1" fontWeight="bold">{t('health_goals_title')}</Typography>
                        </Box>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={['High Protein', 'Low Carb', 'Muscle Gain', 'Weight Loss', 'Heart Health']}
                            value={preferences.healthGoals || []}
                            onChange={(e, newValue) => onUpdateGranular('healthGoals', newValue as string[])}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="filled" label={option} color="success" size="small" {...getTagProps({ index })} key={index} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    placeholder={t('placeholder_select_type')}
                                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                                />
                            )}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {t('health_goals_help')}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={onSave}
                    disabled={isSaving}
                    startIcon={isSaving ? undefined : <SaveIcon />}
                    sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        boxShadow: 4,
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    {isSaving ? t('saving_changes') : t('save_preferences')}
                </Button>
            </Box>
        </Paper>
    );
}
