'use client';
import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';

// Animations
const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(76, 175, 80, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(-40px) rotate(20deg); opacity: 0; }
`;

export default function SearchingAnimation() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8
            }}
        >
            <Box sx={{ position: 'relative', width: 100, height: 100, mb: 4 }}>
                {/* Radar Pulse Effect */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        opacity: 0.2,
                        animation: `${pulse} 2s infinite`
                    }}
                />

                {/* Center Icon */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60, height: 60,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        zIndex: 2
                    }}
                >
                    <SearchIcon sx={{ fontSize: 32 }} />
                </Box>

                {/* Floating Food Icons */}
                <FastfoodIcon sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    color: 'orange',
                    animation: `${float} 3s infinite ease-out`,
                    animationDelay: '0s'
                }} />
                <RestaurantIcon sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    color: 'secondary.main',
                    animation: `${float} 3s infinite ease-out`,
                    animationDelay: '1s'
                }} />
                <LocalPizzaIcon sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    color: 'error.main',
                    animation: `${float} 3s infinite ease-out`,
                    animationDelay: '2s'
                }} />
            </Box>

            <Typography variant="h6" fontWeight="bold" color="primary">
                Scanning Global Database...
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Analyzing ingredients & nutrition
            </Typography>
        </Box>
    );
}
