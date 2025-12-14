
'use client';

import React, { useState, useEffect } from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Box, Fab } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import RecommendIcon from '@mui/icons-material/Recommend';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [value, setValue] = useState(pathname);

    useEffect(() => {
        setValue(pathname);
    }, [pathname]);

    if (!user) {
        return null;
    }

    return (
        <React.Fragment>
            {/* FAB for Scan - Floating Center */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1002,
                    display: { xs: 'block', md: 'none' }
                }}
            >
                <Fab
                    color="primary"
                    aria-label="scan"
                    onClick={() => router.push('/scan')}
                    sx={{
                        width: 64,
                        height: 64,
                        background: 'linear-gradient(135deg, #6C63FF 0%, #00F0FF 100%)',
                        boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
                        '&:hover': {
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <QrCodeScannerIcon sx={{ fontSize: 32 }} />
                </Fab>
            </Box>

            <Box
                component={motion.div}
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    position: 'fixed',
                    bottom: 16,
                    left: 16,
                    right: 16,
                    zIndex: 1000
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: 'rgba(20, 20, 20, 0.85)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    }}
                >
                    <BottomNavigation
                        showLabels={false}
                        value={value}
                        onChange={(event, newValue) => {
                            if (newValue !== '/scan') { // Scan handled by FAB
                                setValue(newValue);
                                router.push(newValue);
                            }
                        }}
                        sx={{
                            bgcolor: 'transparent',
                            height: 65,
                            '& .MuiBottomNavigationAction-root': {
                                color: 'rgba(255,255,255,0.4)',
                                padding: '6px 0',
                                minWidth: 'auto',
                                '&.Mui-selected': {
                                    color: 'secondary.main',
                                },
                            },
                        }}
                    >
                        <BottomNavigationAction label="Search" value="/search" icon={<SearchIcon />} />
                        <BottomNavigationAction label="History" value="/history" icon={<HistoryIcon />} />
                        <BottomNavigationAction label="Scan" value="/scan" sx={{ opacity: 0, pointerEvents: 'none' }} /> {/* Spacer for FAB */}
                        <BottomNavigationAction label="Picks" value="/recommendations" icon={<RecommendIcon />} />
                        <BottomNavigationAction label="Profile" value="/profile" icon={<PersonIcon />} />
                    </BottomNavigation>
                </Paper>
            </Box>
        </React.Fragment>
    );
}
