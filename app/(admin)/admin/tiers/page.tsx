'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Card,
    CardContent,
    CardHeader,
    Switch,
    FormControlLabel,
    InputAdornment,
    Divider,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Collapse
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { SystemTierConfig, TierDefinition } from '@/types/system';
import { updateSystemSettings } from '@/services/systemService';
import { UserTier, TIER_CONFIG } from '@/types/user';

// Temporary type for local edits before saving
type EditableConfig = SystemTierConfig;

const TierEditor = ({ tierId, tierData, onChange, onReset }: {
    tierId: UserTier,
    tierData: TierDefinition,
    onChange: (updated: TierDefinition) => void,
    onReset: () => void
}) => {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (field: keyof TierDefinition, value: any) => {
        onChange({ ...tierData, [field]: value });
    };

    const handlePricingChange = (field: 'monthly' | 'lifetime', value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return;
        onChange({
            ...tierData,
            pricing: { ...tierData.pricing, [field]: num }
        });
    };

    const handleMetaPriceChange = (field: 'originalPriceMonthly' | 'originalPriceLifetime', value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return;
        onChange({
            ...tierData,
            metadata: { ...tierData.metadata, [field]: num }
        });
    };

    const handleFeatureChange = (field: keyof typeof tierData.features, value: any) => {
        onChange({
            ...tierData,
            features: { ...tierData.features, [field]: value }
        });
    };

    const isFeatured = tierId === 'pro';

    return (
        <Card sx={{ mb: 3, borderRadius: 3, border: isFeatured ? '2px solid #6C63FF' : '1px solid #e0e0e0', overflow: 'visible' }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" fontWeight="bold">{tierData.name}</Typography>
                            {isFeatured && <Chip label="Most Popular" color="primary" size="small" />}
                        </Box>
                        <Box>
                            <IconButton onClick={() => setExpanded(!expanded)}>
                                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>
                    </Box>
                }
                subheader={tierData.description}
                sx={{
                    bgcolor: isFeatured ? 'rgba(108, 99, 255, 0.05)' : 'transparent',
                    borderBottom: expanded ? '1px solid #f0f0f0' : 'none'
                }}
            />
            <Collapse in={expanded}>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Basic Info */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Display Name"
                                value={tierData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                value={tierData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </Grid>

                        {/* Pricing */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">Pricing (USD)</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    label="Monthly Price"
                                    type="number"
                                    value={tierData.pricing.monthly}
                                    onChange={(e) => handlePricingChange('monthly', e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    fullWidth
                                />
                                <TextField
                                    label="Lifetime Price"
                                    type="number"
                                    value={tierData.pricing.lifetime}
                                    onChange={(e) => handlePricingChange('lifetime', e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    fullWidth
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Fake Original Lifetime (Strikethrough)"
                                    type="number"
                                    value={tierData.metadata.originalPriceLifetime || ''}
                                    onChange={(e) => handleMetaPriceChange('originalPriceLifetime', e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    helperText="Leave empty to hide"
                                    fullWidth
                                />
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }}><Divider><Chip label="Feature Limits" size="small" /></Divider></Grid>

                        {/* Limits */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Daily Scans"
                                type="number"
                                value={tierData.features.dailyScanLimit}
                                onChange={(e) => handleFeatureChange('dailyScanLimit', parseInt(e.target.value))}
                                helperText="-1 for Unlimited"
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Multi-Scan Limit"
                                type="number"
                                value={tierData.features.multiScanLimit}
                                onChange={(e) => handleFeatureChange('multiScanLimit', parseInt(e.target.value))}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="History Limit"
                                type="number"
                                value={tierData.features.historyLimit}
                                onChange={(e) => handleFeatureChange('historyLimit', parseInt(e.target.value))}
                                helperText="-1 for Unlimited"
                                fullWidth
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}><Divider><Chip label="Capability Flags" size="small" /></Divider></Grid>

                        {/* Boolean Toggles */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                <FormControlLabel
                                    control={<Switch checked={tierData.features.smartGrading} onChange={(e) => handleFeatureChange('smartGrading', e.target.checked)} />}
                                    label="Smart Grading"
                                />
                                <FormControlLabel
                                    control={<Switch checked={tierData.features.aiTruthDetector} onChange={(e) => handleFeatureChange('aiTruthDetector', e.target.checked)} />}
                                    label="AI Truth Detector"
                                />
                                <FormControlLabel
                                    control={<Switch checked={tierData.features.fastLane} onChange={(e) => handleFeatureChange('fastLane', e.target.checked)} />}
                                    label="Fast Lane (Priority)"
                                />
                                <FormControlLabel
                                    control={<Switch checked={!tierData.features.adsEnabled} onChange={(e) => handleFeatureChange('adsEnabled', !e.target.checked)} color="success" />}
                                    label="Ad-Free Experience"
                                />
                                <FormControlLabel
                                    control={<Switch checked={tierData.features.whiteLabel} onChange={(e) => handleFeatureChange('whiteLabel', e.target.checked)} />}
                                    label="White Label Reports"
                                />
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button startIcon={<RestoreIcon />} onClick={onReset} color="warning">
                                Reset to Defaults
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default function AdminTiersPage() {
    const { tierConfig, userProfile } = useAuth();
    const [localConfig, setLocalConfig] = useState<EditableConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    useEffect(() => {
        if (tierConfig) {
            setLocalConfig(tierConfig);
        }
    }, [tierConfig]);

    const handleSave = async () => {
        if (!localConfig) return;
        setSaving(true);
        setStatus(null);
        try {
            await updateSystemSettings({ tierConfig: localConfig });
            setStatus({ type: 'success', msg: 'Tier configuration updated successfully!' });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', msg: 'Failed to save changes.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTierUpdate = (tierId: UserTier, updatedDef: TierDefinition) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            [tierId]: updatedDef
        });
    };

    const handleResetTier = (tierId: UserTier) => {
        if (!localConfig) return;
        // Reset specific tier to code-hardcoded defaults from TIER_CONFIG
        // We need to re-construct the default object structure locally
        const base = TIER_CONFIG[tierId];
        const defaultDef: TierDefinition = {
            id: tierId,
            name: tierId.charAt(0).toUpperCase() + tierId.slice(1),
            description: 'Default Description',
            pricing: { monthly: 0, lifetime: 0, currency: 'USD' },
            features: base,
            metadata: {}
        };
        // Simple manual override for consistent defaults if needed, 
        // but broadly this resets features. Pricing might default to 0.
        // Ideally we should pull from the 'factory default' constant in systemService,
        // but that's not exported. This is a "Soft Reset".
        setLocalConfig({
            ...localConfig,
            [tierId]: defaultDef
        });
    };

    if (!localConfig) return <LoadingSpinner />;

    return (
        <Box maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Subscription Tiers</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage pricing, features, and limits for all user levels.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ borderRadius: 3, px: 4 }}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

            {status && (
                <Alert severity={status.type} sx={{ mb: 4, borderRadius: 2 }} onClose={() => setStatus(null)}>
                    {status.msg}
                </Alert>
            )}

            <TierEditor
                tierId="free"
                tierData={localConfig.free}
                onChange={(d) => handleTierUpdate('free', d)}
                onReset={() => handleResetTier('free')}
            />
            <TierEditor
                tierId="plus"
                tierData={localConfig.plus}
                onChange={(d) => handleTierUpdate('plus', d)}
                onReset={() => handleResetTier('plus')}
            />
            <TierEditor
                tierId="pro"
                tierData={localConfig.pro}
                onChange={(d) => handleTierUpdate('pro', d)}
                onReset={() => handleResetTier('pro')}
            />
            <TierEditor
                tierId="ultimate"
                tierData={localConfig.ultimate}
                onChange={(d) => handleTierUpdate('ultimate', d)}
                onReset={() => handleResetTier('ultimate')}
            />
        </Box>
    );
}
