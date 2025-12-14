'use client';

import React from 'react';
import { Card, CardMedia, CardContent, Typography, Chip, Box, Button, CardActions, Tooltip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';
import InfoIcon from '@mui/icons-material/Info';
import { useRouter } from 'next/navigation';
import AddToCompareButton from '@/components/compare/AddToCompareButton';

interface RecommendationCardProps {
    id: string;
    name: string;
    brand: string;
    image: string;
    description: string;
    grade: string;
    reason: string;
    source: 'off' | 'external' | 'ai';
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
    id, name, brand, image, description, grade, reason, source
}) => {
    const router = useRouter();

    const getGradeColor = (g: string) => {
        const gradeUpper = g?.toUpperCase() || '?';
        if (gradeUpper === 'A' || gradeUpper === 'B') return 'success';
        if (gradeUpper === 'C') return 'warning';
        return 'error';
    };

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }
        }}>
            {/* Grade Badge */}
            <Chip
                label={`Grade ${grade?.toUpperCase() || '?'}`}
                color={getGradeColor(grade)}
                size="small"
                sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold', zIndex: 1 }}
            />

            {/* AI / Source Badge */}
            <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, display: 'flex', gap: 1 }}>
                {source === 'off' && (
                    <Tooltip title="Verified Data from Open Food Facts">
                        <Chip icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label="Verified" size="small" color="info" sx={{ height: 24 }} />
                    </Tooltip>
                )}
                <Tooltip title={reason}>
                    <Chip
                        icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                        label="AI Pick"
                        size="small"
                        sx={{
                            height: 24,
                            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                            color: 'white',
                            border: 0
                        }}
                    />
                </Tooltip>
            </Box>

            <CardMedia
                component="img"
                height="200"
                image={image || "https://placehold.co/400x300?text=No+Image"}
                alt={name}
                sx={{ objectFit: 'cover' }}
            />

            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                    {brand}
                </Typography>
                <Typography gutterBottom variant="h6" component="div" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 1 }}>
                    {name}
                </Typography>

                {/* AI Reason Section */}
                <Box sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderLeft: '3px solid #FF8E53'
                }}>
                    <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        "{reason}"
                    </Typography>
                </Box>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
                {id.startsWith('ext-') ? (
                    <Button disabled fullWidth variant="outlined" size="small">External Data</Button>
                ) : (
                    <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                        onClick={() => router.push(`/product/${id}`)}
                    >
                        View Details
                    </Button>
                )}
            </CardActions>
        </Card>
    );
};

export default RecommendationCard;
