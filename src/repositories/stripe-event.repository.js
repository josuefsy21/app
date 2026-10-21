import pool from "../config/database.js";


export async function createStripeEvent({ stripeEventId, eventType, payload }) {

    const result = await pool.query(
        `
        INSERT INTO stripe_events (
            stripe_event_id,
            event_type,
            payload
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (stripe_event_id)
        DO NOTHING
        RETURNING *
        `,
        [ stripeEventId, eventType, payload ]
    );

    return result.rows[0] || null;
};
