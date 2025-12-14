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
        existingHardware?: HardwareInput;
        location?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface HardwareInput {
    cpu?: string;
    gpu?: string;
    ram?: string;
    motherboard?: string;
    psu?: string;
    case?: string;
    storage?: string;
    cooler?: string;
}

// API Request/Response types
export interface GenerateBuildRequest {
    mode: 'budget' | 'hardware';
    budget?: number;           // For budget mode (in USD)
    existingHardware?: HardwareInput; // Structured input for better AI context
    location?: string;         // For price searches
}

export interface GenerateBuildResponse {
    success: boolean;
    build?: SavedBuild;
    error?: string;
}

// --- PC Build Request Service (Pro Consultation) ---

export type PCBuildRequestStatus = 'pending_payment' | 'paid_pending_form' | 'submitted' | 'reviewing' | 'completed';

export interface PCBuildFormData {
    budget: number;
    currency: string;
    country: string;
    usage: string; // e.g., "Gaming", "Productivity"
    preferences: string; // Free text
    monitors: number;
    resolution: string; // e.g. "1440p", "4K"
    peripherals: string[]; // e.g. ["Mouse", "Keyboard"]
}

export interface AdminBuildResponse {
    buildName: string;
    totalPrice: number;
    components: PCComponent[];
    adminNotes: string;
    youtubeLink: string;
    purchaseLinks?: string[];
    createdAt: string; // ISO String
}

export interface PCBuildRequest {
    userId: string;
    userEmail: string;
    status: PCBuildRequestStatus;
    paymentId?: string;
    amount?: number; // In cents
    formData?: PCBuildFormData;
    adminResponse?: AdminBuildResponse;
    createdAt: Date;
    updatedAt: Date;
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
