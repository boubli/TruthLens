'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    InputAdornment,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Paper,
    Collapse,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Chip
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyIcon from '@mui/icons-material/Key';
import WarningIcon from '@mui/icons-material/Warning';
import { motion, AnimatePresence } from 'framer-motion';
import { AIProvider, AI_PROVIDERS } from '@/types/aiChat';
import { getUserApiKeys, saveUserApiKey, savePreferredProvider, deleteUserApiKey } from '@/services/aiChatService';
import { useAuth } from '@/context/AuthContext';

interface ApiKeyManagerProps {
    onKeysSaved?: () => void;
    onKeysDeleted?: () => void;
    compact?: boolean;
}

export default function ApiKeyManager({ onKeysSaved, onKeysDeleted, compact = false }: ApiKeyManagerProps) {
    const { user, tier, isFree, isPlus } = useAuth();

    const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
    const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
        groq: '',
        gemini: '',
        ollama: '',
        deepseek: ''
    });
    const [originalKeys, setOriginalKeys] = useState<Record<AIProvider, string>>({
        groq: '',
        gemini: '',
        ollama: '',
        deepseek: ''
    });
    const [showKey, setShowKey] = useState<Record<AIProvider, boolean>>({
        groq: false,
        gemini: false,
        ollama: false,
        deepseek: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState<AIProvider | null>(null);

    // Show for everyone so Pro users can switch providers
    const showManager = true;

    useEffect(() => {
        if (user && showManager) {
            loadUserKeys();
        } else {
            setLoading(false);
        }
    }, [user, showManager]);

    const loadUserKeys = async () => {
        if (!user) return;
        try {
            const keys = await getUserApiKeys(user.uid);
            const loadedKeys = {
                groq: keys.groq || '',
                gemini: keys.gemini || '',
                ollama: '', // Self-hosted
                deepseek: keys.deepseek || ''
            };
            setApiKeys(loadedKeys);
            setOriginalKeys(loadedKeys);
            if (keys.preferredProvider) {
                setSelectedProvider(keys.preferredProvider);
            }
        } catch (error) {
            console.error('Failed to load API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderChange = async (_: React.MouseEvent<HTMLElement>, newProvider: AIProvider | null) => {
        if (newProvider && user) {
            setSelectedProvider(newProvider);
            try {
                await savePreferredProvider(user.uid, newProvider);
            } catch (error) {
                console.error('Failed to save preferred provider:', error);
            }
        }
    };

    const handleSave = async (provider: AIProvider) => {
        if (!user) return;

        setSaving(true);
        setMessage(null);

        try {
            await saveUserApiKey(user.uid, provider, apiKeys[provider]);
            setOriginalKeys(prev => ({ ...prev, [provider]: apiKeys[provider] }));
            setMessage({ type: 'success', text: `${AI_PROVIDERS[provider].name} API key saved successfully!` });
            onKeysSaved?.();
        } catch (error) {
            console.error('Failed to save API key:', error);
            setMessage({ type: 'error', text: 'Failed to save API key. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const openDeleteDialog = (provider: AIProvider) => {
        setProviderToDelete(provider);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!user || !providerToDelete) return;

        setDeleting(true);
        setMessage(null);

        try {
            await deleteUserApiKey(user.uid, providerToDelete);
            setApiKeys(prev => ({ ...prev, [providerToDelete]: '' }));
            setOriginalKeys(prev => ({ ...prev, [providerToDelete]: '' }));
            setMessage({
                type: 'warning',
                text: `${AI_PROVIDERS[providerToDelete].name} API key deleted successfully.`
            });
            onKeysDeleted?.();
        } catch (error) {
            console.error('Failed to delete API key:', error);
            setMessage({ type: 'error', text: 'Failed to delete API key. Please try again.' });
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setProviderToDelete(null);
        }
    };

    // Check if key has been modified
    const hasKeyChanged = (provider: AIProvider) => {
        return apiKeys[provider] !== originalKeys[provider];
    };

    // Check if key exists in Firebase
    const hasExistingKey = (provider: AIProvider) => {
        return !!originalKeys[provider];
    };

    // Determine if user needs to provide their own key for selected provider
    const needsOwnKey = (
        (isFree || isPlus) &&
        selectedProvider !== 'ollama' // Ollama is free for everyone
    );

    // If Pro/Ultimate and using platform key, keep text inputs hidden or disabled
    const isUsingPlatformKey = !needsOwnKey && selectedProvider !== 'ollama';

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <KeyIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                    AI Provider Settings
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select your preferred AI provider.
                {isFree || isPlus ? (
                    <>
                        {' '}You can use Azure AI for free, or add your own key for other providers.
                        <Typography component="span" color="warning.main" fontWeight="medium" sx={{ display: 'block', mt: 0.5 }}>
                            Upgrade to Pro for unlimited access without your own key!
                        </Typography>
                    </>
                ) : (
                    " You have full access to all providers included in your plan."
                )}
            </Typography>

            {/* Provider Selection with Status */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Select Provider
                </Typography>
                <ToggleButtonGroup
                    value={selectedProvider}
                    exclusive
                    onChange={handleProviderChange}
                    fullWidth
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, // Grid layout to fit 4 items
                        gap: 1,
                        '& .MuiToggleButton-root': {
                            border: '1px solid rgba(0, 0, 0, 0.12) !important', // Force border
                            py: 1.5,
                            borderRadius: '8px !important', // Force rounded corners
                            textTransform: 'none',
                            fontWeight: 600,
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'primary.dark'
                                }
                            }
                        }
                    }}
                >
                    {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((provider) => (
                        <ToggleButton key={provider} value={provider}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                <span style={{ fontSize: '1.2rem' }}>{AI_PROVIDERS[provider].icon}</span>
                                <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{AI_PROVIDERS[provider].name.split(' ')[0]}</span>
                                {(hasExistingKey(provider) && (isFree || isPlus) && provider !== 'ollama') && (
                                    <Box
                                        sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor: 'success.main',
                                            position: 'absolute',
                                            top: 6,
                                            right: 6
                                        }}
                                    />
                                )}
                            </Box>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {/* API Key Input for Selected Provider */}
            <AnimatePresence mode="wait">
                <Paper
                    component={motion.div}
                    key={selectedProvider}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: hasExistingKey(selectedProvider) || isUsingPlatformKey || selectedProvider === 'ollama' ? 'success.main' : 'divider'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <span style={{ fontSize: 24 }}>{AI_PROVIDERS[selectedProvider].icon}</span>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {AI_PROVIDERS[selectedProvider].name}
                        </Typography>
                        {(hasExistingKey(selectedProvider) || isUsingPlatformKey || selectedProvider === 'ollama') && (
                            <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                                label={isUsingPlatformKey ? "Included in Plan" : selectedProvider === 'ollama' ? "Free Access" : "Configured"}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ ml: 'auto' }}
                            />
                        )}
                    </Box>

                    {/* Show Key Input ONLY if user needs to provide their own key */}
                    {needsOwnKey ? (
                        <>
                            <TextField
                                fullWidth
                                type={showKey[selectedProvider] ? 'text' : 'password'}
                                placeholder={hasExistingKey(selectedProvider)
                                    ? 'Enter new key to update or leave empty to keep current'
                                    : `Enter your ${AI_PROVIDERS[selectedProvider].name} API key`
                                }
                                value={apiKeys[selectedProvider]}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, [selectedProvider]: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowKey(prev => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
                                                edge="end"
                                            >
                                                {showKey[selectedProvider] ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ mb: 2 }}
                            />

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                    onClick={() => handleSave(selectedProvider)}
                                    disabled={saving || !apiKeys[selectedProvider] || !hasKeyChanged(selectedProvider)}
                                    sx={{ minWidth: 120 }}
                                >
                                    {saving ? 'Saving...' : hasExistingKey(selectedProvider) ? 'Update Key' : 'Save Key'}
                                </Button>

                                {hasExistingKey(selectedProvider) && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => openDeleteDialog(selectedProvider)}
                                        disabled={deleting}
                                        sx={{ minWidth: 120 }}
                                    >
                                        Delete Key
                                    </Button>
                                )}

                                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                    Get your API key from{' '}
                                    <a
                                        href={selectedProvider === 'groq' ? 'https://console.groq.com/keys' : selectedProvider === 'deepseek' ? 'https://platform.deepseek.com/' : 'https://aistudio.google.com/app/apikey'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: AI_PROVIDERS[selectedProvider].color }}
                                    >
                                        {selectedProvider === 'groq' ? 'Groq Console' : selectedProvider === 'deepseek' ? 'DeepSeek Platform' : 'Google AI Studio'}
                                    </a>
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        // Pro/Ultimate View or Free Ollama View
                        <Typography variant="body2" color="text.secondary">
                            {selectedProvider === 'ollama'
                                ? "This provider is free to use for all users. No API key required."
                                : "Your plan includes full access to this provider. No personal API key required."
                            }
                        </Typography>
                    )}
                </Paper>
            </AnimatePresence>

            {/* Status Message */}
            <Collapse in={!!message}>
                <Alert
                    severity={message?.type === 'warning' ? 'warning' : message?.type}
                    sx={{ mt: 2 }}
                    onClose={() => setMessage(null)}
                >
                    {message?.text}
                </Alert>
            </Collapse>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    Delete API Key?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete your{' '}
                        <strong>{providerToDelete ? AI_PROVIDERS[providerToDelete].name : ''}</strong>{' '}
                        API key? This action cannot be undone and you will need to add a new key to use AI Chat with this provider.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
