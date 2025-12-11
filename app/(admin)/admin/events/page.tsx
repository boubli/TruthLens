'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Snackbar, Alert, Paper } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { getSystemSettings, updateSystemSettings } from '@/services/systemService';
import { useAuth } from '@/context/AuthContext';
import EventSettingsTab from '@/components/admin/settings/EventSettingsTab';
import { EventManagerConfig } from '@/types/system';

export default function AdminEventsPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: 'success', text: '' });
    const [eventSchedule, setEventSchedule] = useState<EventManagerConfig[]>([]);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        if (!authLoading) {
            fetchSettings();
        }
    }, [authLoading]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await getSystemSettings();
            if (data) {
                setSettings(data);
                // Migrate legacy single event to schedule array if needed
                let schedule = data.eventSchedule || [];
                if (schedule.length === 0 && data.eventManager) {
                    schedule = [data.eventManager];
                }
                setEventSchedule(schedule);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setMsg({ type: 'error', text: 'Failed to load event settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (newSettings: any) => {
        setSaving(true);
        try {
            await updateSystemSettings(newSettings);
            setEventSchedule(newSettings.eventSchedule);
            setSettings(newSettings); // Update local full state
            setMsg({ type: 'success', text: 'Events updated successfully!' });
        } catch (error) {
            console.error('Failed to update events:', error);
            setMsg({ type: 'error', text: 'Failed to save changes' });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#121212' }}>
                <CircularProgress color="secondary" />
            </Box>
        );
    }

    if (userProfile?.role !== 'admin') {
        return <Typography color="error">Access Denied</Typography>;
    }

    return (
        <Box sx={{ p: 4, bgcolor: '#121212', minHeight: '100vh', color: 'white' }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ fontSize: 40, color: '#FF4081' }} />
                <Typography variant="h4" fontWeight="bold">
                    Event Management
                </Typography>
            </Box>

            <Paper sx={{ p: 3, bgcolor: '#1e1e1e', color: 'white', borderRadius: 2 }}>
                <EventSettingsTab
                    settings={{ ...settings, eventSchedule }}
                    onUpdateSettings={handleUpdateSettings}
                    saving={saving}
                />
            </Paper>

            <Snackbar
                open={!!msg.text}
                autoHideDuration={6000}
                onClose={() => setMsg({ type: 'success', text: '' })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={msg.type as any} onClose={() => setMsg({ type: 'success', text: '' })}>
                    {msg.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}
