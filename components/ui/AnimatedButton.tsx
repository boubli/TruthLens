/**
 * Animated Button Component
 * Button with hover and tap animations
 */

'use client';

import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@mui/material';
import { forwardRef } from 'react';

interface AnimatedButtonProps extends ButtonProps {
    scaleOnHover?: number;
    scaleOnTap?: number;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
    ({ scaleOnHover = 1.05, scaleOnTap = 0.95, children, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                component={motion.button}
                whileHover={{ scale: scaleOnHover }}
                whileTap={{ scale: scaleOnTap }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                {...props}
            >
                {children}
            </Button>
        );
    }
);

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;
