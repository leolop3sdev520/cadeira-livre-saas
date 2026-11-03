-- migrate:up
CREATE TABLE appointment_customer_access_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id   UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  customer_email  TEXT NOT NULL,
  code_hash       TEXT NOT NULL,
  request_ip      TEXT NOT NULL,
  attempts        SMALLINT NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);

CREATE INDEX appointment_customer_access_lookup_idx
  ON appointment_customer_access_codes (barbershop_id, customer_email, created_at DESC);

CREATE INDEX appointment_customer_access_ip_idx
  ON appointment_customer_access_codes (request_ip, created_at DESC);

CREATE TABLE appointment_customer_access_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id   UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  customer_email  TEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  CHECK (expires_at > created_at)
);

CREATE INDEX appointment_customer_access_sessions_expiry_idx
  ON appointment_customer_access_sessions (expires_at);

-- migrate:down
DROP TABLE IF EXISTS appointment_customer_access_sessions;
DROP TABLE IF EXISTS appointment_customer_access_codes;
