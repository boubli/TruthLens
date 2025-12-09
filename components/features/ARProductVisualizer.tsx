'use client';

import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { keyframes } from '@mui/system';
import { ARProductDetails } from '@/services/aiService';

const rotate = keyframes`
  from { transform: rotateY(0deg) rotateX(10deg); }
  to { transform: rotateY(360deg) rotateX(10deg); }
`;

interface ARVisualizerProps {
    data: ARProductDetails | null;
    loading: boolean;
    imageUrl?: string;
}

export default function ARProductVisualizer({ data, loading, imageUrl }: ARVisualizerProps) {
    if (loading) {
        return (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <CircularProgress color="secondary" />
                <Typography variant="caption" sx={{ mt: 2 }}>AI is estimating physical dimensions...</Typography>
            </Box>
        );
    }

    if (!data) return null;

    // --- GEOMETRY MATH ---
    // Normalize dimensions for display (scale down to fit 200px box)
    const maxDim = Math.max(data.dimensions.height, data.dimensions.width, data.dimensions.length);
    const scale = 150 / maxDim;

    const h = data.dimensions.height * scale;
    const w = data.dimensions.width * scale;
    const d = data.dimensions.length * scale;

    const color = data.color || '#ccc';

    // Cylinder parameters
    const cylinderSegments = 24; // Smoother circle
    const r = w / 2; // Radius

    // Width of each panel to close the gap perfectly: 2 * r * tan(PI/segments)
    // We add a tiny buffer (+1px) to prevent sub-pixel gaps between panels
    const segmentWidth = 2 * r * Math.tan(Math.PI / cylinderSegments) + 1;

    // Texture styles for Box
    const textureStyle = imageUrl ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
    } : { backgroundColor: color };

    return (
        <Paper elevation={0} sx={{
            p: 2,
            height: 350,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'transparent',
            position: 'relative',
            perspective: '1000px',
            overflow: 'hidden'
        }}>
            <Typography variant="subtitle2" color="secondary" sx={{ position: 'absolute', top: 10, left: 10 }}>
                AI Spatial Model
            </Typography>

            <Typography variant="caption" sx={{ position: 'absolute', bottom: 10, right: 10, textAlign: 'right', zIndex: 10 }}>
                Est. Size: {data.dimensions.length}x{data.dimensions.width}x{data.dimensions.height} {data.dimensions.unit}<br />
                "{data.estimatedRealWorldSize}"
            </Typography>

            {/* 3D Scene */}
            <Box sx={{
                width: 200,
                height: 200,
                position: 'relative',
                transformStyle: 'preserve-3d',
                animation: `${rotate} 12s infinite linear`
            }}>
                {/* Primitive Shapes based on AI detection */}
                {data.shape === 'cylinder' || data.shape === 'bottle' ? (
                    // --- HIGH QUALITY TEXTURED CYLINDER ---
                    <Box sx={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `translateY(${(200 - h) / 2}px)` }}>
                        {/* Generate Panels */}
                        {Array.from({ length: cylinderSegments }).map((_, i) => {
                            const deg = (360 / cylinderSegments) * i;
                            return (
                                <Box key={i} sx={{
                                    position: 'absolute',
                                    left: '50%', // Center the panel origin
                                    top: 0,
                                    width: segmentWidth,
                                    height: h,
                                    marginLeft: `${-segmentWidth / 2}px`, // Center pivot to rotate correctly

                                    // Texture Mapping
                                    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                                    backgroundColor: imageUrl ? 'white' : color,

                                    // Stretch texture across all segments. 
                                    // Total width = segmentWidth * segments.
                                    backgroundSize: `${segmentWidth * cylinderSegments}px ${h}px`,

                                    // Shift position for this segment
                                    backgroundPosition: `${-i * (segmentWidth - 1)}px center`, // -1 to account for overlap buffer

                                    opacity: 1,
                                    // Rotate and push out by Radius
                                    transform: `rotateY(${deg}deg) translateZ(${r}px)`,
                                    backfaceVisibility: 'hidden',

                                    // Lighting simulation
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0, bottom: 0, left: 0, right: 0,
                                        // Dynamic lighting gradient based on rotation angle (simulated)
                                        background: `linear-gradient(90deg, rgba(0,0,0,${Math.abs(Math.sin((deg) / 180 * Math.PI)) * 0.3}), rgba(255,255,255,${Math.abs(Math.cos((deg) / 180 * Math.PI)) * 0.1}))`,
                                        pointerEvents: 'none'
                                    }
                                }} />
                            );
                        })}

                        {/* Cylinder Cap (Top) - Simple Circle */}
                        <Box sx={{
                            position: 'absolute',
                            left: '50%',
                            top: 0,
                            width: w,
                            height: w, // Circular
                            marginLeft: `${-w / 2}px`,
                            borderRadius: '50%',
                            backgroundColor: '#e0e0e0', // Generic cap color
                            // Map top part of image if possible, or just standard cap color
                            backgroundImage: imageUrl ? `radial-gradient(circle, ${color} 30%, #333 100%)` : undefined,
                            transform: `translateX(-50%) rotateX(90deg) translateZ(${h / 2}px)`
                        }} />

                        {/* Cylinder Base (Bottom) */}
                        <Box sx={{
                            position: 'absolute',
                            left: '50%',
                            marginLeft: `${-w / 2}px`,
                            width: w,
                            height: w,
                            borderRadius: '50%',
                            backgroundColor: color,
                            filter: 'brightness(50%)',
                            transform: `translateX(-50%) rotateX(-90deg) translateZ(${h / 2}px)`
                        }} />
                    </Box>
                ) : (
                    // --- TEXTURED BOX ---
                    // Center the box logic better
                    <Box sx={{ position: 'relative', width: w, height: h, margin: 'auto', transformStyle: 'preserve-3d', transform: `translateY(${(200 - h) / 2}px)` }}>
                        {/* Front */}
                        <Box sx={{ position: 'absolute', width: w, height: h, ...textureStyle, transform: `translateZ(${d / 2}px)` }} />
                        {/* Back */}
                        <Box sx={{ position: 'absolute', width: w, height: h, ...textureStyle, transform: `rotateY(180deg) translateZ(${d / 2}px)` }} />
                        {/* Right */}
                        <Box sx={{ position: 'absolute', width: d, height: h, bgcolor: color, filter: 'brightness(80%)', transform: `rotateY(90deg) translateZ(${w / 2}px)` }} />
                        {/* Left */}
                        <Box sx={{ position: 'absolute', width: d, height: h, bgcolor: color, filter: 'brightness(80%)', transform: `rotateY(-90deg) translateZ(${w / 2}px)` }} />
                        {/* Top */}
                        <Box sx={{ position: 'absolute', width: w, height: d, bgcolor: '#f5f5f5', transform: `rotateX(90deg) translateZ(${d / 2}px)` }} />
                        {/* Bottom */}
                        <Box sx={{ position: 'absolute', width: w, height: d, bgcolor: '#ddd', transform: `rotateX(-90deg) translateZ(${h - d / 2}px)` }} />
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
