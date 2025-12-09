/**
 * Animated Card Component
 * Card with hover animations and optional pulse effect
 */

'use client';

import { motion } from 'framer-motion';
import { Card, CardProps } from '@mui/material';
import { ReactNode, forwardRef } from 'react';

interface AnimatedCardProps extends Omit<CardProps, 'component'> {
    children: ReactNode;
    hoverScale?: number;
    hoverY?: number;
    enablePulse?: boolean;
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
    ({ children, hoverScale = 1.02, hoverY = -5, enablePulse = false, ...props }, ref) => {
        const pulseAnimation = enablePulse
            ? {
                scale: [1, 1.02, 1],
                transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            }
            : {};

        return (
            <Card
                ref={ref}
                component={motion.div as any}
                whileHover={{
                    scale: hoverScale,
                    y: hoverY,
                }}
                animate={pulseAnimation}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                }}
                {...props}
            >
                {children}
            </Card>
        );
    }
);

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;
