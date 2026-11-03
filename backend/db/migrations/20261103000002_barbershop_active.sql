-- migrate:up
ALTER TABLE barbershops
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- migrate:down
ALTER TABLE barbershops
  DROP COLUMN IF EXISTS is_active;
