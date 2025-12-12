'use client';

import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    TextField,
    MenuItem,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PublicIcon from '@mui/icons-material/Public';

// Common locations for PC parts pricing
const LOCATIONS = [
    { code: 'USA', label: '🇺🇸 United States' },
    { code: 'UK', label: '🇬🇧 United Kingdom' },
    { code: 'Canada', label: '🇨🇦 Canada' },
    { code: 'Germany', label: '🇩🇪 Germany' },
    { code: 'France', label: '🇫🇷 France' },
    { code: 'Australia', label: '🇦🇺 Australia' },
    { code: 'Japan', label: '🇯🇵 Japan' },
    { code: 'India', label: '🇮🇳 India' },
    { code: 'Brazil', label: '🇧🇷 Brazil' },
    { code: 'Mexico', label: '🇲🇽 Mexico' },
    { code: 'Spain', label: '🇪🇸 Spain' },
    { code: 'Italy', label: '🇮🇹 Italy' },
    { code: 'Netherlands', label: '🇳🇱 Netherlands' },
    { code: 'Sweden', label: '🇸🇪 Sweden' },
    { code: 'Poland', label: '🇵🇱 Poland' },
    { code: 'South Korea', label: '🇰🇷 South Korea' },
    { code: 'Singapore', label: '🇸🇬 Singapore' },
    { code: 'UAE', label: '🇦🇪 United Arab Emirates' },
];

export default function LocationSelector() {
    const { user, userProfile } = useAuth();
    const [location, setLocation] = useState(userProfile?.preferences?.location || 'USA');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (userProfile?.preferences?.location) {
            setLocation(userProfile.preferences.location);
        }
    }, [userProfile]);

    const handleLocationChange = async (newLocation: string) => {
        if (!user) return;

        setLocation(newLocation);
        setSaving(true);
        setMessage(null);

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                preferences: {
                    location: newLocation
                }
            }, { merge: true });

            setMessage({ type: 'success', text: `Location updated to ${LOCATIONS.find(l => l.code === newLocation)?.label || newLocation}` });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('[LocationSelector] Failed to save location:', error);
            setMessage({ type: 'error', text: 'Failed to save location. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper sx={{ p: 3, mt: 2, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <PublicIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                    Location for PC Builder
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select your location to get accurate PC component pricing when using the PC Builder feature.
            </Typography>

            <TextField
                select
                fullWidth
                label="Your Location"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled={saving}
                sx={{ mb: 2 }}
                InputProps={{
                    endAdornment: saving ? <CircularProgress size={20} /> : null
                }}
            >
                {LOCATIONS.map((loc) => (
                    <MenuItem key={loc.code} value={loc.code}>
                        {loc.label}
                    </MenuItem>
                ))}
            </TextField>

            {message && (
                <Alert severity={message.type} sx={{ mt: 1 }}>
                    {message.text}
                </Alert>
            )}
        </Paper>
    );
}
