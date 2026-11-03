-- migrate:up
ALTER TABLE professionals
  DROP CONSTRAINT IF EXISTS professionals_email_key;

-- migrate:down
ALTER TABLE professionals
  ADD CONSTRAINT professionals_email_key UNIQUE (email);
