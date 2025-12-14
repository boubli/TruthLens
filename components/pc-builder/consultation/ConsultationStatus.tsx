'use client';

import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Chip,
    Divider,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Link,
    Alert
} from '@mui/material';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LinkIcon from '@mui/icons-material/Link';
import HardwareIcon from '@mui/icons-material/Memory';
import { PCBuildRequest } from '@/types/pcBuilder';

interface ConsultationStatusProps {
    request: PCBuildRequest;
}

export default function ConsultationStatus({ request }: ConsultationStatusProps) {
    const isCompleted = request.status === 'completed' && request.adminResponse;

    if (!isCompleted) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 5,
                    textAlign: 'center',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <PendingIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Request Submitted
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                    An admin is reviewing your request. You will receive your custom PC build configuration here soon.
                </Typography>
                <Chip
                    label="Status: Pending Review"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
            </Paper>
        );
    }

    const { components, adminNotes, youtubeLink, purchaseLinks } = request.adminResponse!;

    return (
        <Box>
            <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ mb: 4, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Your Expert Build is Ready!
                </Typography>
                Review the components and advice below.
            </Alert>

            {/* Admin Note */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Expert's Note
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                    {adminNotes}
                </Typography>
            </Paper>

            {/* Components List */}
            <Paper elevation={0} sx={{ p: 0, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight="bold">
                        Component List
                    </Typography>
                </Box>
                <List disablePadding>
                    {components.map((comp, i) => (
                        <ListItem key={i} divider={i < components.length - 1} sx={{ p: 2 }}>
                            <ListItemIcon>
                                <HardwareIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box component="span" sx={{ fontWeight: 'bold' }}>
                                        {comp.brand} {comp.name}
                                    </Box>
                                }
                                secondary={
                                    <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                        <Typography variant="caption" component="span" sx={{ bgcolor: 'action.selected', px: 1, py: 0.5, borderRadius: 1, mr: 1 }}>
                                            {comp.type.toUpperCase()}
                                        </Typography>
                                        {Object.entries(comp.specifications).map(([k, v]) => (
                                            <Typography key={k} variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                                {k}: {v}
                                            </Typography>
                                        ))}
                                    </Box>
                                }
                            />
                            {comp.price && (
                                <Typography variant="subtitle1" fontWeight="bold">
                                    ${comp.price.toLocaleString()}
                                </Typography>
                            )}
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Resources & Videos */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {youtubeLink && (
                    <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <YouTubeIcon color="error" /> Recommended Video
                        </Typography>
                        <List dense>
                            <ListItem>
                                <Link href={youtubeLink} target="_blank" rel="noopener" sx={{ wordBreak: 'break-all' }}>
                                    {youtubeLink}
                                </Link>
                            </ListItem>
                        </List>
                    </Paper>
                )}

                {purchaseLinks && purchaseLinks.length > 0 && (
                    <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinkIcon color="primary" /> Useful Links
                        </Typography>
                        <List dense>
                            {purchaseLinks.map((link, i) => (
                                <ListItem key={i}>
                                    <Link href={link} target="_blank" rel="noopener" sx={{ wordBreak: 'break-all' }}>
                                        {link}
                                    </Link>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>
        </Box>
    );
}
