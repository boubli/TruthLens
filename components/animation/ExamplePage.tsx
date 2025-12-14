/**
 * Animation Wrapper Template
 * Example of how to wrap a page with animations
 */

'use client';

import PageTransition from '@/components/animation/PageTransition';
import ScrollReveal from '@/components/animation/ScrollReveal';
import StaggerList, { StaggerItem } from '@/components/animation/StaggerList';
import AnimatedButton from '@/components/ui/AnimatedButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { Box, Typography, Container } from '@mui/material';

export default function ExamplePage() {
    const items = [1, 2, 3, 4, 5];

    return (
        <PageTransition>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Hero Section with Scroll Reveal */}
                <ScrollReveal>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h2" gutterBottom>
                            Welcome to Your Page
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            This example shows how to use animations
                        </Typography>
                        <AnimatedButton variant="contained" size="large" sx={{ mt: 3 }}>
                            Get Started
                        </AnimatedButton>
                    </Box>
                </ScrollReveal>

                {/* Stagger List Example */}
                <ScrollReveal delay={0.2}>
                    <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                        Features
                    </Typography>
                    <StaggerList>
                        {items.map((item) => (
                            <StaggerItem key={item}>
                                <AnimatedCard sx={{ mb: 2, p: 3 }}>
                                    <Typography variant="h6">Feature {item}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Description of feature {item}
                                    </Typography>
                                </AnimatedCard>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                </ScrollReveal>
            </Container>
        </PageTransition>
    );
}
