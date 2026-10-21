import pool from "../config/database.js";

export async function createPurchase(pageAccess, accessToken) {
    const result = await pool.query(
        `
        INSERT INTO purchases (
            page_access,
            access_token,
            status
        )
        VALUES ($1, $2, 'pending')
        RETURNING *
        `,
        [ pageAccess, accessToken ]
    );

    return result.rows[0];
};


export async function markPurchaseAsPaid(data) {
    // Garante que o ID do PaymentIntent seja sempre uma string
    const paymentIntentId = typeof data.stripePaymentIntentId === "object"
        ? data.stripePaymentIntentId?.id
        : data.stripePaymentIntentId;

    const result = await pool.query(
        `
        UPDATE purchases
        SET
            page_access = $1,
            name = $2,
            email = $3,
            currency = $4,
            amount_subtotal = $5,
            amount_total = $6,
            stripe_session_id = $7,
            stripe_payment_intent_id = $8,
            status = 'paid',
            paid_at = NOW()
        WHERE access_token = $9
        RETURNING *
        `,
        [   
            data.pageAccess,
            data.name,
            data.email,
            data.currency,
            data.amount_subtotal,
            data.amount_total,
            data.stripeSessionId,
            paymentIntentId,
            data.accessToken
        ]
    );

    return result.rows[0];
};

export async function findPaidPurchaseByStripeSessionId(stripeSessionId) {
    const result = await pool.query(
        `
        SELECT
            id,
            page_access,
            name,
            email,
            stripe_session_id,
            stripe_payment_intent_id,
            amount_total,
            amount_subtotal,
            currency,
            status,
            created_at,
            paid_at
        FROM purchases
        WHERE stripe_session_id = $1
          AND status = 'paid'
        LIMIT 1
        `,
        [stripeSessionId]
    );

    return result.rows[0] || null;
};
