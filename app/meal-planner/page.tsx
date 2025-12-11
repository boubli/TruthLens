'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress, Chip, Divider } from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from '@/context/AuthContext';
import { createWeeklyMealPlan, getLatestMealPlan } from '@/services/mealPlannerService';
import { MealPlanDay } from '@/services/aiService';

export default function MealPlannerPage() {
    const { user, features } = useAuth();
    const [plan, setPlan] = useState<MealPlanDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Access check
    const hasAccess = features.mealPlanning;

    useEffect(() => {
        if (user && hasAccess) {
            loadPlan();
        } else {
            setLoading(false);
        }
    }, [user, hasAccess]);

    const loadPlan = async () => {
        setLoading(true);
        if (user) {
            const existing = await getLatestMealPlan(user.uid);
            if (existing) {
                setPlan(existing);
            }
        }
        setLoading(false);
    };

    const generateNewPlan = async () => {
        if (!user) return;
        setGenerating(true);
        try {
            const newPlan = await createWeeklyMealPlan(user.uid);
            setPlan(newPlan);
        } catch (e) {
            console.error(e);
        }
        setGenerating(false);
    };

    if (!user) return <Container sx={{ mt: 10 }}>Please log in.</Container>;

    // Premium feature gate
    if (!hasAccess) {
        return (
            <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
                <Paper sx={{ p: 5, borderRadius: 4 }}>
                    <RestaurantMenuIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h5" fontWeight="bold" gutterBottom>Premium Feature</Typography>
                    <Typography color="text.secondary" paragraph>
                        AI Meal Planning is available for Pro and Ultimate members.
                    </Typography>
                    <Button variant="contained" color="warning" href="/upgrade">
                        Upgrade Now
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RestaurantMenuIcon fontSize="large" color="primary" />
                        AI Meal Planner
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Personalized recipes based on your scan history.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                    onClick={generateNewPlan}
                    disabled={generating}
                >
                    {generating ? 'Chef AI is Cooking...' : 'Generate New Plan'}
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            ) : plan.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h6" gutterBottom>No meal plans yet.</Typography>
                    <Typography color="text.secondary" paragraph>
                        Our AI needs to see what foods you like! Scan some items and then generate a plan.
                    </Typography>
                    <Button variant="outlined" onClick={generateNewPlan}>Create My First Plan</Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {plan.map((day, index) => (
                        <Grid size={{ xs: 12, md: 4 }} key={index}>
                            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, bgcolor: 'primary.main' }} />
                                <Typography variant="h6" fontWeight="bold" gutterBottom>{day.day}</Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">BREAKFAST</Typography>
                                    <Typography variant="body2">{day.meals.breakfast}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">LUNCH</Typography>
                                    <Typography variant="body2">{day.meals.lunch}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">DINNER</Typography>
                                    <Typography variant="body2">{day.meals.dinner}</Typography>
                                </Box>

                                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                                    <Typography variant="caption" fontStyle="italic" color="text.secondary">
                                        💡 {day.nutritionalSummary}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}
