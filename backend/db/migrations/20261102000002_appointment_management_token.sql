-- migrate:up
ALTER TABLE appointments
  ADD COLUMN management_token TEXT;

UPDATE appointments
SET management_token = gen_random_uuid()::text
WHERE management_token IS NULL;

ALTER TABLE appointments
  ALTER COLUMN management_token SET NOT NULL;

CREATE UNIQUE INDEX appointments_management_token_idx
  ON appointments (management_token);

DROP TABLE IF EXISTS appointment_customer_access_sessions;
DROP TABLE IF EXISTS appointment_customer_access_codes;

-- migrate:down
DROP INDEX IF EXISTS appointments_management_token_idx;
ALTER TABLE appointments
  DROP COLUMN IF EXISTS management_token;
