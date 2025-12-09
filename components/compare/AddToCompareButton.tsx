'use client';

import React, { useState } from 'react';
import { IconButton, Tooltip, Zoom, Snackbar, Alert } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCompare } from '@/context/CompareContext';
import { ProductData } from '@/services/productService';

interface AddToCompareButtonProps {
    product: ProductData;
}

export default function AddToCompareButton({ product }: AddToCompareButtonProps) {
    const { addToCompare, removeFromCompare, isInComparison, selectedProducts } = useCompare();
    const isSelected = isInComparison(product.id);
    const isFull = selectedProducts.length >= 3;

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSelected) {
            removeFromCompare(product.id);
            setSnackbar({ open: true, message: 'Removed from comparison', severity: 'success' });
        } else {
            if (isFull) {
                setSnackbar({ open: true, message: 'Maximum 3 products can be compared', severity: 'warning' });
                return;
            }
            addToCompare(product);
            setSnackbar({ open: true, message: 'Added to comparison', severity: 'success' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Tooltip title={isSelected ? "Remove from comparison" : isFull ? "Comparison list full (max 3)" : "Compare"}>
                <IconButton
                    onClick={handleClick}
                    color={isSelected ? "success" : "default"}
                    sx={{
                        bgcolor: isSelected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                            bgcolor: isSelected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                        }
                    }}
                    disabled={!isSelected && isFull}
                >
                    {isSelected ? <CheckCircleIcon /> : <CompareArrowsIcon />}
                </IconButton>
            </Tooltip>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
