'use client';

import React from 'react';
import { Box, Typography, Paper, Chip, Alert, AlertTitle, Divider } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { AITruthDetectorResult } from '@/services/aiService';

interface AITruthDetectorProps {
    result: AITruthDetectorResult | null;
    loading?: boolean;
}

/**
 * AI Truth Detector - Shows harmful ingredients analysis (Pro users only)
 */
const AITruthDetector: React.FC<AITruthDetectorProps> = ({ result, loading = false }) => {
    if (loading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)',
                    border: '1px solid rgba(255, 87, 34, 0.3)',
                }}
            >
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    🔍 AI Truth Detector
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Analyzing ingredients for harmful compounds...
                </Typography>
            </Paper>
        );
    }

    if (!result) {
        return null;
    }

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'info';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high':
                return <ErrorIcon color="error" />;
            case 'medium':
                return <WarningIcon color="warning" />;
            case 'low':
                return <InfoIcon color="info" />;
            default:
                return <InfoIcon />;
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)',
                border: '1px solid rgba(255, 87, 34, 0.3)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 0 }}>
                    🔍 AI Truth Detector
                </Typography>
                <Chip
                    label={`${result.overallRisk.toUpperCase()} RISK`}
                    color={getRiskColor(result.overallRisk)}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                />
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
                AI-powered ingredient analysis to detect potentially harmful compounds.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {result.harmfulIngredients.length === 0 ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                    <AlertTitle>✅ No Harmful Ingredients Detected</AlertTitle>
                    This product appears to have safe ingredients based on current research.
                </Alert>
            ) : (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="error.main">
                        ⚠️ Potentially Harmful Ingredients Found:
                    </Typography>
                    {result.harmfulIngredients.map((ingredient, index) => (
                        <Alert
                            key={index}
                            severity={ingredient.severity === 'high' ? 'error' : ingredient.severity === 'medium' ? 'warning' : 'info'}
                            icon={getSeverityIcon(ingredient.severity)}
                            sx={{ mb: 1.5 }}
                        >
                            <AlertTitle sx={{ fontWeight: 'bold' }}>{ingredient.name}</AlertTitle>
                            {ingredient.reason}
                        </Alert>
                    ))}
                </Box>
            )}

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    💡 Recommendation:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {result.recommendation}
                </Typography>
            </Paper>
        </Paper>
    );
};

export default AITruthDetector;
