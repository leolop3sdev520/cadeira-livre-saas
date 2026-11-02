-- migrate:up

-- ⚠️ O CORAÇÃO DO PROJETO: impossibilita double-booking no nível do banco.
--    'professional_id WITH ='  → só conflita no MESMO profissional.
--    'tstzrange(..., '[)')'    → intervalo semi-aberto (fim exclusivo, não colide com o próximo início).
--    'WITH &&'                 → operador de sobreposição do PostgreSQL.
--    'WHERE status = confirmed'→ cancelados/concluídos não bloqueiam horário.
ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_confirmed_appointments
EXCLUDE USING gist (
  professional_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status = 'confirmed');

-- ─── Índices de apoio ────────────────────────────────────
CREATE INDEX idx_appointments_professional_start
  ON appointments (professional_id, start_time);

CREATE INDEX idx_appointments_status_start
  ON appointments (status, start_time);

CREATE INDEX idx_working_hours_professional_active
  ON working_hours (professional_id, weekday)
  WHERE is_active;

CREATE INDEX idx_time_off_professional_range
  ON time_off (professional_id, start_time);

-- migrate:down
DROP INDEX IF EXISTS idx_time_off_professional_range;
DROP INDEX IF EXISTS idx_working_hours_professional_active;
DROP INDEX IF EXISTS idx_appointments_status_start;
DROP INDEX IF EXISTS idx_appointments_professional_start;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_appointments;
