/**
 * PC Builder Types
 * TypeScript interfaces for the PC Geek Builder module
 */

// PC Component types
export type PCComponentType = 'cpu' | 'gpu' | 'ram' | 'motherboard' | 'psu' | 'case' | 'storage' | 'cooler';

export interface PCComponent {
    type: PCComponentType;
    name: string;
    brand: string;
    specifications: Record<string, string | number>;
    price?: number;
    priceSource?: string;
    priceUrl?: string;
}

export interface PCBuildMetrics {
    bottleneckScore: number;      // 0-100, lower is better
    estimatedWattage: number;     // Total power draw in watts
    performanceScore?: number;    // Optional overall score
    compatibilityIssues?: string[];
}

export interface PCBuildComponents {
    cpu?: PCComponent;
    gpu?: PCComponent;
    ram?: PCComponent;
    motherboard?: PCComponent;
    psu?: PCComponent;
    case?: PCComponent;
    storage?: PCComponent;
    cooler?: PCComponent;
}

export interface SavedBuild {
    id?: string;
    userId: string;
    buildName: string;
    buildType: 'budget' | 'hardware'; // Budget slider vs. existing hardware
    components: PCBuildComponents;
    metrics: PCBuildMetrics;
    totalPrice: number;
    userInput: {
        budget?: number;
        existingHardware?: string;
        location?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// API Request/Response types
export interface GenerateBuildRequest {
    mode: 'budget' | 'hardware';
    budget?: number;           // For budget mode (in USD)
    existingHardware?: string; // For hardware mode (e.g., "RTX 4070")
    location?: string;         // For price searches
}

export interface GenerateBuildResponse {
    success: boolean;
    build?: SavedBuild;
    error?: string;
}

// GitHub Models AI Response format
export interface GrokBuildResponse {
    cpu: Omit<PCComponent, 'type'>;
    gpu: Omit<PCComponent, 'type'>;
    ram: Omit<PCComponent, 'type'>;
    motherboard: Omit<PCComponent, 'type'>;
    psu: Omit<PCComponent, 'type'>;
    case: Omit<PCComponent, 'type'>;
    storage?: Omit<PCComponent, 'type'>;
    cooler?: Omit<PCComponent, 'type'>;
    bottleneckScore?: number;
    estimatedWattage?: number;
    reasoning?: string;
}
