'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Snackbar,
    Divider
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import KeyIcon from '@mui/icons-material/Key';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BuildIcon from '@mui/icons-material/Build';
import ScienceIcon from '@mui/icons-material/Science';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Switch, FormControlLabel } from '@mui/material';
import { getSystemSettings, updateSystemSettings } from '@/services/systemService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeSelector from '@/components/theme/ThemeSelector';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminSettingsPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: 'success', text: '' });
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    // General Settings
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [betaMode, setBetaMode] = useState(false);

    // Secure API Keys (stored in _system_secrets - backend only access)
    const [secureKeys, setSecureKeys] = useState({
        groq: '',
        gemini: ''
    });
    const [savingSecure, setSavingSecure] = useState(false);

    // Other API Keys (stored in system/settings - public access)

    const [apiKeys, setApiKeys] = useState({
        gemini: '',
        groq: '',
        openai: '',
        deepseek: '',
        cerebras: '',
        sambanova: '',
        serpapi: ''
    });

    useEffect(() => {
        if (!authLoading) {
            if (userProfile?.role !== 'admin') {
                router.push('/');
                return;
            }
            fetchSettings();
        }
    }, [userProfile, authLoading]);

    const fetchSettings = async () => {
        try {
            const settings = await getSystemSettings();

            // Load environment variable keys as fallback/current values
            const envKeys = {
                gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
                groq: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
                openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
                deepseek: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
                cerebras: process.env.NEXT_PUBLIC_CEREBRAS_API_KEY || '',
                sambanova: process.env.NEXT_PUBLIC_SAMBANOVA_API_KEY || '',
                serpapi: process.env.NEXT_PUBLIC_SERPAPI_API_KEY || ''
            };

            // Merge: Firebase overrides take precedence, env keys as fallback
            const mergedKeys = {
                gemini: settings.apiKeys?.gemini || envKeys.gemini,
                groq: settings.apiKeys?.groq || envKeys.groq,
                openai: settings.apiKeys?.openai || envKeys.openai,
                deepseek: settings.apiKeys?.deepseek || envKeys.deepseek,
                cerebras: settings.apiKeys?.cerebras || envKeys.cerebras,
                sambanova: settings.apiKeys?.sambanova || envKeys.sambanova,
                serpapi: settings.apiKeys?.serpapi || envKeys.serpapi
            };

            setApiKeys(mergedKeys);
            console.log('[ADMIN] Current API keys loaded (from Firebase or env)');

            if (typeof settings.maintenanceMode !== 'undefined') {
                setMaintenanceMode(settings.maintenanceMode);
            }
            if (typeof settings.betaAccess !== 'undefined') {
                setBetaMode(settings.betaAccess);
            }
        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        console.log('[ADMIN] Saving API keys:', apiKeys);
        try {
            // Only save API keys - toggles auto-save themselves
            await updateSystemSettings({
                apiKeys
            });
            console.log('[ADMIN] API keys saved successfully!');
            setMsg({ type: 'success', text: 'API keys updated successfully!' });
        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Failed to save API keys' });
        } finally {
            setSaving(false);
        }
    };

    const toggleShow = (key: string) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key: string, value: string) => {
        setApiKeys(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSecureKeys = async () => {
        if (!userProfile?.email) return;
        setSavingSecure(true);
        try {
            await setDoc(doc(db, '_system_secrets', 'ai_config'), {
                groq: secureKeys.groq,
                gemini: secureKeys.gemini,
                updatedAt: new Date().toISOString(),
                updatedBy: userProfile.email
            }, { merge: true });

            setMsg({ type: 'success', text: '🔐 Secure AI keys updated! Server actions will now use these keys.' });
            setSecureKeys({ groq: '', gemini: '' }); // Clear for security
        } catch (error: any) {
            console.error('Failed to save secure keys:', error);
            setMsg({ type: 'error', text: 'Failed to save secure keys. Ensure you have Admin privileges.' });
        } finally {
            setSavingSecure(false);
        }
    };

    if (loading || authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 2 } }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: { xs: 2, sm: 4 }, fontSize: { xs: '1.75rem', sm: '2.125rem' }, color: '#333' }}>
                System Settings
            </Typography>

            <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsSuggestIcon color="warning" /> General Settings
                </Typography>

                <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={maintenanceMode}
                                onChange={async (e) => {
                                    const newValue = e.target.checked;
                                    setMaintenanceMode(newValue);
                                    // Auto-save immediately
                                    try {
                                        await updateSystemSettings({ maintenanceMode: newValue });
                                        console.log('[ADMIN] Maintenance Mode auto-saved:', newValue);
                                        setMsg({ type: 'success', text: `Maintenance Mode ${newValue ? 'enabled' : 'disabled'}` });
                                    } catch (error) {
                                        console.error('[ADMIN] Failed to auto-save:', error);
                                        setMsg({ type: 'error', text: 'Failed to update Maintenance Mode' });
                                        // Revert on error
                                        setMaintenanceMode(!newValue);
                                    }
                                }}
                                color="warning"
                            />
                        }
                        label={
                            <Box>
                                <Typography fontWeight="bold">Maintenance Mode</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    When enabled, only Admins can access the application. Regular users will see a maintenance screen.
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(108, 99, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(108, 99, 255, 0.2)' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={betaMode}
                                onChange={async (e) => {
                                    const newValue = e.target.checked;
                                    setBetaMode(newValue);
                                    // Auto-save immediately
                                    try {
                                        await updateSystemSettings({ betaAccess: newValue });
                                        console.log('[ADMIN] Beta Mode auto-saved:', newValue);
                                        setMsg({ type: 'success', text: `Beta Features ${newValue ? 'enabled' : 'disabled'}` });
                                    } catch (error) {
                                        console.error('[ADMIN] Failed to auto-save:', error);
                                        setMsg({ type: 'error', text: 'Failed to update Beta Features' });
                                        setBetaMode(!newValue);
                                    }
                                }}
                                color="secondary"
                            />
                        }
                        label={
                            <Box>
                                <Typography fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ScienceIcon fontSize="small" color="secondary" /> Beta Features Access
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    When enabled, Pro and Ultimate/Admin users will see "Beta" features in the app.
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Theme Management Quick Access */}
                <Box
                    sx={{
                        mb: 4,
                        p: 2,
                        bgcolor: 'rgba(255, 215, 0, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'rgba(255, 215, 0, 0.1)',
                            transform: 'translateX(4px)'
                        }
                    }}
                    onClick={() => router.push('/admin/themes')}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontSize: 28 }}>🎨</Typography>
                        <Box sx={{ flex: 1 }}>
                            <Typography fontWeight="bold">
                                Theme Management
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Create and manage custom themes for all users
                            </Typography>
                        </Box>
                        <KeyboardArrowRightIcon sx={{ color: 'text.secondary' }} />
                    </Box>
                </Box>

                {/* Admin Theme Customization */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        🎭 Admin Interface Theme
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Customize your admin panel theme. This is separate from the user app theme and only affects your admin interface. <strong>Default: System Default theme.</strong>
                    </Typography>

                    <ThemeSelector showCustomizer={false} />
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Secure API Keys Section (For Server-Side Only) */}
                <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2, border: '2px solid rgba(76, 175, 80, 0.3)' }}>
                    <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                        🔐 Secure AI Keys (Server-Side Vault)
                    </Typography>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <strong>High Security:</strong> These keys are stored in a protected Firestore collection that is <strong>inaccessible to client-side code</strong>.
                        Only Server Actions can read them. Use for production-critical keys (Groq, Gemini).
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="🚀 Groq API Key (Server-Side)"
                            fullWidth
                            type={showKeys['secure_groq'] ? 'text' : 'password'}
                            value={secureKeys.groq}
                            onChange={(e) => setSecureKeys(prev => ({ ...prev, groq: e.target.value }))}
                            placeholder="gsk_..."
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => toggleShow('secure_groq')} edge="end">
                                            {showKeys['secure_groq'] ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            helperText="For security, existing keys are never shown. Enter new key to update."
                        />

                        <TextField
                            label="🤖 Gemini API Key (Server-Side)"
                            fullWidth
                            type={showKeys['secure_gemini'] ? 'text' : 'password'}
                            value={secureKeys.gemini}
                            onChange={(e) => setSecureKeys(prev => ({ ...prev, gemini: e.target.value }))}
                            placeholder="AIza..."
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => toggleShow('secure_gemini')} edge="end">
                                            {showKeys['secure_gemini'] ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            helperText="For security, existing keys are never shown. Enter new key to update."
                        />

                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            startIcon={savingSecure ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={handleSaveSecureKeys}
                            disabled={savingSecure || (!secureKeys.groq && !secureKeys.gemini)}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {savingSecure ? 'Securing...' : '🔐 Update Secure Keys'}
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <KeyIcon color="primary" /> Legacy API Keys (Public Collection)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Manage dynamic API keys for the AI Swarm. Keys entered here will override the environment variables.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {(Object.keys(apiKeys) as Array<keyof typeof apiKeys>).map((key) => (
                        <Box key={key} sx={{ flex: '1 1 300px' }}>
                            <TextField
                                label={`${key.charAt(0).toUpperCase() + key.slice(1)} API Key`}
                                fullWidth
                                type={showKeys[key] ? 'text' : 'password'}
                                // @ts-ignore
                                value={apiKeys[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => toggleShow(key)}
                                                edge="end"
                                            >
                                                {showKeys[key] ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                helperText={`Overrides NEXT_PUBLIC_${key.toUpperCase()}_API_KEY`}
                            />
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={!!msg.text}
                autoHideDuration={6000}
                onClose={() => setMsg({ type: '', text: '' })}
            >
                <Alert severity={msg.type as any} sx={{ width: '100%' }}>
                    {msg.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}
