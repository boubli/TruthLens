// Types for Free Access Request System

export type AccessCodeTier = 'plus' | 'pro' | 'ultimate';

export interface AccessCode {
    id: string;
    code: string;
    tier: AccessCodeTier; // Which tier this code grants
    type: 'student' | 'general';
    usageLimit: number;
    usedCount: number;
    expiresAt: Date | null;
    createdBy: string;
    createdAt: Date;
    active: boolean;
}

export interface FreeAccessRequest {
    id: string;
    userId: string;
    fullName: string;
    username: string;
    email: string;
    useAccountEmail: boolean;
    phone: string;
    reason: string;
    codeUsed: string;
    codeTier: AccessCodeTier; // Tier granted by the code
    isStudent: boolean;
    studentProofUrl: string | null;
    status: 'pending' | 'approved' | 'denied';
    denialReason: string | null;
    createdAt: Date;
    processedAt: Date | null;
    processedBy: string | null;
    accessExpiresAt: Date | null; // 3 months from approval
}

export interface UserNotification {
    id: string;
    userId: string;
    type: 'access_approved' | 'access_denied' | 'access_expiring' | 'support_message';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    metadata?: {
        requestId?: string;
        tier?: AccessCodeTier;
        expiresAt?: Date;
    };
}
