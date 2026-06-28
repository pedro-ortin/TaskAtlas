# Petrus · Task Atlas

Gestor de tareas para la marca de marroquinería artesanal **Petrus**.  
Stack: **React 18 + Vite · Supabase (persistencia) · Netlify (hosting)**.

---

## 1 · Configurar Supabase

Abre [supabase.com](https://supabase.com) → tu proyecto → **SQL Editor** y ejecuta:

```sql
-- Tabla de estado (una fila por clave)
CREATE TABLE IF NOT EXISTS atlas_state (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE atlas_state ENABLE ROW LEVEL SECURITY;

-- Política de acceso total (app personal, sin autenticación)
-- Si en el futuro añades login, cambia USING (true) por USING (auth.uid() IS NOT NULL)
CREATE POLICY "allow all"
  ON atlas_state
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

> **¿Dónde encuentro mis credenciales?**  
> Supabase → proyecto → **Settings → API** → `URL` y `anon public key`.

---

## 2 · Instalar y ejecutar en local

```bash
# 1. Clona el repo
git clone https://github.com/TU_USUARIO/petrus-atlas.git
cd petrus-atlas

# 2. Copia el fichero de entorno y rellena tus credenciales
cp .env.example .env
# Edita .env y pon tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# 3. Instala dependencias
npm install

# 4. Arranca en desarrollo
npm run dev
# → http://localhost:5173
```

---

## 3 · Subir a GitHub

```bash
cd petrus-atlas

git init
git add .
git commit -m "feat: Petrus Task Atlas v1"

# Crea un repo en github.com (vacío, sin README)
git remote add origin https://github.com/TU_USUARIO/petrus-atlas.git
git branch -M main
git push -u origin main
```

> ⚠️ El fichero `.env` está en `.gitignore` — **nunca se sube al repo**.  
> Las credenciales reales las configurarás en Netlify (paso 4).

---

## 4 · Desplegar en Netlify

### Opción A — Interfaz web (recomendado)

1. Ve a [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Conecta tu cuenta de GitHub y selecciona el repo `petrus-atlas`.
3. Netlify detecta automáticamente la config de `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. En **Site settings → Environment variables** añade:
   ```
   VITE_SUPABASE_URL      = https://brwdjffrjgxkbomskeel.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Pulsa **Deploy site**. En ~1 minuto tendrás la URL pública.

### Opción B — CLI de Netlify

```bash
npm install -g netlify-cli

netlify login
netlify init          # sigue el asistente, elige "Create & configure a new site"

# Configura las variables de entorno
netlify env:set VITE_SUPABASE_URL "https://brwdjffrjgxkbomskeel.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Build y deploy
npm run build
netlify deploy --prod --dir=dist
```

---

## 5 · Actualizaciones futuras

Cada `git push` a `main` dispara un redeploy automático en Netlify.

```bash
# Flujo habitual
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# Netlify despliega en ~30 segundos
```

---

## Estructura del proyecto

```
petrus-atlas/
├── index.html              # Punto de entrada HTML
├── vite.config.js          # Configuración de Vite
├── netlify.toml            # Config de despliegue + SPA redirect
├── package.json
├── .env                    # Credenciales (NO subir a git)
├── .env.example            # Plantilla de credenciales
├── .gitignore
└── src/
    ├── main.jsx            # Bootstrap de React
    ├── TaskAtlas.jsx       # App principal (toda la UI)
    ├── storage.js          # Capa de persistencia Supabase
    └── supabaseClient.js   # Cliente Supabase (singleton)
```

---

## Notas técnicas

- **Persistencia**: toda la app se guarda en una única fila JSONB en Supabase (`atlas_state`). El guardado está _debounced_ 800 ms para no saturar la base de datos.
- **Sin autenticación**: la política RLS es `USING (true)` — cualquiera con la URL puede leer/escribir. Para una app con múltiples usuarios, añade autenticación Supabase y cambia la política.
- **Colecciones editables**: el botón **⚙ Fases** en la barra Kanban permite crear, renombrar (propagando el cambio a todas las tareas), recolorear y eliminar colecciones.
- **Fuentes**: Inter + Fraunces vía Google Fonts (requiere conexión a internet).
