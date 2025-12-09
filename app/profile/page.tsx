'use client';

import React, { useState } from 'react';
import {
    Box, Button, Container, Typography, Paper, Avatar, Grid, Divider, CircularProgress, Chip,
    Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Autocomplete
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Badge } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { updateDietaryPreferences } from '@/services/subscriptionService';
import { updateUserProfile, updateUserPassword } from '@/services/userService';
import { DietaryPreferences } from '@/types/user';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/animation/PageTransition';
import ScrollReveal from '@/components/animation/ScrollReveal';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AiPreferenceOnboarding from '@/components/features/AiPreferenceOnboarding';
import ThemeSelector from '@/components/theme/ThemeSelector';
import DietaryPreferencesSection from '@/components/user/DietaryPreferencesSection';
import TierBadge from '@/components/subscription/TierBadge';
import ApiKeyManager from '@/components/settings/ApiKeyManager';

export default function ProfilePage() {
    const { user, userProfile, loading, logout, isPro, isFree, tier, refreshProfile, dietaryPreferences } = useAuth();
    const router = useRouter();
    const [savingPreferences, setSavingPreferences] = useState(false);
    const [preferences, setPreferences] = useState<DietaryPreferences>(dietaryPreferences);

    // Edit Profile State
    const [openEditProfile, setOpenEditProfile] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [newPhoto, setNewPhoto] = useState(user?.photoURL || '');
    const [savingProfile, setSavingProfile] = useState(false);

    // Change Password State
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    // AI Onboarding State
    const [openAiOnboarding, setOpenAiOnboarding] = useState(false);

    if (loading) return <LoadingSpinner fullScreen />;

    if (!user) {
        router.push('/login');
        return null;
    }

    // --- Handlers ---

    const handlePreferenceChange = (key: keyof DietaryPreferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSavePreferences = async () => {
        if (!user || !isPro) return;
        setSavingPreferences(true);
        try {
            await updateDietaryPreferences(user.uid, preferences);
            await refreshProfile();
            alert('Dietary preferences saved successfully!');
        } catch (error) {
            alert('Failed to save preferences');
        } finally {
            setSavingPreferences(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setSavingProfile(true);
        const result = await updateUserProfile(user, newName, newPhoto);
        if (result.success) {
            await refreshProfile();
            setOpenEditProfile(false);
        } else {
            alert('Failed to update profile: ' + result.error);
        }
        setSavingProfile(false);
    };

    const handleChangePassword = async () => {
        if (!user) return;
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        setSavingPassword(true);
        setPasswordError('');
        const result = await updateUserPassword(user, newPassword);
        if (result.success) {
            alert('Password updated successfully!');
            setOpenChangePassword(false);
            setNewPassword('');
            setConfirmPassword('');
        } else {
            if (result.code === 'auth/requires-recent-login') {
                alert('For security, please sign out and sign in again to change your password.');
            } else {
                setPasswordError(result.error || 'Failed to update password');
            }
        }
        setSavingPassword(false);
    };

    return (
        <PageTransition>
            <Container maxWidth="md" sx={{ mt: 5, mb: 4 }}>
                <Box sx={{ mb: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/')}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                    >
                        Back to Home
                    </Button>
                </Box>
                <ScrollReveal>
                    <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            textAlign: { xs: 'center', sm: 'left' },
                            gap: 3,
                            mb: 4
                        }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    isPro ? (
                                        <VerifiedIcon
                                            color="primary"
                                            sx={{
                                                fontSize: 32,
                                                bgcolor: 'background.paper',
                                                borderRadius: '50%',
                                                border: '2px solid background.paper'
                                            }}
                                        />
                                    ) : null
                                }
                            >
                                <Avatar src={user.photoURL || '/icons/icon-192x192.png'} sx={{ width: 80, height: 80 }}>
                                    {!user.photoURL && <PersonIcon sx={{ fontSize: 50, opacity: 0 }} />}
                                </Avatar>
                            </Badge>

                            <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
                                <Typography variant="h4" fontWeight="bold">{user.displayName || 'User'}</Typography>
                                <Typography variant="body1" color="text.secondary">{user.email}</Typography>
                                {!user.emailVerified && <Typography variant="caption" color="warning.main">Email not verified</Typography>}
                            </Box>

                            <TierBadge tier={tier} size="medium" sx={{ fontSize: '1rem', py: 2, px: 2 }} />
                        </Box>

                        <Divider sx={{ mb: 4 }} />

                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 12 }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">Account Settings</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <AnimatedButton
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => {
                                            setNewName(user.displayName || '');
                                            setNewPhoto(user.photoURL || '');
                                            setOpenEditProfile(true);
                                        }}
                                    >
                                        Update Profile
                                    </AnimatedButton>
                                    <AnimatedButton
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => setOpenChangePassword(true)}
                                    >
                                        Change Password
                                    </AnimatedButton>
                                    <AnimatedButton variant="contained" color="error" onClick={logout}>Sign Out</AnimatedButton>
                                    {!isFree && (
                                        <Button
                                            variant="text"
                                            color="error"
                                            size="small"
                                            onClick={() => router.push('/cancel-membership')}
                                            sx={{ mt: 1, textDecoration: 'underline', fontSize: '0.8rem' }}
                                        >
                                            Cancel Membership
                                        </Button>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </ScrollReveal>

                {/* Appearance Section - Theme Settings */}
                <ScrollReveal>
                    <Box sx={{ mt: 4 }}>
                        <ThemeSelector />
                    </Box>
                </ScrollReveal>

                {/* AI Settings Section - For Free/Plus users */}
                {(isFree || tier === 'plus') && (
                    <ScrollReveal>
                        <Paper sx={{ p: 4, mt: 4, borderRadius: 4 }}>
                            <ApiKeyManager />
                        </Paper>
                    </ScrollReveal>
                )}

                {isPro && (
                    <ScrollReveal>
                        <Box sx={{ mt: 4 }}>
                            <DietaryPreferencesSection
                                preferences={preferences}
                                onChange={handlePreferenceChange}
                                onUpdateGranular={(key: keyof DietaryPreferences, value: string[]) => setPreferences({ ...preferences, [key]: value })}
                                onSave={handleSavePreferences}
                                onAiSetup={() => setOpenAiOnboarding(true)}
                                isSaving={savingPreferences}
                            />
                        </Box>
                    </ScrollReveal>
                )}

                {/* --- Dialogs --- */}

                {/* Edit Profile Dialog */}
                <Dialog open={openEditProfile} onClose={() => setOpenEditProfile(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Edit Profile
                        <IconButton onClick={() => setOpenEditProfile(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                label="Display Name"
                                fullWidth
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <TextField
                                label="Photo URL"
                                fullWidth
                                value={newPhoto}
                                onChange={(e) => setNewPhoto(e.target.value)}
                                helperText="Link to an image file"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenEditProfile(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleUpdateProfile}
                            disabled={savingProfile}
                        >
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Change Password Dialog */}
                <Dialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Change Password
                        <IconButton onClick={() => setOpenChangePassword(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            {passwordError && <Alert severity="error">{passwordError}</Alert>}
                            <TextField
                                label="New Password"
                                type="password"
                                fullWidth
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <TextField
                                label="Confirm New Password"
                                type="password"
                                fullWidth
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenChangePassword(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleChangePassword}
                            disabled={savingPassword}
                        >
                            {savingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* AI Onboarding Dialog (Pro Only) */}
                <AiPreferenceOnboarding open={openAiOnboarding} onClose={() => setOpenAiOnboarding(false)} />

            </Container>
            <Footer />
        </PageTransition>
    );
}
