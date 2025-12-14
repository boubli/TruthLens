'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Paper, Chip, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useCompare } from '@/context/CompareContext';
import { ProductData } from '@/services/productService';

export default function ComparePage() {
    const router = useRouter();
    const { selectedProducts, removeFromCompare } = useCompare();

    // Redirect if local state is empty (user refreshed or navigated directly)
    React.useEffect(() => {
        if (selectedProducts.length === 0) {
            router.replace('/search');
        }
    }, [selectedProducts, router]);

    if (selectedProducts.length === 0) {
        return null;
    }

    const getAttributeWinner = (attribute: keyof ProductData['nutriments'] | 'grade', products: ProductData[], type: 'high' | 'low') => {
        // Basic logic to find best value. 
        // For Nutrition Grade, 'a' > 'b' > 'c'...
        // For sugar, lower is better.
        // For protein, higher is better.
        // This is a simplified implementation.
        return null; // TODO: Implement advanced winner logic
    };

    const attributes = [
        { label: 'Nutrition Grade', key: 'nutrition_grades', format: (v: string) => v?.toUpperCase() || '?' },
        { label: 'Brand', key: 'brand', format: (v: string) => v },
        { label: 'Energy (kcal)', key: 'energy-kcal_100g', path: 'nutriments', unit: 'kcal' },
        { label: 'Fat', key: 'fat_100g', path: 'nutriments', unit: 'g' },
        { label: 'Saturated Fat', key: 'saturated-fat_100g', path: 'nutriments', unit: 'g' },
        { label: 'Sugars', key: 'sugars_100g', path: 'nutriments', unit: 'g' },
        { label: 'Salt', key: 'salt_100g', path: 'nutriments', unit: 'g' },
        { label: 'Proteins', key: 'proteins_100g', path: 'nutriments', unit: 'g' },
        { label: 'Fiber', key: 'fiber_100g', path: 'nutriments', unit: 'g' },
    ];

    const getValue = (product: ProductData, attr: any) => {
        if (attr.key === 'nutrition_grades') return product.nutrition_grades;
        if (attr.key === 'brand') return product.brand;
        if (attr.path === 'nutriments' && product.nutriments) {
            return product.nutriments[attr.key] ? `${Math.round(product.nutriments[attr.key])}${attr.unit}` : '-';
        }
        return '-';
    };

    return (
        <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'background.default' }}>
            <Container maxWidth="xl">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    sx={{ mb: 4 }}
                >
                    Back to Search
                </Button>

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Product Comparison
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
                    Comparing {selectedProducts.length} items side-by-side
                </Typography>

                <Box sx={{ overflowX: 'auto', pb: 2 }}>
                    <Box sx={{ minWidth: 600, display: 'grid', gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)`, gap: 2 }}>

                        {/* Header Row (Product Info) */}
                        <Box sx={{ p: 2 }} /> {/* Empty corner cell */}
                        {selectedProducts.map((product) => (
                            <Paper key={product.id} sx={{ p: 3, textAlign: 'center', position: 'relative' }}>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeFromCompare(product.id)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                >
                                    <Box sx={{ fontSize: 20 }}>×</Box>
                                </IconButton>
                                <Box
                                    component="img"
                                    src={product.image}
                                    alt={product.name}
                                    sx={{ width: 120, height: 120, objectFit: 'contain', mb: 2, borderRadius: 2 }}
                                />
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', mb: 1 }}>
                                    {product.name}
                                </Typography>
                                <Chip
                                    label={`Grade ${product.nutrition_grades?.toUpperCase()}`}
                                    color={
                                        product.nutrition_grades === 'a' || product.nutrition_grades === 'b' ? 'success' :
                                            product.nutrition_grades === 'c' ? 'warning' : 'error'
                                    }
                                    size="small"
                                />
                            </Paper>
                        ))}

                        {/* Attribute Rows */}
                        {attributes.map((attr) => (
                            <React.Fragment key={attr.label}>
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {attr.label}
                                </Box>
                                {selectedProducts.map((product) => (
                                    <Box key={`${product.id}-${attr.label}`} sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="body1">
                                            {getValue(product, attr)}
                                        </Typography>
                                    </Box>
                                ))}
                            </React.Fragment>
                        ))}

                    </Box>
                </Box>

            </Container>
        </Box>
    );
}
