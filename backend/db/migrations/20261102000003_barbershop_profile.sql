-- migrate:up
ALTER TABLE barbershops
  ADD COLUMN logo_url TEXT,
  ADD COLUMN address TEXT,
  ADD COLUMN phone TEXT;

-- migrate:down
ALTER TABLE barbershops
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS logo_url;
