-- migrate:up
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- migrate:down
DROP EXTENSION IF EXISTS btree_gist;