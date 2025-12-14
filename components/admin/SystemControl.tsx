'use client';

import React, { useEffect, useState } from 'react';
import {
    Paper,
    Typography,
    Switch,
    Box,
    FormControlLabel,
    Alert,
    LinearProgress
} from '@mui/material';
import { getSystemSettings, updateSystemSettings, DEFAULT_SETTINGS } from '@/services/systemService';
import { ExtendedSystemSettings as SystemSettings } from '@/types/system';
import EngineeringIcon from '@mui/icons-material/Engineering';

export default function SystemControl() {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getSystemSettings();
            setSettings(data);
        } catch (err) {
            setError('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    const handleMaintenanceToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        // Optimistic update
        setSettings(prev => ({ ...prev, maintenanceMode: newValue }));

        try {
            await updateSystemSettings({ maintenanceMode: newValue });
        } catch (err) {
            setError('Failed to update maintenance mode');
            // Revert on error
            setSettings(prev => ({ ...prev, maintenanceMode: !newValue }));
        }
    };

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EngineeringIcon sx={{ mr: 1, color: '#F59E0B' }} />
                <Typography variant="h6">
                    System Control
                </Typography>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.maintenanceMode}
                            onChange={handleMaintenanceToggle}
                            color="error"
                        />
                    }
                    label={
                        <Box>
                            <Typography fontWeight="bold">Maintenance Mode</Typography>
                            <Typography variant="caption" color="text.secondary">
                                When enabled, only admins can access the site.
                                <br />
                                All other users will see the maintenance page.
                            </Typography>
                        </Box>
                    }
                />
            </Box>
        </Paper>
    );
}
