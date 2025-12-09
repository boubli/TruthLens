'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, Typography } from '@mui/material';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile?.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <Typography>Checking permissions...</Typography>
      </Box>
    );
  }

  // If not admin and not loading, render nothing (useEffect will redirect)
  if (!user || userProfile?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
