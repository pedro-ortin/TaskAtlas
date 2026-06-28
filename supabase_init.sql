-- ============================================================
-- Petrus · Task Atlas — Inicialización de Supabase
-- Ejecutar en: Supabase → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS atlas_state (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE atlas_state ENABLE ROW LEVEL SECURITY;

-- Política de acceso abierto (app personal sin login)
-- Para añadir autenticación, sustituir USING (true) por:
--   USING (auth.uid() IS NOT NULL)
CREATE POLICY "allow all"
  ON atlas_state
  FOR ALL
  USING (true)
  WITH CHECK (true);
