'use client';
import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6C63FF', // Vibrant Purple
            light: '#9292FF',
            dark: '#3F3D99',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#00F0FF', // Cyber Neon Cyan
            light: '#69FFFF',
            dark: '#00BDC9',
            contrastText: '#000000',
        },
        background: {
            default: '#0A0A0A', // Deep Black
            paper: '#1F1F1F', // Dark Gray for cards
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0B0B0',
        },
    },
    typography: {
        fontFamily: roboto.style.fontFamily,
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        h2: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none', // Modern feel
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '12px 24px', // Larger touch target
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: '0px 4px 14px 0px rgba(108, 99, 255, 0.3)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0px 6px 20px 0px rgba(108, 99, 255, 0.5)',
                    },
                },
                sizeLarge: {
                    padding: '16px 32px', // Extra large for main actions
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderRadius: 16,
                    boxShadow: '0px 4px 20px 0px rgba(0, 0, 0, 0.4)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        minHeight: '56px', // Standard mobile touch height
                    }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    background: 'rgba(31, 31, 31, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                },
            },
        },
    },
});

export default theme;
