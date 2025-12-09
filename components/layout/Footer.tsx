'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@mui/material';
import RecommendIcon from '@mui/icons-material/Recommend';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { motion } from 'framer-motion';

const Footer = () => {
    const pathname = usePathname();

    return (
        <Box
            component="footer"
            sx={{
                py: { xs: 2.5, md: 3 },
                px: { xs: 2, md: 3 },
                mt: 'auto',
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                // Ensure footer doesn't overlap with mobile navigation
                pb: { xs: 2, md: 3 },
                // Improve visibility
                boxShadow: '0 -1px 3px rgba(0,0,0,0.05)',
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: { xs: 'center', md: 'space-between' },
                        alignItems: 'center',
                        gap: { xs: 1, md: 2 }
                    }}
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign={{ xs: 'center', md: 'left' }}
                        sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            opacity: { xs: 0.7, md: 0.8 }
                        }}
                    >
                        © {new Date().getFullYear()} TruthLens. All rights reserved.
                    </Typography>

                    {/* Navigation links - REMOVED as per user request */}
                    <Box sx={{ display: 'none' }} />
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;

