import { Timestamp } from 'firebase/firestore';
import { UserTier } from '@/types/user';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface PaymentRequest {
    id?: string;
    userId: string;
    userEmail: string;
    userName: string;
    tier: UserTier;
    price: number;
    billingCycle?: 'monthly' | 'lifetime';
    type?: 'manual' | 'paid';
    status: PaymentStatus;
    paypalOrderId?: string;
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    approvedBy?: string; // Admin UID
    approvedAt?: Date | Timestamp;
    rejectedReason?: string;
    rejectedAt?: Date | Timestamp;
}

export interface PaymentRequestCreate extends Omit<PaymentRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
    // For creating new payment requests
}
