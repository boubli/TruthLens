'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogContent, Button, Typography, Box,
    TextField, LinearProgress, Avatar, IconButton, Paper, Slide
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/context/AuthContext';
import { extractDietaryEntities } from '@/services/aiService';
import { updateDietaryPreferences } from '@/services/subscriptionService';
import { DietaryPreferences } from '@/types/user';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: number;
    text: string;
    sender: 'ai' | 'user';
}

interface AiPreferenceOnboardingProps {
    open: boolean;
    onClose: () => void;
}

export default function AiPreferenceOnboarding({ open, onClose }: AiPreferenceOnboardingProps) {
    const { user, refreshProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [tempPreferences, setTempPreferences] = useState<Partial<DietaryPreferences>>({
        allergens: [],
        avoidIngredients: [],
        healthGoals: []
    });

    const STEPS = [
        { id: 1, type: 'open', question: "" }, // Placeholder, set dynamically
        { id: 2, type: 'yesno', key: 'isKeto', question: 'Are you following a Keto diet?' },
        { id: 3, type: 'yesno', key: 'isVegan', question: 'Are you vegan?' },
        { id: 4, type: 'yesno', key: 'isDiabetic', question: 'Do you have diabetes or need to monitor sugar intake?' },
        { id: 5, type: 'yesno', key: 'lowSodium', question: 'Are you watching your sodium intake?' },
        { id: 6, type: 'yesno', key: 'glutenFree', question: 'Do you need to avoid gluten?' },
        { id: 7, type: 'options', key: 'goals', question: 'What is your primary health goal?', options: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'More Energy'] },
        { id: 8, type: 'yesno', key: 'organic', question: 'Do you prefer organic products regardless of price?' },
        { id: 9, type: 'yesno', key: 'palmOil', question: 'Do you want to avoid Palm Oil?' },
        { id: 10, type: 'text', question: 'Anything else you want to tell me about your diet?' }
    ];

    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Initial Greeting
    useEffect(() => {
        if (open && messages.length === 0) {
            const userName = user?.displayName?.split(' ')[0] || 'there';
            const initialQuestion = `Hi ${userName}! I'm NutriGrade AI. Let's set up your dietary profile together.`;
            addMessage(initialQuestion, 'ai');
        }
    }, [open, user]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const addMessage = (text: string, sender: 'ai' | 'user') => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender }]);
    };

    const handleSend = async () => {
        if (!input.trim() && STEPS[currentStep].type !== 'open') return;

        const userText = input;
        addMessage(userText, 'user');
        setInput('');
        setLoading(true);

        await processStep(currentStep, userText);
        setLoading(false);
    };

    const handleOptionClick = async (option: string) => {
        addMessage(option, 'user');
        setLoading(true);
        await processStep(currentStep, option);
        setLoading(false);
    };

    const processStep = async (stepIndex: number, answer: string) => {
        const step = STEPS[stepIndex];

        // 1. Logic for Specific Steps
        if (step.id === 1) {
            const extraction = await extractDietaryEntities(answer);
            setTempPreferences(prev => ({
                ...prev,
                allergens: [...(prev.allergens || []), ...extraction.allergens],
                avoidIngredients: [...(prev.avoidIngredients || []), ...extraction.avoidIngredients],
            }));
        } else if (step.type === 'yesno') {
            if (step.key && ['isKeto', 'isVegan', 'isDiabetic', 'lowSodium', 'glutenFree'].includes(step.key)) {
                // @ts-ignore
                setTempPreferences(prev => ({ ...prev, [step.key]: ['Yes'].includes(answer) }));
            }
            if (['Yes'].includes(answer) && step.key === 'palmOil') {
                setTempPreferences(prev => ({ ...prev, avoidIngredients: [...(prev.avoidIngredients || []), "Palm Oil"] }));
            }
        } else if (step.id === 7) {
            setTempPreferences(prev => ({ ...prev, healthGoals: [...(prev.healthGoals || []), answer] }));
        }

        // 2. Move to Next Step
        const nextStep = stepIndex + 1;
        if (nextStep < STEPS.length) {
            setTimeout(() => {
                setCurrentStep(nextStep);
                addMessage(STEPS[nextStep].question, 'ai');
            }, 800); // Slightly longer delay for "thinking" feel
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        addMessage('Great! I have updated your profile. You can change these anytime in settings.', 'ai');

        if (user) {
            try {
                await updateDietaryPreferences(user.uid, tempPreferences as DietaryPreferences);
                await setDoc(doc(db, 'users', user.uid, 'pro_features', 'preferences_ai_suggestion'), {
                    ...tempPreferences,
                    chatHistory: messages.map(m => ({ sender: m.sender, text: m.text })),
                    completedAt: serverTimestamp()
                });

                await refreshProfile();
                setTimeout(() => {
                    onClose();
                    setMessages([]);
                    setCurrentStep(0);
                }, 2000);
            } catch (e) {
                console.error("Error saving preferences:", e);
                addMessage("Oops, something went wrong saving your data.", 'ai');
            }
        }
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 5,
                    height: '650px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }
            }}
            TransitionComponent={Slide}
            TransitionProps={{ direction: 'up' } as any}
        >
            {/* Header */}
            <Box sx={{
                p: 3,
                background: 'linear-gradient(135deg, #00C853 0%, #009624 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <Avatar sx={{ bgcolor: 'white', color: '#00C853', width: 48, height: 48 }}>
                    <SmartToyIcon fontSize="large" />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: 0.5 }}>
                        NutriGrade AI
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                        Smart Diet Consultant
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 4,
                    bgcolor: 'rgba(0, 200, 83, 0.1)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#00C853' }
                }}
            />

            {/* Chat Area */}
            <DialogContent sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 3,
                bgcolor: '#F3F4F6',
                overflowY: 'auto'
            }}>
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                display: 'flex',
                                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: 12
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', maxWidth: '85%' }}>
                                {msg.sender === 'ai' && (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#00C853', mt: 0.5 }}>
                                        <SmartToyIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                )}
                                <Paper
                                    elevation={msg.sender === 'user' ? 4 : 1}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        bgcolor: msg.sender === 'user' ? '#00C853' : 'white',
                                        color: msg.sender === 'user' ? 'white' : 'text.primary',
                                        borderTopLeftRadius: msg.sender === 'ai' ? 4 : 20,
                                        borderTopRightRadius: msg.sender === 'user' ? 4 : 20,
                                        boxShadow: msg.sender === 'user'
                                            ? '0 4px 6px -1px rgba(0, 200, 83, 0.3)'
                                            : '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
                                        position: 'relative'
                                    }}
                                >
                                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>{msg.text}</Typography>
                                </Paper>
                            </Box>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#00C853' }}>
                                <SmartToyIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'white', borderTopLeftRadius: 4 }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {[0, 1, 2].map(i => (
                                        <Box
                                            key={i}
                                            component={motion.div}
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                            sx={{ width: 8, height: 8, bgcolor: '#00C853', borderRadius: '50%' }}
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Box>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </DialogContent>

            {/* Input Area */}
            <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid #E5E7EB' }}>
                {/* Contextual Inputs */}
                {STEPS[currentStep]?.type === 'yesno' && !loading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => handleOptionClick('Yes')}
                                sx={{
                                    borderColor: '#00C853',
                                    color: '#00C853',
                                    borderRadius: 3,
                                    px: 4,
                                    '&:hover': { bgcolor: '#E8F5E9', borderColor: '#00C853' }
                                }}
                            >
                                {'Yes'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => handleOptionClick('No')}
                                sx={{
                                    borderColor: '#EF4444',
                                    color: '#EF4444',
                                    borderRadius: 3,
                                    px: 4,
                                    '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' }
                                }}
                            >
                                {'No'}
                            </Button>
                        </Box>
                    </motion.div>
                )}

                {STEPS[currentStep]?.type === 'options' && !loading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {STEPS[currentStep].options?.map(opt => (
                                <Button
                                    key={opt}
                                    variant="outlined"
                                    onClick={() => handleOptionClick(opt)}
                                    sx={{
                                        borderColor: '#00C853',
                                        color: '#00C853',
                                        borderRadius: 5,
                                        '&:hover': { bgcolor: '#00C853', color: 'white' }
                                    }}
                                >
                                    {opt}
                                </Button>
                            ))}
                        </Box>
                    </motion.div>
                )}

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                        fullWidth
                        placeholder={'Type your answer...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading || STEPS[currentStep]?.type === 'yesno' || STEPS[currentStep]?.type === 'options'}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                '&.Mui-focused fieldset': { borderColor: '#00C853' }
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={loading}
                        sx={{
                            bgcolor: '#00C853',
                            borderRadius: 2,
                            minWidth: 50,
                            boxShadow: '0 4px 6px -1px rgba(0, 200, 83, 0.4)',
                            '&:hover': { bgcolor: '#009624' }
                        }}
                    >
                        <SendIcon />
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}
