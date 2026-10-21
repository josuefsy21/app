CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_access VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    access_token VARCHAR(64) NOT NULL UNIQUE,
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    amount_total INTEGER,
    amount_subtotal INTEGER,
    currency VARCHAR(3),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT purchases_status_check
        CHECK (
            status IN (
                'pending',
                'paid',
                'failed',
                'refunded',
                'cancelled'
            )
        )
);


CREATE INDEX IF NOT EXISTS idx_purchases_page_access
    ON purchases(page_access);

CREATE INDEX IF NOT EXISTS idx_purchases_email
    ON purchases(email);

CREATE INDEX IF NOT EXISTS idx_purchases_status
    ON purchases(status);

CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent_id
    ON purchases(stripe_payment_intent_id);


CREATE TABLE IF NOT EXISTS access_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL
        REFERENCES purchases(id)
        ON DELETE CASCADE,
    session_token VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);


CREATE INDEX IF NOT EXISTS idx_access_sessions_purchase_id
    ON access_sessions(purchase_id);

CREATE INDEX IF NOT EXISTS idx_access_sessions_session_token
    ON access_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_access_sessions_expires_at
    ON access_sessions(expires_at);


CREATE TABLE IF NOT EXISTS stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(255) NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);


CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type
    ON stripe_events(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_events_processed
    ON stripe_events(processed);


CREATE TABLE IF NOT EXISTS access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_id UUID NOT NULL
        REFERENCES purchases(id)
        ON DELETE CASCADE,

    token_hash VARCHAR(128) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_tokens_purchase_id
    ON access_tokens(purchase_id);

CREATE INDEX IF NOT EXISTS idx_access_tokens_expires_at
    ON access_tokens(expires_at);


CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS purchases_updated_at
ON purchases;

CREATE TRIGGER purchases_updated_at

BEFORE UPDATE ON purchases

FOR EACH ROW

EXECUTE FUNCTION set_updated_at();
