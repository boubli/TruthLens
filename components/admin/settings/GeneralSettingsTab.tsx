'use client';

import React from 'react';
import {
    Box,
    Paper,
    Typography,
    // Grid,
    FormControlLabel,
    Switch,
    Card,
    CardHeader,
    CardContent,
    TextField,
    Button,
    CircularProgress
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SaveIcon from '@mui/icons-material/Save';
import ThemeSelector from '@/components/theme/ThemeSelector';

interface GeneralSettingsTabProps {
    maintenanceMode: boolean;
    setMaintenanceMode: React.Dispatch<React.SetStateAction<boolean>>;
    updateMaintenanceMode: (val: boolean) => Promise<void>;
    betaMode: boolean;
    setBetaMode: React.Dispatch<React.SetStateAction<boolean>>;
    updateBetaMode: (val: boolean) => Promise<void>;
    branding: {
        faviconUrl: string;
        appleTouchIconUrl: string;
        androidIcon192Url: string;
        androidIcon512Url: string;
    };
    setBranding: React.Dispatch<React.SetStateAction<{
        faviconUrl: string;
        appleTouchIconUrl: string;
        androidIcon192Url: string;
        androidIcon512Url: string;
    }>>;
    handleSaveBranding: () => Promise<void>;
    savingBranding: boolean;
}

export default function GeneralSettingsTab({
    maintenanceMode,
    setMaintenanceMode,
    updateMaintenanceMode,
    betaMode,
    setBetaMode,
    updateBetaMode,
    branding,
    setBranding,
    handleSaveBranding,
    savingBranding
}: GeneralSettingsTabProps) {
    return (
        <Box>
            {/* --- GENERAL SETTINGS --- */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsSuggestIcon color="warning" /> General Settings
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={maintenanceMode}
                                        onChange={async (e) => {
                                            const v = e.target.checked;
                                            setMaintenanceMode(v);
                                            await updateMaintenanceMode(v);
                                        }}
                                        color="warning"
                                    />
                                }
                                label={<Box><Typography fontWeight="bold">Maintenance Mode</Typography><Typography variant="caption">Only Admins can access.</Typography></Box>}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(108, 99, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(108, 99, 255, 0.2)' }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={betaMode}
                                        onChange={async (e) => {
                                            const v = e.target.checked;
                                            setBetaMode(v);
                                            await updateBetaMode(v);
                                        }}
                                        color="secondary"
                                    />
                                }
                                label={<Box><Typography fontWeight="bold">Beta Features</Typography><Typography variant="caption">Unlock experimental features.</Typography></Box>}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- BRANDING / PWA --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #ffcc80' }}>
                <CardHeader
                    title="Branding & PWA"
                    subheader="App Icons and Identity"
                    avatar={<Typography sx={{ fontSize: 24 }}>🎨</Typography>}
                    sx={{ bgcolor: '#fff3e0', borderBottom: '1px solid #ffcc80' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField label="Favicon URL" fullWidth value={branding.faviconUrl} onChange={(e) => setBranding(prev => ({ ...prev, faviconUrl: e.target.value }))} size="small" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Apple Touch Icon" fullWidth value={branding.appleTouchIconUrl} onChange={(e) => setBranding(prev => ({ ...prev, appleTouchIconUrl: e.target.value }))} size="small" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Android Icon 192px URL" fullWidth value={branding.androidIcon192Url} onChange={(e) => setBranding(prev => ({ ...prev, androidIcon192Url: e.target.value }))} size="small" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Android Icon 512px URL" fullWidth value={branding.androidIcon512Url} onChange={(e) => setBranding(prev => ({ ...prev, androidIcon512Url: e.target.value }))} size="small" />
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={handleSaveBranding}
                            disabled={savingBranding}
                            startIcon={savingBranding ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save Branding
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Admin Theme Customization */}
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎭 Admin Interface Theme
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Customize your admin panel theme.
                </Typography>
                <ThemeSelector showCustomizer={false} />
            </Box>
        </Box>
    );
}
