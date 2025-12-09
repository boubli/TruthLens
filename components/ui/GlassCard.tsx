'use client';

import { Box, BoxProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface GlassCardProps extends BoxProps {
    blur?: number;
    opacity?: number;
    hoverEffect?: boolean;
}

const StyledBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'blur' && prop !== 'opacity' && prop !== 'hoverEffect',
})<GlassCardProps>(({ theme, blur = 10, opacity = 0.7, hoverEffect = false }) => ({
    background: `rgba(30, 30, 30, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`, // Safari support
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    transition: 'all 0.3s ease-in-out',

    ...(hoverEffect && {
        '&:hover': {
            background: `rgba(40, 40, 40, ${opacity + 0.1})`,
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px 0 rgba(108, 99, 255, 0.2)',
            border: '1px solid rgba(108, 99, 255, 0.3)',
        },
    }),
}));

export default function GlassCard({ children, ...props }: GlassCardProps) {
    return <StyledBox {...props}>{children}</StyledBox>;
}
