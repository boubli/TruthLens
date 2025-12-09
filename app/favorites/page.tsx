'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, IconButton, Paper, Box, Avatar, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getFavorites, removeFromFavorites, FavoriteItem } from '@/services/favoriteService';
import PageTransition from '@/components/animation/PageTransition';
import StaggerList, { StaggerItem } from '@/components/animation/StaggerList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';

export default function FavoritesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadFavorites();
        } else if (!loading) { // If auth loaded and no user
            router.push('/login');
        }
    }, [user]);

    const loadFavorites = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getFavorites(user.uid);
            setFavorites(data);
        } catch (error) {
            console.error('Failed to load favorites', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!user) return;
        try {
            await removeFromFavorites(user.uid, id);
            setFavorites(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            // console.error(error);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <PageTransition>
            <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                    <IconButton onClick={() => router.back()}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" fontWeight="bold">My Favorites</Typography>
                </Box>

                {favorites.length > 0 ? (
                    <StaggerList>
                        {favorites.map((item) => (
                            <StaggerItem key={item.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            transform: 'translateY(-2px)',
                                            boxShadow: 4
                                        }
                                    }}
                                    onClick={() => router.push(`/product/${item.id}`)}
                                >
                                    <Avatar
                                        src={item.image}
                                        variant="rounded"
                                        sx={{ width: 60, height: 60, bgcolor: 'action.hover' }}
                                    >
                                        {item.name.charAt(0)}
                                    </Avatar>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {item.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.brand}
                                        </Typography>
                                    </Box>

                                    <IconButton
                                        color="error"
                                        onClick={(e) => handleRemove(e, item.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Paper>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                ) : (
                    <EmptyState
                        icon={<FavoriteIcon sx={{ fontSize: 60, color: 'text.disabled' }} />}
                        title="No favorites yet"
                        description="Save products you love to easily find them later."
                        actionLabel="Scan Products"
                        onAction={() => router.push('/scan')}
                        secondaryActionLabel="Search Manually"
                        onSecondaryAction={() => router.push('/')}
                    />
                )}
            </Container>
        </PageTransition>
    );
}
