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
        gemini: ''
    });
    const [originalKeys, setOriginalKeys] = useState<Record<AIProvider, string>>({
        groq: '',
        gemini: ''
    });
    const [showKey, setShowKey] = useState<Record<AIProvider, boolean>>({
        groq: false,
        gemini: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState<AIProvider | null>(null);

    // Only show for Free/Plus users
    const showManager = isFree || isPlus;

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
                gemini: keys.gemini || ''
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

    if (!showManager) {
        return (
            <Box
                component={motion.div}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#10B981' }} />
                    <Typography fontWeight="bold" color="success.main">
                        Premium Access Active
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    As a {tier === 'ultimate' ? 'Ultimate' : 'Pro'} member, you have full access to AI Chat using our platform API keys.
                </Typography>
            </Box>
        );
    }

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
                Select your preferred AI provider and add your API key to use AI Chat.
                {' '}
                <Typography component="span" color="warning.main" fontWeight="medium">
                    Upgrade to Pro for unlimited access without your own key!
                </Typography>
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
                        '& .MuiToggleButton-root': {
                            py: 1.5,
                            borderRadius: 2,
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{AI_PROVIDERS[provider].icon}</span>
                                <span>{AI_PROVIDERS[provider].name}</span>
                                {hasExistingKey(provider) && (
                                    <Chip
                                        label="Saved"
                                        size="small"
                                        color="success"
                                        sx={{
                                            ml: 0.5,
                                            height: 20,
                                            fontSize: '0.7rem',
                                            '& .MuiChip-label': { px: 1 }
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
                        borderColor: hasExistingKey(selectedProvider) ? 'success.main' : 'divider'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <span style={{ fontSize: 24 }}>{AI_PROVIDERS[selectedProvider].icon}</span>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {AI_PROVIDERS[selectedProvider].name} API Key
                        </Typography>
                        {hasExistingKey(selectedProvider) && (
                            <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                                label="Configured"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ ml: 'auto' }}
                            />
                        )}
                    </Box>

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
                                href={selectedProvider === 'groq' ? 'https://console.groq.com/keys' : 'https://aistudio.google.com/app/apikey'}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: AI_PROVIDERS[selectedProvider].color }}
                            >
                                {selectedProvider === 'groq' ? 'Groq Console' : 'Google AI Studio'}
                            </a>
                        </Typography>
                    </Box>
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
