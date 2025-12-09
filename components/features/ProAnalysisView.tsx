'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, Paper, Collapse, CircularProgress,
    Divider, Chip, Avatar, useTheme, Grid, LinearProgress, Alert
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GavelIcon from '@mui/icons-material/Gavel';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import StarIcon from '@mui/icons-material/Star';
import { analyzeProductProMode } from '@/services/aiService';
import { useAuth } from '@/context/AuthContext';

interface ProAnalysisViewProps {
    productName: string;
    productBrand?: string;
}

interface AnalysisData {
    marketStatus: string;
    brandReputation: string;
    grading: {
        quality: { score: number; reason: string };
        value: { score: number; reason: string };
        satisfaction: { score: number; reason: string };
        totalScore: number;
        letterGrade: string;
    };
    analysis: {
        overview: string;
        strengths: string[];
        weaknesses: string[];
        valueAssessment: string;
        reviewsSummary: string;
    };
    verdict: {
        decision: 'RECOMMEND' | 'DO NOT RECOMMEND' | 'CONSIDER ALTERNATIVES';
        reasoning: string;
    };
}

export default function ProAnalysisView({ productName, productBrand }: ProAnalysisViewProps) {
    const { user, isPro, dietaryPreferences } = useAuth();
    const theme = useTheme();
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [rawError, setRawError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleAnalyze = async () => {
        if (!isPro) return;

        setLoading(true);
        setExpanded(true);
        setRawError(null);
        try {
            const userProfileForAI = {
                dietaryPreferences,
                subscription: 'PRO_TIER_ELITE'
            };
            const resultString = await analyzeProductProMode(`${productName} ${productBrand || ''}`, userProfileForAI);

            try {
                const parsed = JSON.parse(resultString);
                setAnalysisData(parsed);
            } catch (e) {
                console.error("JSON Parse Error", resultString);
                setRawError("AI returned unstructured data. Please try again.");
            }

        } catch (error) {
            console.error("Analysis Failed", error);
            setRawError("Connection failed. Please check your internet or API keys.");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return theme.palette.success.main;
        if (score >= 60) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const renderScoreCard = (label: string, data: { score: number; reason: string }) => (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
                <Typography variant="h6" fontWeight="bold" color={getScoreColor(data.score)}>{data.score}/100</Typography>
            </Box>
            <LinearProgress variant="determinate" value={data.score} sx={{ height: 6, borderRadius: 3, mb: 1, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(data.score) } }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {data.reason}
            </Typography>
        </Paper>
    );

    if (!isPro) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                mt: 4,
                borderRadius: 4,
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #f8f9fa 100%)`,
                border: '1px solid #e0e0e0'
            }}
        >
            {/* Header / Trigger */}
            <Box
                onClick={!loading ? () => setExpanded(!expanded) : undefined}
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                        <SmartToyIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Antigravity AI
                            <Chip label="PRO" size="small" color="secondary" sx={{ fontWeight: 'bold' }} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Deep Market Research & Expert Grading</Typography>
                    </Box>
                </Box>

                {!analysisData && !loading && !rawError && (
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyze();
                        }}
                        sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold' }}
                    >
                        Analyze Now
                    </Button>
                )}

                {(analysisData || loading || rawError) && (
                    <Box>
                        {expanded ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
                    </Box>
                )}
            </Box>

            {/* Content Area */}
            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ p: 4, minHeight: 200 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
                            <CircularProgress color="secondary" size={40} />
                            <Typography variant="body1" fontWeight="medium" sx={{ animation: 'pulse 1.5s infinite' }}>
                                Consulting industry experts & analyzing market data...
                            </Typography>
                        </Box>
                    ) : rawError ? (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>{rawError}</Alert>
                    ) : analysisData ? (
                        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>

                            {/* Verdict Banner */}
                            <Paper
                                sx={{
                                    p: 3,
                                    mb: 4,
                                    borderRadius: 3,
                                    bgcolor: analysisData.verdict.decision === 'RECOMMEND' ? '#f0fdf4' : analysisData.verdict.decision === 'DO NOT RECOMMEND' ? '#fef2f2' : '#fffbeb',
                                    border: '1px solid',
                                    borderColor: analysisData.verdict.decision === 'RECOMMEND' ? 'success.light' : analysisData.verdict.decision === 'DO NOT RECOMMEND' ? 'error.light' : 'warning.light',
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    alignItems: 'center',
                                    gap: 3
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
                                    <Chip
                                        label={analysisData.grading.letterGrade}
                                        sx={{
                                            fontSize: '2.5rem',
                                            height: 64,
                                            width: 64,
                                            borderRadius: '50%',
                                            bgcolor: 'white',
                                            color: getScoreColor(analysisData.grading.totalScore),
                                            fontWeight: '900',
                                            mb: 1,
                                            boxShadow: 2
                                        }}
                                    />
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary">OVERALL</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h5" fontWeight="900"
                                        color={analysisData.verdict.decision === 'RECOMMEND' ? 'success.dark' : analysisData.verdict.decision === 'DO NOT RECOMMEND' ? 'error.dark' : 'warning.dark'}
                                        sx={{ mb: 1, textTransform: 'uppercase' }}
                                    >
                                        {analysisData.verdict.decision}
                                    </Typography>
                                    <Typography variant="body1">
                                        {analysisData.verdict.reasoning}
                                    </Typography>
                                </Box>
                            </Paper>

                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid size={{ xs: 12, md: 4 }}>{renderScoreCard('Quality & Build', analysisData.grading.quality)}</Grid>
                                <Grid size={{ xs: 12, md: 4 }}>{renderScoreCard('Value for Money', analysisData.grading.value)}</Grid>
                                <Grid size={{ xs: 12, md: 4 }}>{renderScoreCard('User Satisfaction', analysisData.grading.satisfaction)}</Grid>
                            </Grid>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><TrendingUpIcon color="primary" /> Market Context</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}><b>Status:</b> {analysisData.marketStatus}</Typography>
                                <Typography variant="body2"><b>Brand Reputation:</b> {analysisData.brandReputation}</Typography>
                            </Box>

                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ThumbUpIcon fontSize="small" /> Key Strengths
                                    </Typography>
                                    {analysisData.analysis.strengths.map((point, i) => (
                                        <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                                            <CheckCircleIcon color="success" fontSize="small" sx={{ mt: 0.3 }} />
                                            <Typography variant="body2">{point}</Typography>
                                        </Box>
                                    ))}
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" fontWeight="bold" color="error.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ThumbDownIcon fontSize="small" /> Potential Drawbacks
                                    </Typography>
                                    {analysisData.analysis.weaknesses.map((point, i) => (
                                        <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                                            <CancelIcon color="error" fontSize="small" sx={{ mt: 0.3 }} />
                                            <Typography variant="body2">{point}</Typography>
                                        </Box>
                                    ))}
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 4 }} />

                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><GavelIcon /> Final Summary</Typography>
                                <Typography variant="body1" paragraph>
                                    {analysisData.analysis.overview}
                                </Typography>
                                <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
                                    "{analysisData.analysis.reviewsSummary}"
                                </Typography>
                            </Box>

                        </Box>
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                Click "Analyze Now" to generate a comprehensive report.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
}
