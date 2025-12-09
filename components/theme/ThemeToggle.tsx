/**
 * Theme Toggle Button
 * Quick theme switcher for navbar with light/dark toggle
 */

'use client';

import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PaletteIcon from '@mui/icons-material/Palette';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/hooks/useTheme';

interface ThemeToggleProps {
    onOpenCustomizer?: () => void;
}

export default function ThemeToggle({ onOpenCustomizer }: ThemeToggleProps) {
    const { currentTheme, setTheme, themeId } = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleQuickToggle = () => {
        // Toggle between light and dark mode
        if (currentTheme.mode === 'light') {
            setTheme('dark');
        } else {
            setTheme('default');
        }
    };

    const handleThemeSelect = (themeId: string) => {
        setTheme(themeId as any);
        handleClose();
    };

    const handleOpenCustomizer = () => {
        handleClose();
        onOpenCustomizer?.();
    };

    return (
        <>
            <Tooltip title="Change Theme">
                <IconButton
                    component={motion.button}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClick}
                    sx={{ color: 'text.primary' }}
                >
                    {currentTheme.mode === 'dark' ? (
                        <DarkModeIcon />
                    ) : (
                        <LightModeIcon />
                    )}
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleQuickToggle}>
                    <ListItemIcon>
                        {currentTheme.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </ListItemIcon>
                    <ListItemText>
                        Switch to {currentTheme.mode === 'dark' ? 'Light' : 'Dark'} Mode
                    </ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={() => handleThemeSelect('default')}>
                    <ListItemText>TruthLens Default</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleThemeSelect('dark')}>
                    <ListItemText>Dark Mode</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleThemeSelect('ocean')}>
                    <ListItemText>Ocean Blue</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleThemeSelect('forest')}>
                    <ListItemText>Forest Green</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleThemeSelect('purple')}>
                    <ListItemText>Purple Dreams</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleOpenCustomizer}>
                    <ListItemIcon>
                        <PaletteIcon />
                    </ListItemIcon>
                    <ListItemText>Customize Theme...</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}
