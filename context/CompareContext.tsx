'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProductData } from '@/services/productService';

interface CompareContextType {
    selectedProducts: ProductData[];
    addToCompare: (product: ProductData) => void;
    removeFromCompare: (productId: string) => void;
    clearComparison: () => void;
    isInComparison: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
    const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);

    const addToCompare = (product: ProductData) => {
        if (selectedProducts.length >= 3) {
            // Ideally show a toast here, but for now just don't add
            return;
        }
        if (!selectedProducts.find((p) => p.id === product.id)) {
            setSelectedProducts((prev) => [...prev, product]);
        }
    };

    const removeFromCompare = (productId: string) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
    };

    const clearComparison = () => {
        setSelectedProducts([]);
    };

    const isInComparison = (productId: string) => {
        return selectedProducts.some((p) => p.id === productId);
    };

    return (
        <CompareContext.Provider
            value={{
                selectedProducts,
                addToCompare,
                removeFromCompare,
                clearComparison,
                isInComparison,
            }}
        >
            {children}
        </CompareContext.Provider>
    );
};

export const useCompare = () => {
    const context = useContext(CompareContext);
    if (context === undefined) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
};
