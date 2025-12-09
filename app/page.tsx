/**
 * TruthLens Application
 * Developed by Youssef Boubli
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Grid, Button, Card, CardContent, Chip, useTheme, useMediaQuery, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ScrollReveal from '@/components/animation/ScrollReveal';
import AnimatedButton from '@/components/ui/AnimatedButton';
// Icons
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedIcon from '@mui/icons-material/Verified';
import SpeedIcon from '@mui/icons-material/Speed';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
// User Home Component
import UserHome from '@/components/user/UserHome';
import WelcomeModal from '@/components/ui/WelcomeModal';

export default function LandingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, userProfile, loading } = useAuth(); // Added userProfile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if user has seen welcome screen before
  useEffect(() => {
    if (!loading && !user) {
      const hasSeenWelcome = localStorage.getItem('truthlens_welcome_seen');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [loading, user]);

  // Admin Redirect: Admins should not see the user app (search, etc.)
  useEffect(() => {
    if (!loading && user && userProfile?.role === 'admin') {
      router.replace('/admin');
    }
  }, [loading, user, userProfile, router]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('truthlens_welcome_seen', 'true');
  };

  console.log('🔍 DEBUG:', { loading, user: user ? 'logged in' : 'not logged in' });

  if (loading) {
    console.log('⏳ Still loading...');
    return <LoadingSpinner fullScreen message="Loading TruthLens..." />;
  }

  // If user is logged in...
  if (user) {
    // If Admin, show loading/spinner while redirect effect kicks in (or return null)
    // Prevents flashing UserHome
    if (userProfile?.role === 'admin') {
      return <LoadingSpinner fullScreen message="Redirecting to Admin Dashboard..." />;
    }

    console.log('✅ User logged in - rendering UserHome');
    return <UserHome />;
  }

  console.log('👤 No user - rendering Landing Page');


  return (
    <>
      {/* Welcome Modal for first-time visitors */}
      <WelcomeModal open={showWelcome} onClose={handleCloseWelcome} />

      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary', overflowX: 'hidden' }}>

        {/* Navigation */}
        <Box sx={{
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          bgcolor: 'rgba(10, 10, 10, 0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCodeScannerIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" fontWeight="bold" sx={{ background: 'linear-gradient(45deg, #fff, #aaa)', backgroundClip: 'text', color: 'transparent' }}>
              {t('brand_name')}
            </Typography>
          </Box>

          {!isMobile ? (
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Button color="inherit" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>{t('nav_features')}</Button>
              <Button color="inherit" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>{t('nav_pricing')}</Button>
              <Button variant="outlined" color="primary" onClick={() => router.push('/login')}>{t('nav_login')}</Button>
              <Button variant="contained" color="primary" onClick={() => router.push('/signup')}>{t('nav_get_started')}</Button>
            </Box>
          ) : (
            <IconButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)} color="inherit">
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Box>

        {/* Mobile Menu Overlay */}
        {isMobile && mobileMenuOpen && (
          <Box sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'background.default',
            zIndex: 999,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <Button size="large" color="inherit" onClick={() => { setMobileMenuOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</Button>
            <Button size="large" color="inherit" onClick={() => { setMobileMenuOpen(false); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}>Pricing</Button>
            <Button size="large" variant="outlined" onClick={() => router.push('/login')}>Login</Button>
            <Button size="large" variant="contained" onClick={() => router.push('/signup')}>Get Started</Button>
          </Box>
        )}

        {/* Hero Section */}
        <Box sx={{
          pt: { xs: 15, md: 20 },
          pb: { xs: 10, md: 15 },
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Elements */}
          <Box sx={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60vw',
            height: '60vw',
            bgcolor: 'primary.main',
            opacity: 0.1,
            filter: 'blur(100px)',
            borderRadius: '50%',
            zIndex: 0
          }} />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <ScrollReveal>
                  <Chip
                    label={t('landing_new_feature')}
                    color="primary"
                    sx={{ mb: 3, bgcolor: 'rgba(108, 99, 255, 0.1)', color: 'primary.light', border: '1px solid rgba(108, 99, 255, 0.2)' }}
                  />
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '3rem', md: '4.5rem' },
                      fontWeight: 900,
                      lineHeight: 1.1,
                      mb: 3,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #AAAAAA 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t('landing_hero_title_1')} <br />
                    <span style={{ color: '#6C63FF', WebkitTextFillColor: '#6C63FF' }}>{t('landing_hero_title_2')}</span>
                  </Typography>
                  <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: 500, lineHeight: 1.6 }}>
                    {t('landing_hero_subtitle')}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <AnimatedButton
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/signup')}
                      sx={{
                        px: 4, py: 2, fontSize: '1.1rem',
                        background: 'linear-gradient(90deg, #6C63FF 0%, #5a52d5 100%)',
                        boxShadow: '0 0 30px rgba(108,99,255,0.4)'
                      }}
                    >
                      {t('landing_cta_primary')}
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outlined"
                      size="large"
                      onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                      sx={{ px: 4, py: 2, fontSize: '1.1rem', borderColor: 'rgba(255,255,255,0.2)', color: 'text.primary' }}
                    >
                      {t('landing_cta_secondary')}
                    </AnimatedButton>
                  </Box>
                </ScrollReveal>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ScrollReveal delay={0.2}>
                  <Box sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: -20,
                      background: 'conic-gradient(from 0deg, #6C63FF, transparent, #00F0FF, transparent, #6C63FF)',
                      borderRadius: '30px',
                      animation: 'spin 10s linear infinite',
                      opacity: 0.3
                    }
                  }}>
                    <Box sx={{
                      bgcolor: '#111',
                      borderRadius: '24px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      p: 3,
                      position: 'relative',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                      {/* Mock UI for Scan Result */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ width: 60, height: 60, bgcolor: '#333', borderRadius: 2, mr: 2 }} />
                        <Box>
                          <Typography variant="h6">Organic Granola</Typography>
                          <Chip label="Grade A" color="success" size="small" />
                        </Box>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Analysis</Typography>
                        <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                          <Typography variant="body2" color="success.light">✅ Low Sugar • High Fiber • No Preservatives</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Health Impact</Typography>
                        <Typography variant="caption" color="text.secondary">Excellent choice for maintaining stable blood sugar levels.</Typography>
                      </Box>
                    </Box>
                  </Box>
                </ScrollReveal>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Grid */}
        <Box id="features" sx={{ py: 15, bgcolor: '#050505' }}>
          <Container maxWidth="lg">
            <Typography variant="h2" textAlign="center" fontWeight="bold" sx={{ mb: 8 }}>
              {t('landing_features_title_1')} <span style={{ color: '#6C63FF' }}>{t('landing_features_title_2')}</span>
            </Typography>
            <Grid container spacing={4}>
              {[
                { icon: <QrCodeScannerIcon fontSize="large" />, title: 'Instant Scan', desc: 'Point your camera and get results in under 2 seconds.' },
                { icon: <SmartToyIcon fontSize="large" />, title: 'AI Analysis', desc: 'Deep dive into ingredients with advanced Gemini AI models.' },
                { icon: <VerifiedIcon fontSize="large" />, title: 'Truth Grading', desc: 'Simple A-F grading system based on nutritional value.' },
                { icon: <HealthAndSafetyIcon fontSize="large" />, title: 'Allergen Alerts', desc: 'Customizable alerts for your specific dietary needs.' },
                { icon: <SpeedIcon fontSize="large" />, title: 'Performance', desc: 'Optimized for speed and low data usage.' },
                { icon: <StarIcon fontSize="large" />, title: 'Favorites', desc: 'Save products and build your healthy shopping list.' }
              ].map((feature, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <ScrollReveal delay={i * 0.1}>
                    <Card sx={{
                      height: '100%',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderColor: 'primary.main'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                        <Typography variant="h5" gutterBottom fontWeight="bold">{feature.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{feature.desc}</Typography>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box sx={{ py: 15, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(108,99,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <Container maxWidth="md">
            <ScrollReveal>
              <Typography variant="h2" fontWeight="bold" gutterBottom>
                {t('landing_footer_cta_title')}
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 5 }}>
                {t('landing_footer_cta_subtitle')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/signup')}
                sx={{
                  px: 8,
                  py: 2.5,
                  fontSize: '1.2rem',
                  borderRadius: '50px',
                  background: 'white',
                  color: 'black',
                  '&:hover': { background: '#f0f0f0' }
                }}
              >
                {t('landing_footer_cta_button')}
              </Button>
            </ScrollReveal>
          </Container>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: '#050505' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} TruthLens. All rights reserved.
          </Typography>
        </Box>

      </Box>

    </>
  );
}
