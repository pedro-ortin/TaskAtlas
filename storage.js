/**
 * useAtlasStorage
 * ---------------
 * Reemplaza window.storage por Supabase.
 * Usa una tabla `atlas_state` con una única fila por clave:
 *
 *   CREATE TABLE atlas_state (
 *     key   TEXT PRIMARY KEY,
 *     value JSONB NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT now()
 *   );
 *   ALTER TABLE atlas_state ENABLE ROW LEVEL SECURITY;
 *   -- Acceso sin autenticación (aplicación personal):
 *   CREATE POLICY "allow all" ON atlas_state FOR ALL USING (true) WITH CHECK (true);
 *
 * Si prefieres autenticación, añade `auth.uid()` a las políticas y
 * envuelve <App> con un proveedor de sesión.
 */

import { supabase } from "./supabaseClient";

const TABLE = "atlas_state";
const ROW_KEY = "petrus-marroquineria";

export async function loadState() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("value")
    .eq("key", ROW_KEY)
    .maybeSingle();

  if (error) throw error;
  return data?.value ?? null; // ya es JSON (JSONB de Supabase)
}

export async function saveState(state) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key: ROW_KEY, value: state, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) throw error;
}
