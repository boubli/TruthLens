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
    const [currency, setCurrency] = useState<'USD' | 'EUR'>(userProfile?.preferences?.currency as 'USD' | 'EUR' || 'USD');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (userProfile?.preferences?.location) {
            setLocation(userProfile.preferences.location);
        }
        if (userProfile?.preferences?.currency) {
            setCurrency(userProfile.preferences.currency as 'USD' | 'EUR');
        }
    }, [userProfile]);

    const handleSavePreferences = async (newLocation: string, newCurrency: 'USD' | 'EUR') => {
        if (!user) return;

        setLocation(newLocation);
        setCurrency(newCurrency);
        setSaving(true);
        setMessage(null);

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                preferences: {
                    location: newLocation,
                    currency: newCurrency
                }
            }, { merge: true });

            setMessage({ type: 'success', text: 'Preferences updated successfully' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('[LocationSelector] Failed to save preferences:', error);
            setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <PublicIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                    Location & Currency
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select your location and preferred currency for accurate pricing.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                    select
                    fullWidth
                    label="Your Location"
                    value={location}
                    onChange={(e) => handleSavePreferences(e.target.value, currency)}
                    disabled={saving}
                    sx={{ flex: { xs: 1, sm: 2 } }}
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

                <TextField
                    select
                    fullWidth
                    label="Currency"
                    value={currency}
                    onChange={(e) => handleSavePreferences(location, e.target.value as 'USD' | 'EUR')}
                    disabled={saving}
                    sx={{ flex: { xs: 1, sm: 1 } }}
                >
                    <MenuItem value="USD">🇺🇸 USD ($)</MenuItem>
                    <MenuItem value="EUR">🇪🇺 EUR (€)</MenuItem>
                </TextField>
            </Box>

            {message && (
                <Alert severity={message.type} sx={{ mt: 2 }}>
                    {message.text}
                </Alert>
            )}
        </Paper>
    );
}
