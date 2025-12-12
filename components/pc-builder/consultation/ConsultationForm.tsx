'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    MenuItem,
    Chip,
    InputAdornment
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { PCBuildFormData } from '@/types/pcBuilder';

interface ConsultationFormProps {
    existingData?: PCBuildFormData;
    onSuccess: () => void;
}

const COUNTRIES = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Australia', 'Other'];
const USAGE_TYPES = ['Gaming', 'Workstation', 'Streaming', 'Programming', 'Video Editing', '3D Rendering', 'General Home Use'];
const RESOLUTIONS = ['1080p (FHD)', '1440p (2K)', '4K (UHD)', 'Ultrawide'];

export default function ConsultationForm({ existingData, onSuccess }: ConsultationFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<PCBuildFormData>(existingData || {
        budget: 1500,
        currency: 'USD',
        country: 'USA',
        usage: 'Gaming',
        preferences: '',
        monitors: 1,
        resolution: '1440p (2K)',
        peripherals: []
    });

    const [peripheralInput, setPeripheralInput] = useState('');

    const handleChange = (field: keyof PCBuildFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddPeripheral = () => {
        if (peripheralInput.trim()) {
            setFormData(prev => ({
                ...prev,
                peripherals: [...prev.peripherals, peripheralInput.trim()]
            }));
            setPeripheralInput('');
        }
    };

    const removePeripheral = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            peripherals: prev.peripherals.filter((_, i) => i !== idx)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const ref = doc(db, 'pc_build_requests', user.uid);
            // Updating the document created by Stripe webhook/verification
            await setDoc(ref, {
                formData,
                status: 'submitted',
                updatedAt: serverTimestamp()
            }, { merge: true });

            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError('Failed to submit form. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                PC Requirement Details
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Please provide as much detail as possible so we can build the perfect rig for you.
            </Typography>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Budget"
                            type="number"
                            value={formData.budget}
                            onChange={(e) => handleChange('budget', Number(e.target.value))}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">{formData.currency === 'USD' ? '$' : '€'}</InputAdornment>,
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            select
                            label="Country"
                            value={formData.country}
                            onChange={(e) => handleChange('country', e.target.value)}
                        >
                            {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            select
                            label="Primary Usage"
                            value={formData.usage}
                            onChange={(e) => handleChange('usage', e.target.value)}
                        >
                            {USAGE_TYPES.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Number of Monitors"
                            value={formData.monitors}
                            onChange={(e) => handleChange('monitors', Number(e.target.value))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            select
                            label="Target Resolution"
                            value={formData.resolution}
                            onChange={(e) => handleChange('resolution', e.target.value)}
                        >
                            {RESOLUTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" gutterBottom>Peripherals Needed</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            {formData.peripherals.map((p, i) => (
                                <Chip key={i} label={p} onDelete={() => removePeripheral(i)} />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="e.g., Gaming Mouse, Mechanical Keyboard"
                                value={peripheralInput}
                                onChange={(e) => setPeripheralInput(e.target.value)}
                            />
                            <Button variant="outlined" onClick={handleAddPeripheral}>Add</Button>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Additional Preferences"
                            placeholder="Any specific brands, colors (e.g. White build), size constraints, or specific games you play?"
                            value={formData.preferences}
                            onChange={(e) => handleChange('preferences', e.target.value)}
                        />
                    </Grid>

                    {error && (
                        <Grid size={{ xs: 12 }}>
                            <Alert severity="error">{error}</Alert>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}
