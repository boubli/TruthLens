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
    Divider,
    Card,
    CardContent,
    CardHeader
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import KeyIcon from '@mui/icons-material/Key';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BuildIcon from '@mui/icons-material/Build';
import ScienceIcon from '@mui/icons-material/Science';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { Switch, FormControlLabel } from '@mui/material';
import { getSystemSettings, updateSystemSettings } from '@/services/systemService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeSelector from '@/components/theme/ThemeSelector';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import axios from 'axios';

export default function AdminSettingsPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
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

    // --- FREE API KEYS ---
    const [freeApiKeys, setFreeApiKeys] = useState({
        gemini: '',
        groq: '',
        openai: '',
        deepseek: '',
        cerebras: '',
        sambanova: '',
        serpapi: ''
    });
    const [savingFreeKeys, setSavingFreeKeys] = useState(false);

    // --- SEARXNG SETTINGS ---
    const [searxngConfig, setSearxngConfig] = useState({
        searxngUrl: ''
    });
    const [savingSearxng, setSavingSearxng] = useState(false);

    // --- OLLAMA SETTINGS ---
    const [ollamaConfig, setOllamaConfig] = useState({
        ollamaUrl: '',
        ollamaFallbackUrl: '',
        defaultOllamaModel: '',
        ollamaModels: {} as Record<string, boolean>
    });
    const [savingOllama, setSavingOllama] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    const [branding, setBranding] = useState({
        faviconUrl: '',
        appleTouchIconUrl: '',
        androidIcon192Url: '',
        androidIcon512Url: ''
    });
    const [savingBranding, setSavingBranding] = useState(false);

    // --- BACKUP SETTINGS ---
    const [runningBackup, setRunningBackup] = useState(false);
    const [backupHistory, setBackupHistory] = useState<any[]>([]);
    const [loadingBackupHistory, setLoadingBackupHistory] = useState(false);

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
                serpapi: process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '',
            };

            setFreeApiKeys({
                gemini: settings.apiKeys?.gemini || envKeys.gemini,
                groq: settings.apiKeys?.groq || envKeys.groq,
                openai: settings.apiKeys?.openai || envKeys.openai,
                deepseek: settings.apiKeys?.deepseek || envKeys.deepseek,
                cerebras: settings.apiKeys?.cerebras || envKeys.cerebras,
                sambanova: settings.apiKeys?.sambanova || envKeys.sambanova,
                serpapi: settings.apiKeys?.serpapi || envKeys.serpapi,
            });

            setSearxngConfig({
                searxngUrl: settings.apiKeys?.searxngUrl || 'http://20.199.129.203:8080',
            });

            setOllamaConfig({
                ollamaUrl: settings.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434',
                ollamaFallbackUrl: settings.apiKeys?.ollamaFallbackUrl || '',
                defaultOllamaModel: settings.apiKeys?.defaultOllamaModel || '',
                ollamaModels: settings.apiKeys?.ollamaModels || {}
            });

            // Load Models list if Ollama URL exists
            const currentOllamaUrl = settings.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434';
            if (currentOllamaUrl) {
                fetchOllamaModels(currentOllamaUrl, false);
            }

            if (settings.branding) {
                setBranding({
                    faviconUrl: settings.branding.faviconUrl || '',
                    appleTouchIconUrl: settings.branding.appleTouchIconUrl || '',
                    androidIcon192Url: settings.branding.androidIcon192Url || '',
                    androidIcon512Url: settings.branding.androidIcon512Url || ''
                });
            }

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

    const toggleShow = (key: string) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveFreeKeys = async () => {
        setSavingFreeKeys(true);
        try {
            // We need to merge with existing settings to avoid overwriting other keys
            const currentSettings = await getSystemSettings();
            const updatedApiKeys = {
                ...currentSettings.apiKeys,
                ...freeApiKeys
            };

            await updateSystemSettings({ apiKeys: updatedApiKeys });
            setMsg({ type: 'success', text: 'Free API Keys updated!' });
        } catch (error) {
            console.error('Save Free Keys Error:', error);
            setMsg({ type: 'error', text: 'Failed to save API keys' });
        } finally {
            setSavingFreeKeys(false);
        }
    };

    const handleSaveSearxng = async () => {
        setSavingSearxng(true);
        try {
            const currentSettings = await getSystemSettings();
            const updatedApiKeys = {
                ...currentSettings.apiKeys,
                ...searxngConfig
            };
            await updateSystemSettings({ apiKeys: updatedApiKeys });
            setMsg({ type: 'success', text: 'SearXNG Settings updated!' });
        } catch (error) {
            console.error('Save SearXNG Error:', error);
            setMsg({ type: 'error', text: 'Failed to save SearXNG settings' });
        } finally {
            setSavingSearxng(false);
        }
    };

    const handleSaveOllama = async () => {
        setSavingOllama(true);
        try {
            const currentSettings = await getSystemSettings();
            const updatedApiKeys = {
                ...currentSettings.apiKeys,
                ...ollamaConfig
            };
            // Ensure ollamaModels is saved correctly even if empty
            if (!updatedApiKeys.ollamaModels) {
                updatedApiKeys.ollamaModels = {};
            }
            await updateSystemSettings({ apiKeys: updatedApiKeys });
            setMsg({ type: 'success', text: 'Ollama Settings updated!' });
        } catch (error) {
            console.error('Save Ollama Error:', error);
            setMsg({ type: 'error', text: 'Failed to save Ollama settings' });
        } finally {
            setSavingOllama(false);
        }
    };

    const handleSaveBranding = async () => {
        setSavingBranding(true);
        try {
            await updateSystemSettings({ branding });
            setMsg({ type: 'success', text: 'Branding updated!' });
        } catch (error) {
            console.error('Save Branding Error:', error);
            setMsg({ type: 'error', text: 'Failed to save branding' });
        } finally {
            setSavingBranding(false);
        }
    };

    const fetchOllamaModels = async (url: string, showMsg = true) => {
        if (!url) return;
        setLoadingModels(true);
        try {
            console.log('[ADMIN] Fetching models via proxy for:', url);
            // Use local API proxy to avoid CORS issues
            const response = await axios.get('/api/admin/ollama/models', {
                params: { url: url }
            });

            const models = response.data.models?.map((m: any) => m.name) || [];
            if (models.length > 0) {
                setAvailableModels(models);

                // Merge with existing enabled status (don't overwrite user prefs if known)
                setOllamaConfig(prev => {
                    const currentModels = prev.ollamaModels || {};
                    const newModels = { ...currentModels };

                    // Ensure new models are tracked (default to enabled on discovery)
                    models.forEach((m: string) => {
                        if (newModels[m] === undefined) {
                            newModels[m] = true;
                        }
                    });
                    return { ...prev, ollamaModels: newModels };
                });

                if (showMsg) setMsg({ type: 'success', text: `Found ${models.length} AI models!` });
            } else {
                setAvailableModels([]);
                if (showMsg) setMsg({ type: 'warning', text: 'Connected to server, but no models found installed.' });
            }

        } catch (error) {
            console.error('[ADMIN] Failed to fetch models:', error);
            if (showMsg) setMsg({ type: 'error', text: 'Failed to connect. Ensure your Ollama server is running and accessible from the backend.' });
        } finally {
            setLoadingModels(false);
        }
    };

    const toggleModel = (modelName: string) => {
        setOllamaConfig(prev => ({
            ...prev,
            ollamaModels: {
                ...prev.ollamaModels,
                [modelName]: !prev.ollamaModels?.[modelName]
            }
        }));
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
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 1, sm: 2 } }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' }, color: '#333' }}>
                System Settings
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Manage global configuration, AI services, and integrations.
            </Typography>

            {/* --- GENERAL SETTINGS --- */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsSuggestIcon color="warning" /> General Settings
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                            <FormControlLabel
                                control={<Switch checked={maintenanceMode} onChange={async (e) => { const v = e.target.checked; setMaintenanceMode(v); try { await updateSystemSettings({ maintenanceMode: v }); } catch { setMaintenanceMode(!v); } }} color="warning" />}
                                label={<Box><Typography fontWeight="bold">Maintenance Mode</Typography><Typography variant="caption">Only Admins can access.</Typography></Box>}
                            />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(108, 99, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(108, 99, 255, 0.2)' }}>
                            <FormControlLabel
                                control={<Switch checked={betaMode} onChange={async (e) => { const v = e.target.checked; setBetaMode(v); try { await updateSystemSettings({ betaAccess: v }); } catch { setBetaMode(!v); } }} color="secondary" />}
                                label={<Box><Typography fontWeight="bold">Beta Features</Typography><Typography variant="caption">Unlock experimental features.</Typography></Box>}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>


            {/* --- SECURE KEYS (SERVER SIDE) --- */}
            <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BuildIcon /> Secure AI Keys
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 'auto', bgcolor: '#e8f5e9', color: 'success.dark', px: 1, py: 0.5, borderRadius: 1 }}>Server-Side Vault</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>Keys here are never exposed to the client. Used for production-critical LLMs.</Alert>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Groq API Key (Secure)" type="password" value={secureKeys.groq} onChange={(e) => setSecureKeys(prev => ({ ...prev, groq: e.target.value }))} fullWidth size="small" />
                        <TextField label="Gemini API Key (Secure)" type="password" value={secureKeys.gemini} onChange={(e) => setSecureKeys(prev => ({ ...prev, gemini: e.target.value }))} fullWidth size="small" />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button variant="contained" color="success" onClick={handleSaveSecureKeys} disabled={savingSecure || (!secureKeys.groq && !secureKeys.gemini)} startIcon={savingSecure ? <CircularProgress size={16} /> : <SaveIcon />}>
                                {savingSecure ? 'Securing...' : 'Update Vault'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* --- FREE API KEYS CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #bbdefb' }}>
                <CardHeader
                    title="Legacy & Free API Keys"
                    subheader="Public collection for client-side Swarm Logic"
                    avatar={<CloudQueueIcon color="primary" />}
                    sx={{ bgcolor: '#e3f2fd', borderBottom: '1px solid #bbdefb' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        {Object.keys(freeApiKeys).map((key) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={key}>
                                <TextField
                                    label={`${key.charAt(0).toUpperCase() + key.slice(1)} Key`}
                                    fullWidth
                                    size="small"
                                    type={showKeys[key] ? 'text' : 'password'}
                                    // @ts-ignore
                                    value={freeApiKeys[key]}
                                    // @ts-ignore
                                    onChange={(e) => setFreeApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => toggleShow(key)} edge="end" size="small">
                                                    {showKeys[key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveFreeKeys}
                            disabled={savingFreeKeys}
                            startIcon={savingFreeKeys ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save Free Keys
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* --- SEARXNG CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #c8e6c9' }}>
                <CardHeader
                    title="SearXNG Search Engine"
                    subheader="Self-hosted unlimited web search"
                    avatar={<SearchIcon color="success" />}
                    sx={{ bgcolor: '#e8f5e9', borderBottom: '1px solid #c8e6c9' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <TextField
                        label="SearXNG Instance URL"
                        fullWidth
                        value={searxngConfig.searxngUrl}
                        onChange={(e) => setSearxngConfig(prev => ({ ...prev, searxngUrl: e.target.value }))}
                        placeholder="http://your-server:8080"
                        helperText="Ensure JSON format is enabled in settings.yml"
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSaveSearxng}
                            disabled={savingSearxng}
                            startIcon={savingSearxng ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save Internal Search
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* --- OLLAMA CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #e1bee7' }}>
                <CardHeader
                    title="Ollama AI Models"
                    subheader="Self-hosted LLM Inference Management"
                    avatar={<SmartToyIcon color="secondary" />}
                    sx={{ bgcolor: '#f3e5f5', borderBottom: '1px solid #e1bee7' }}
                    action={
                        <Button startIcon={<SettingsSuggestIcon />} onClick={() => fetchOllamaModels(ollamaConfig.ollamaUrl)}>
                            Refresh Models
                        </Button>
                    }
                />
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Primary Ollama URL"
                                fullWidth
                                value={ollamaConfig.ollamaUrl}
                                onChange={(e) => setOllamaConfig(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                                placeholder="http://primary-server:11434"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Fallback Ollama URL"
                                fullWidth
                                value={ollamaConfig.ollamaFallbackUrl}
                                onChange={(e) => setOllamaConfig(prev => ({ ...prev, ollamaFallbackUrl: e.target.value }))}
                                placeholder="http://backup-server:11434"
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>
                        DETECTED MODELS ({availableModels.length})
                    </Typography>

                    {availableModels.length > 0 ? (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {availableModels.map((model) => (
                                <Grid size={{ xs: 12 }} key={model}>
                                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: ollamaConfig.defaultOllamaModel === model ? 'rgba(156, 39, 176, 0.04)' : 'transparent', borderColor: ollamaConfig.defaultOllamaModel === model ? 'secondary.main' : 'divider' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {model}
                                                </Typography>
                                                <Typography variant="caption" color={ollamaConfig.ollamaModels?.[model] ? 'success.main' : 'text.secondary'}>
                                                    {ollamaConfig.ollamaModels?.[model] ? 'Enabled' : 'Disabled'}
                                                </Typography>
                                            </Box>
                                            {ollamaConfig.defaultOllamaModel === model && (
                                                <Box sx={{ bgcolor: 'secondary.main', color: 'white', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                    DEFAULT
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant={ollamaConfig.defaultOllamaModel === model ? "contained" : "outlined"}
                                                color="secondary"
                                                disabled={!ollamaConfig.ollamaModels?.[model]}
                                                onClick={() => setOllamaConfig(prev => ({ ...prev, defaultOllamaModel: model }))}
                                                sx={{ fontSize: '0.7rem' }}
                                            >
                                                {ollamaConfig.defaultOllamaModel === model ? "Main" : "Set Main"}
                                            </Button>
                                            <Switch
                                                checked={!!ollamaConfig.ollamaModels?.[model]}
                                                onChange={() => toggleModel(model)}
                                                color="success"
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Alert severity="warning" sx={{ mb: 3 }}>No models detected. Ensure Ollama is running and accessible.</Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleSaveOllama}
                            disabled={savingOllama}
                            startIcon={savingOllama ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save Model Config
                        </Button>
                    </Box>
                </CardContent>
            </Card>

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
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Favicon URL" fullWidth value={branding.faviconUrl} onChange={(e) => setBranding(prev => ({ ...prev, faviconUrl: e.target.value }))} size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Apple Touch Icon" fullWidth value={branding.appleTouchIconUrl} onChange={(e) => setBranding(prev => ({ ...prev, appleTouchIconUrl: e.target.value }))} size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Android Icon 192px URL" fullWidth value={branding.androidIcon192Url} onChange={(e) => setBranding(prev => ({ ...prev, androidIcon192Url: e.target.value }))} size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
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

            {/* Backup Card - Oracle VM MySQL */}
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.main', borderRadius: 3 }}>
                <CardHeader
                    title="🔄 Database Backup"
                    titleTypographyProps={{ fontWeight: 'bold', color: 'error.main' }}
                    subheader="Backup Firebase data to Oracle VM (MySQL)"
                />
                <CardContent>
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Target:</strong> Oracle VM (129.151.245.242)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Database:</strong> truthlens_backup (MariaDB)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Schedule:</strong> Weekly (manual trigger available)
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                            setRunningBackup(true);
                            try {
                                const token = await (window as any).firebase?.auth?.()?.currentUser?.getIdToken?.();
                                const res = await axios.post('/api/admin/backup', {}, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                setMsg({ type: 'success', text: `Backup completed! ${res.data.recordsBackedUp} records saved.` });
                            } catch (e: any) {
                                setMsg({ type: 'error', text: e.response?.data?.error || 'Backup failed' });
                            } finally {
                                setRunningBackup(false);
                            }
                        }}
                        disabled={runningBackup}
                        startIcon={runningBackup ? <CircularProgress size={16} color="inherit" /> : <CloudQueueIcon />}
                        fullWidth
                    >
                        {runningBackup ? 'Running Backup...' : 'Run Backup Now'}
                    </Button>
                </CardContent>
            </Card>

            <Snackbar
                open={!!msg.text}
                autoHideDuration={6000}
                onClose={() => setMsg({ type: '', text: '' })}
            >
                <Alert severity={msg.type as any} sx={{ width: '100%' }}>
                    {msg.text}
                </Alert>
            </Snackbar>

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
