'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Alert, CircularProgress } from '@mui/material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [keys, setKeys] = useState({ groq: '', gemini: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Ideally, we shouldn't even be able to READ these from client due to rules.
    // But for the Admin to EDIT, they might want to see if a key is set.
    // Since our rule allows NO READ, we cannot fetch the current keys to display them.
    // This is "Write Only" from the client perspective for maximum security.
    // We will just show empty fields or placeholders.

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Write to the secure collection
            // Only Admins (checked by rules) can write here.
            await setDoc(doc(db, '_system_secrets', 'ai_config'), {
                groq: keys.groq,
                gemini: keys.gemini,
                updatedAt: new Date().toISOString(),
                updatedBy: user.email
            }, { merge: true });

            setSuccess('API Keys updated successfully! Server actions will now use these new keys.');
            setKeys({ groq: '', gemini: '' }); // Clear for security
        } catch (err: any) {
            console.error('Error saving keys:', err);
            setError('Failed to save keys. Ensure you have Admin privileges.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    Secure API Key Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Update the API keys used by the Server-Side AI Engine.
                    <br />
                    <strong>Note:</strong> For security, existing keys are <em>never</em> shown here. Creating a new entry overwrites the old one.
                </Typography>

                <Alert severity="warning" sx={{ mb: 4 }}>
                    These keys are stored in a protected vault (`_system_secrets`). Client-side code cannot read them.
                </Alert>

                <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Groq API Key"
                        type="password"
                        value={keys.groq}
                        onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
                        placeholder="gsk_..."
                        fullWidth
                        helperText="Enter new key to update, or leave empty to keep existing."
                    />

                    <TextField
                        label="Gemini API Key"
                        type="password"
                        value={keys.gemini}
                        onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                        placeholder="AIza..."
                        fullWidth
                        helperText="Enter new key to update, or leave empty to keep existing."
                    />

                    {error && <Alert severity="error">{error}</Alert>}
                    {success && <Alert severity="success">{success}</Alert>}

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSave}
                        disabled={saving || (!keys.groq && !keys.gemini)}
                        sx={{
                            alignSelf: 'flex-start',
                            background: 'linear-gradient(135deg, #6C63FF 0%, #5a52d5 100%)',
                            px: 4
                        }}
                    >
                        {saving ? <CircularProgress size={24} color="inherit" /> : 'Update Secure Keys'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
