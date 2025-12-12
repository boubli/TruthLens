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

// --- PC Build Consultation Actions ---

export async function createConsultationCheckout(userId: string, userEmail: string) {
    try {
        if (!userId || !userEmail) throw new Error('Missing user info');

        if (!adminDb) throw new Error('Db not init');

        // 1. Fetch Dynamic Price from System Settings
        const settingsSnap = await adminDb.collection('system').doc('settings').get();
        const settings = settingsSnap.data() as any; // Cast as needed or import type if shared

        // Default to 20.00 USD (2000 cents) if not set
        const priceAmount = settings?.pcConsultationPrice || 2000;

        const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
            quantity: 1,
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'PC Build Expert Consultation',
                    description: 'Custom PC configuration by TruthLens experts',
                    metadata: {
                        type: 'pc_consultation'
                    }
                },
                unit_amount: priceAmount,
            },
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [lineItem],
            mode: 'payment',
            success_url: `${APP_URL}/pc-builder?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/pc-builder?payment=cancelled`, // Return to builder
            customer_email: userEmail,
            metadata: {
                userId,
                type: 'pc_consultation'
            },
        });

        return { sessionId: session.id, url: session.url };
    } catch (error: any) {
        console.error('Consultation Checkout Error:', error);
        throw new Error(error.message || 'Failed to initiate checkout');
    }
}

export async function verifyPaymentAndCreateRequest(sessionId: string) {
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid' && session.metadata?.type === 'pc_consultation') {
            const userId = session.metadata.userId;
            const amount = session.amount_total || 2000;

            if (!userId) throw new Error('No User ID in session metadata');

            if (!adminDb) throw new Error('Db not init');

            console.log(`[STRIPE] Creating PC Build Request for ${userId}`);

            // Create initial request document
            // Check if exists first? We can just set/merge.
            // Status: 'paid_pending_form'
            const requestRef = adminDb.collection('pc_build_requests').doc(userId);

            // We use set with merge: true to avoid overwriting if they somehow paid twice or to be safe,
            // but effectively this resets the status to allow them to fill the form.
            await requestRef.set({
                userId,
                userEmail: session.customer_details?.email || session.customer_email || '',
                status: 'paid_pending_form',
                paymentId: session.payment_intent as string,
                amount: amount,
                updatedAt: new Date(),
                // Only set createdAt if new
            }, { merge: true });

            // If createdAt doesn't exist, set it (using update or specialized set logic, 
            // but Firestore 'merge' doesn't selectively ignore fields if doc missing.
            // Simpler: Just read and see.
            const doc = await requestRef.get();
            if (!doc.data()?.createdAt) {
                await requestRef.set({ createdAt: new Date() }, { merge: true });
            }

            return { success: true };
        }

        return { success: false, error: 'Payment not successful or invalid type' };
    } catch (error: any) {
        console.error('Verify Consultation Error:', error);
        return { success: false, error: error.message };
    }
}
