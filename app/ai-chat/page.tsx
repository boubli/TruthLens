'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    IconButton,
    Avatar,
    Button,
    CircularProgress,
    Collapse
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sendAIChatMessage, getUserApiKeys, requiresOwnKey } from '@/services/aiChatService';
import { AIChatMessage, AIChatError, AIProvider, AILanguage, AI_PROVIDERS } from '@/types/aiChat';
import ApiKeyManager from '@/components/settings/ApiKeyManager';
import AIChatSettings from '@/components/settings/AIChatSettings';
import ChatErrorCard from '@/components/chat/ChatErrorCard';
import { generateChatSuggestions } from '@/app/actions';

export default function AIChatPage() {
    const router = useRouter();
    const { user, tier, loading: authLoading, isFree, isPlus, features } = useAuth();

    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AIChatError | null>(null);
    const [provider, setProvider] = useState<AIProvider>('ollama'); // Default safe initial state
    const [language, setLanguage] = useState<AILanguage>('en');
    const [showSettings, setShowSettings] = useState(false);
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Check if user has API key and load preferences
    useEffect(() => {
        const loadPreferences = async () => {
            if (user) {
                const keys = await getUserApiKeys(user.uid);
                const savedProvider = keys.preferredProvider;
                const savedLanguage = keys.preferredLanguage || 'en';

                setLanguage(savedLanguage);

                // Set Provider Logic
                if (savedProvider) {
                    setProvider(savedProvider);
                } else {
                    // Smart Defaults
                    if (requiresOwnKey(tier)) {
                        // Free/Plus -> Default to Azure AI (Ollama) as it's free
                        setProvider('ollama');
                    } else {
                        // Pro/Ultimate -> Default to Groq (Fastest)
                        setProvider('groq');
                    }
                }

                // Check API Key
                // For Pro/Ultimate (not requiresOwnKey), they always have access via platform keys
                // For Free/Plus (requiresOwnKey), check if they have key for CURRENT provider
                if (requiresOwnKey(tier)) {
                    // Azure AI (Ollama) is free for everyone
                    if ((savedProvider || 'ollama') === 'ollama') {
                        setHasApiKey(true);
                    } else {
                        // Check specific key
                        const currentProvider = savedProvider || 'ollama';
                        setHasApiKey(!!keys[currentProvider]);
                    }
                } else {
                    setHasApiKey(true);
                }
            }
        };
        loadPreferences();
    }, [user, tier]);

    // Load AI-generated suggestions
    useEffect(() => {
        const loadSuggestions = async () => {
            const aiSuggestions = await generateChatSuggestions();
            setSuggestions(aiSuggestions);
        };
        loadSuggestions();
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading || !user) return;

        const userMessage: AIChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            // Build conversation history
            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await sendAIChatMessage(
                user.uid,
                tier,
                userMessage.content,
                provider,
                history,
                language
            );

            const assistantMessage: AIChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err: any) {
            console.error('Chat error:', err);
            setError(err as AIChatError);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleApiKeysSaved = async () => {
        if (user) {
            const keys = await getUserApiKeys(user.uid);
            // Re-check key status for current provider
            if (provider === 'ollama' || !requiresOwnKey(tier)) {
                setHasApiKey(true);
            } else {
                setHasApiKey(!!keys[provider]);
            }
            setShowSettings(false);
            setError(null);
        }
    };

    if (authLoading || !user) {
        return (
            <Box className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <CircularProgress />
            </Box>
        );
    }

    // Feature gate - AI Chat access check
    if (!features.aiChat) {
        return (
            <Box className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Container maxWidth="sm">
                    <Paper sx={{ p: 5, borderRadius: 4, textAlign: 'center' }}>
                        <SmartToyIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Premium Feature</Typography>
                        <Typography color="text.secondary" paragraph>
                            AI Chat is available for Plus, Pro, and Ultimate members.
                        </Typography>
                        <Button variant="contained" color="warning" href="/upgrade">
                            Upgrade Now
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

    // Show settings panel if user needs to add API key
    const needsKeySetup = requiresOwnKey(tier) && !hasApiKey;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    py: 2,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backdropFilter: 'blur(10px)',
                    bgcolor: 'rgba(var(--background-paper-rgb), 0.9)'
                }}
            >
                <Container maxWidth="md" disableGutters>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton onClick={() => router.back()}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        background: 'linear-gradient(135deg, #9333EA 0%, #6366F1 100%)'
                                    }}
                                >
                                    <SmartToyIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        TruthLens AI
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {AI_PROVIDERS[provider].icon} Using {AI_PROVIDERS[provider].name}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <IconButton
                            onClick={() => setShowSettings(!showSettings)}
                            sx={{
                                bgcolor: showSettings ? 'primary.main' : 'action.hover',
                                color: showSettings ? 'white' : 'inherit',
                                '&:hover': {
                                    bgcolor: showSettings ? 'primary.dark' : 'action.selected'
                                }
                            }}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Box>
                </Container>
            </Paper>

            {/* Settings Panel */}
            <Collapse in={showSettings || needsKeySetup}>
                <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Container maxWidth="md" sx={{ py: 3 }}>
                        <ApiKeyManager onKeysSaved={handleApiKeysSaved} />
                        <Box sx={{ mt: 3 }}>
                            <AIChatSettings onSettingsChanged={() => {
                                // Reload preferences when settings change
                                if (user) {
                                    getUserApiKeys(user.uid).then(keys => {
                                        setProvider(keys.preferredProvider || 'groq');
                                        setLanguage(keys.preferredLanguage || 'en');
                                    });
                                }
                            }} />
                        </Box>
                    </Container>
                </Box>
            </Collapse>

            {/* Messages Container */}
            <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
                <Container maxWidth="md">
                    {/* Welcome Message */}
                    {messages.length === 0 && !needsKeySetup && (
                        <Box
                            component={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            sx={{
                                textAlign: 'center',
                                py: 8
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    mx: 'auto',
                                    mb: 3,
                                    background: 'linear-gradient(135deg, #9333EA 0%, #6366F1 100%)'
                                }}
                            >
                                <SmartToyIcon sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Hi! I'm TruthLens AI
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                                Ask me anything about food, nutrition, ingredients, or health. I'm here to help you make smarter choices!
                            </Typography>

                            {/* Quick Suggestions */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 4 }}>
                                {suggestions.map((suggestion) => (
                                    <Button
                                        key={suggestion}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setInput(suggestion);
                                            inputRef.current?.focus();
                                        }}
                                        sx={{
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            borderColor: 'divider',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'rgba(108, 99, 255, 0.05)'
                                            }
                                        }}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Chat Messages */}
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <Box
                                component={motion.div}
                                key={message.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    mb: 2,
                                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        bgcolor: message.role === 'user' ? 'primary.main' : 'transparent',
                                        background: message.role === 'assistant'
                                            ? 'linear-gradient(135deg, #9333EA 0%, #6366F1 100%)'
                                            : undefined
                                    }}
                                >
                                    {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                                </Avatar>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        maxWidth: '75%',
                                        borderRadius: 3,
                                        bgcolor: message.role === 'user'
                                            ? 'primary.main'
                                            : 'background.paper',
                                        color: message.role === 'user' ? 'white' : 'text.primary',
                                        border: message.role === 'assistant' ? '1px solid' : 'none',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {message.content}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {loading && (
                        <Box
                            component={motion.div}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            sx={{ display: 'flex', gap: 2, mb: 2 }}
                        >
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    background: 'linear-gradient(135deg, #9333EA 0%, #6366F1 100%)'
                                }}
                            >
                                <SmartToyIcon />
                            </Avatar>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {[0, 1, 2].map((i) => (
                                        <Box
                                            key={i}
                                            component={motion.div}
                                            animate={{
                                                y: [0, -6, 0]
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                repeat: Infinity,
                                                delay: i * 0.15
                                            }}
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: 'text.secondary'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Box>
                    )}

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <ChatErrorCard
                                error={error}
                                onOpenSettings={() => setShowSettings(true)}
                                onRetry={() => {
                                    setError(null);
                                    // Retry last message if exists
                                    if (messages.length > 0) {
                                        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
                                        if (lastUserMessage) {
                                            setInput(lastUserMessage.content);
                                        }
                                    }
                                }}
                                onDismiss={() => setError(null)}
                            />
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </Container>
            </Box>

            {/* Input Area */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    bottom: 0,
                    bgcolor: 'background.paper'
                }}
            >
                <Container maxWidth="md" disableGutters>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={4}
                            placeholder={needsKeySetup ? 'Add your API key above to start chatting...' : 'Ask me anything about food & nutrition...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={loading || needsKeySetup}
                            inputRef={inputRef}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: 'background.default'
                                }
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={!input.trim() || loading || needsKeySetup}
                            sx={{
                                width: 48,
                                height: 48,
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'primary.dark'
                                },
                                '&:disabled': {
                                    bgcolor: 'action.disabledBackground',
                                    color: 'action.disabled'
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                        </IconButton>
                    </Box>
                </Container>
            </Paper>
        </Box>
    );
}
