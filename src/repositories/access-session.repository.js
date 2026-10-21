import pool from "../config/database.js";

export async function createAccessSession({ purchaseId, sessionToken, expiresAt }) {//*

    const result = await pool.query(
        `
        INSERT INTO access_sessions (
            purchase_id,
            session_token,
            expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            purchaseId,
            sessionToken,
            expiresAt
        ]
    );

    return result.rows[0];
}


export async function findAccessSession( sessionToken ) {//*

    const result = await pool.query(
        `
        SELECT
            access_sessions.*,
            purchases.page_access,
            purchases.email,
            purchases.status AS purchase_status
        FROM access_sessions
        INNER JOIN purchases
            ON purchases.id = access_sessions.purchase_id
        WHERE access_sessions.session_token = $1
        LIMIT 1
        `,
        [sessionToken]
    );

    return result.rows[0] || null;
}

export async function updateLastUsedAt( sessionToken ) {//*

    await pool.query(
        `
        UPDATE access_sessions
        SET last_used_at = NOW()
        WHERE session_token = $1
        `,
        [sessionToken]
    );
}
