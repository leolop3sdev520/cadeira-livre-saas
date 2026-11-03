-- migrate:up
ALTER TABLE barbershops
  ADD COLUMN plan TEXT NOT NULL DEFAULT 'equipe'
  CHECK (plan IN ('solo', 'equipe'));

-- migrate:down
ALTER TABLE barbershops
  DROP COLUMN IF EXISTS plan;
