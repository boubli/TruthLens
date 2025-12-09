'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
                type: 'spring',
                damping: 20,
                stiffness: 100,
                mass: 0.5
            }}
        >
            {children}
        </motion.div>
    );
}
