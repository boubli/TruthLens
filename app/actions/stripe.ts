'use server';

import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is missing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia' as any, // Suppress version mismatch
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface CreateCheckoutSessionParams {
    userId: string;
    userEmail: string;
    tier: 'plus' | 'pro' | 'ultimate';
    billingCycle: 'monthly' | 'lifetime';
}

export async function createCheckoutSession({
    userId,
    userEmail,
    tier,
    billingCycle,
}: CreateCheckoutSessionParams) {
    try {
        if (!userId || !userEmail) {
            throw new Error('Missing user information');
        }

        // Define Product/Price Data dynamically
        // Ideally, these are defined in Stripe Dashboard and we use Price IDs.
        // For dynamic/ad-hoc generation ensuring strict pricing:

        let priceAmount = 0;
        let productName = `TruthLens ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;

        // Pricing Map (Matches systemService.ts defaults)
        const prices = {
            plus: { monthly: 399, lifetime: 1999 }, // In cents
            pro: { monthly: 799, lifetime: 4999 },
            ultimate: { monthly: 1499, lifetime: 7999 }
        };

        if (prices[tier]) {
            priceAmount = prices[tier][billingCycle];
        } else {
            throw new Error('Invalid tier');
        }

        // Construct line item
        const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
            quantity: 1,
            price_data: {
                currency: 'usd',
                product_data: {
                    name: productName,
                    description: `${billingCycle === 'monthly' ? 'Monthly Subscription' : 'Lifetime Access'} - ${productName}`,
                    metadata: {
                        tier,
                        billingCycle
                    }
                },
                unit_amount: priceAmount,
            },
        };

        if (billingCycle === 'monthly') {
            lineItem.price_data!.recurring = {
                interval: 'month',
            };
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [lineItem],
            mode: billingCycle === 'monthly' ? 'subscription' : 'payment',
            success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/upgrade`,
            customer_email: userEmail,
            metadata: {
                userId,
                tier,
                billingCycle,
                type: 'paid'
            },
        });

        return { sessionId: session.id, url: session.url };
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        throw new Error(error.message || 'Failed to initiate checkout');
    }
}

export async function verifyStripeSession(sessionId: string) {
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            return {
                success: true,
                metadata: session.metadata
            };
        }

        return { success: false };
    } catch (error) {
        console.error('Verify Session Error:', error);
        return { success: false };
    }
}

export async function finalizeUpgradeAction(userId: string, tier: 'plus' | 'pro' | 'ultimate', billingCycle: 'monthly' | 'lifetime') {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY || !adminDb || !adminAuth) {
            console.error('FIREBASE_SERVICE_ACCOUNT_KEY missing for upgrade');
            return { success: false, error: 'Internal config error' };
        }

        console.log(`[STRIPE] Finalizing upgrade for ${userId} to ${tier} (${billingCycle})`);

        // 1. Update User Subscription in Firestore (Using Admin SDK -> bypasses rules)
        await adminDb.collection('users').doc(userId).set({
            subscription: {
                tier,
                startDate: new Date(), // Now
                endDate: billingCycle === 'monthly'
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
                    : null, // Lifetime
                autoRenew: billingCycle === 'monthly',
            }
        }, { merge: true });

        // 2. Record Transaction
        await adminDb.collection('paymentRequests').add({
            userId,
            tier,
            billingCycle,
            type: 'paid',
            status: 'completed',
            provider: 'stripe',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 3. Set Custom Claim
        await adminAuth.setCustomUserClaims(userId, { tier });

        return { success: true };
    } catch (error: any) {
        console.error('Finalize Upgrade Error:', error);
        return { success: false, error: error.message };
    }
}
