'use client';

import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';

export default function NotFound() {
    const router = useRouter();

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#050505',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 3
        }}>
            <Container maxWidth="sm">
                <Typography variant="h1" fontWeight="900" sx={{
                    fontSize: { xs: '6rem', md: '10rem' },
                    background: 'linear-gradient(135deg, #6C63FF, #00F0FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1
                }}>
                    404
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                    Lost in the matrix?
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                    The page you are looking for does not exist or has been moved.
                    If you were looking for the search page, it's now Global Search!
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<HomeIcon />}
                        onClick={() => router.push('/')}
                        sx={{
                            bgcolor: '#6C63FF',
                            '&:hover': { bgcolor: '#5a52d5' },
                            borderRadius: 4,
                            px: 3
                        }}
                    >
                        Go Home
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => router.push('/global-search')}
                        sx={{
                            borderRadius: 4,
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            px: 3,
                            '&:hover': { borderColor: '#6C63FF', bgcolor: 'rgba(108, 99, 255, 0.1)' }
                        }}
                    >
                        Global Search
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}
