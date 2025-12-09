/**
 * Animation Variants
 * Reusable animation configurations for Framer Motion
 */

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export const fadeInDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
};

export const slideInLeft = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
};

export const slideInRight = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
};

export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

// Transition configurations
export const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 24,
};

export const smoothTransition = {
    type: 'tween' as const,
    ease: 'easeInOut',
    duration: 0.3,
};

export const slowTransition = {
    type: 'tween' as const,
    ease: 'easeInOut',
    duration: 0.5,
};

// Hover animations
export const hoverScale = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
};

export const hoverLift = {
    whileHover: { y: -5, transition: { duration: 0.2 } },
};

export const hoverGlow = {
    whileHover: {
        boxShadow: '0 0 20px rgba(108, 99, 255, 0.5)',
        transition: { duration: 0.2 },
    },
};
