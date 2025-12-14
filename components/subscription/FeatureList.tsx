/**
 * Feature List Component
 * Shows subscription tier features with checkmarks
 */

'use client';

import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface Feature {
    name: string;
    included: boolean;
}

interface FeatureListProps {
    features: Feature[];
    title?: string;
}

export default function FeatureList({ features, title }: FeatureListProps) {
    return (
        <Box>
            {title && (
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    {title}
                </Typography>
            )}
            <List dense>
                {features.map((feature, index) => (
                    <ListItem key={index} disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            {feature.included ? (
                                <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                                <CancelIcon color="disabled" fontSize="small" />
                            )}
                        </ListItemIcon>
                        <ListItemText
                            primary={feature.name}
                            primaryTypographyProps={{
                                variant: 'body2',
                                color: feature.included ? 'text.primary' : 'text.disabled',
                            }}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
