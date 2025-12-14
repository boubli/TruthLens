/**
 * Stagger List Component
 * Animates list items with stagger effect
 */

'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerListProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
        },
    },
};

export default function StaggerList({ children, className, staggerDelay = 0.1 }: StaggerListProps) {
    const customContainerVariants = {
        ...containerVariants,
        visible: {
            ...containerVariants.visible,
            transition: {
                staggerChildren: staggerDelay,
            },
        },
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={customContainerVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Export item component for use in lists
// Export item component with pre-bound variants
export function StaggerItem({ children, className, ...props }: { children: ReactNode; className?: string } & import('framer-motion').HTMLMotionProps<"div">) {
    return (
        <motion.div variants={itemVariants} className={className} {...props}>
            {children}
        </motion.div>
    );
}
