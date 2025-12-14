'use client';

import React from 'react';
import { Typography, Paper, List, ListItem, ListItemText, Chip, Box } from '@mui/material';

const tickets = [
    { id: 101, user: 'alice@example.com', subject: 'Login issue', status: 'Open', priority: 'High' },
    { id: 102, user: 'bob@example.com', subject: 'Payment failed', status: 'Resolved', priority: 'Medium' },
];

export default function SupportPage() {
    return (
        <Box>
            <Typography variant="h5" gutterBottom>Support Tickets</Typography>
            <Paper>
                <List>
                    {tickets.map((ticket) => (
                        <ListItem key={ticket.id} divider>
                            <ListItemText
                                primary={ticket.subject}
                                secondary={`User: ${ticket.user} | ID: #${ticket.id}`}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip label={ticket.status} color={ticket.status === 'Open' ? 'warning' : 'success'} size="small" />
                                <Chip label={ticket.priority} color={ticket.priority === 'High' ? 'error' : 'default'} variant="outlined" size="small" />
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
}
