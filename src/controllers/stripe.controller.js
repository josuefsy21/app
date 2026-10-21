import 'dotenv/config';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

import { createPurchase, markPurchaseAsPaid } from "../repositories/purchase.repository.js";
import { createStripeEvent } from '../repositories/stripe-event.repository.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckout(req, res) {
    try {
        const pagaAccess = "premium";

        const accessToken = uuidv4();

        await createPurchase(pagaAccess, accessToken);

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',

            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Unlock Premium Content",
                            images: [`${process.env.APP_URL}/images/unlock.png`]
                        },
                        unit_amount: 599
                    },
                    quantity: 1
                }
            ],

            metadata: {
                access_token: accessToken,
                page_access: pagaAccess
            },

            success_url:
                `${process.env.APP_URL}/${pagaAccess}/success?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
                `${process.env.APP_URL}/`,

        });

        return res.json({ url: session.url });

    } catch (error) {

        console.error(
            error
        );

        return res.status(500).json({
            error: 'Internal Error'
        });
    }
}

export async function stripeWebhook(req, res) {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error(error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        const eventCreated = await createStripeEvent({
            stripeEventId: event.id,
            eventType: event.type,
            payload: event
        });

        if (!eventCreated) {
            return res.status(200).json({ received: true, duplicate: true });
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const accessToken = session.metadata?.access_token;
                const pageAccess = session.metadata?.page_access;

                if (!accessToken) {
                    console.error('Webhook sem access_token:', session.id);
                    break;
                }

                if (session.payment_status !== 'paid') {
                    break;
                }

                const data = {
                    accessToken,
                    pageAccess,
                    name: session.customer_details?.name,
                    email: session.customer_details?.email,
                    currency: session.currency,
                    amount_subtotal: session.amount_subtotal,
                    amount_total: session.amount_total,
                    stripeSessionId: session.id,
                    stripePaymentIntentId: session.payment_intent
                };

                await markPurchaseAsPaid(data);

                break;
            }

            default:
                break;
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Error', error);
        return res.status(500);
    }
}
