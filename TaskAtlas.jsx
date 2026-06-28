import React, { useState, useEffect, useMemo, useRef } from "react";
import { loadState, saveState } from "./storage.js";

/* ------------------------------------------------------------------ *
 * Petrus · Task Atlas — v5 (standalone)
 * Foco · Mapa · Kanban · Gantt
 * Colecciones editables · Subtareas/mini-hitos · Etiquetas
 * Dependencias · Gantt arrastrable · Columnas configurables
 * Recurrencia · Notas/enlaces · Modo oscuro · Modo compacto
 * Persistencia: Supabase (tabla atlas_state)
 * ------------------------------------------------------------------ */

/* colecciones por defecto — el usuario puede añadir/renombrar/eliminar */
const DEFAULT_COLLECTIONS = [
  { id: "c0", label: "Fase 0 · Fundamentos", color: "#5F7355" },
  { id: "c1", label: "Fase 1 · Nombre",      color: "#8B5E3C" },
  { id: "c2", label: "Fase 2 · Identidad",   color: "#A6703C" },
  { id: "c3", label: "Fase 3 · Producción",  color: "#7A6240" },
  { id: "c4", label: "Fase 4 · Canales",     color: "#4A7C8C" },
  { id: "c5", label: "Fase 5 · Legal",       color: "#6B5B8C" },
];

const TYPES = {
  product: { label: "Producción / Producto", color: "#A6703C", soft: "#F1E4D5" },
  client: { label: "Marca / Identidad", color: "#8B5E3C", soft: "#ECE0D4" },
  internal: { label: "Negocio / Operación", color: "#5F7355", soft: "#E2E9DE" },
};

const DEFAULT_COLUMNS = [
  { id: "backlog", label: "Por hacer", done: false },
  { id: "progress", label: "En progreso", done: false },
  { id: "review", label: "En revisión", done: false },
  { id: "done", label: "Hecho", done: true },
];

const PRIORITIES = {
  urgent: { label: "Urgente", color: "#C0392B", rank: 4 },
  high: { label: "Alta", color: "#D2843A", rank: 3 },
  medium: { label: "Media", color: "#C2A23A", rank: 2 },
  low: { label: "Baja", color: "#8A93A0", rank: 1 },
};

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtShort = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : "—";
const fmtLong = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" }) : "—";
const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const addMonths = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };

const RECUR = { none: "No se repite", daily: "Diaria", weekly: "Semanal", monthly: "Mensual" };

function nextDates(task) {
  const r = task.recurrence;
  if (r === "daily") return { ns: addDays(task.startDate, 1), ne: addDays(task.endDate, 1) };
  if (r === "weekly") return { ns: addDays(task.startDate, 7), ne: addDays(task.endDate, 7) };
  if (r === "monthly") return { ns: addMonths(task.startDate, 1), ne: addMonths(task.endDate, 1) };
  return null;
}
function spawnClone(task, firstStatus) {
  const nd = nextDates(task);
  if (!nd) return null;
  const delta = daysBetween(task.startDate, nd.ns);
  return {
    ...task, id: uid(), createdAt: Date.now(), status: firstStatus || task.status,
    startDate: nd.ns, endDate: nd.ne,
    subtasks: (task.subtasks || []).map((s) => ({ ...s, done: false, due: s.due ? addDays(s.due, delta) : "" })),
  };
}

function seedTasks() {
  const t = todayISO();
  // ---- Roadmap Petrus · marca de marroquinería artesanal ----
  const f0a=uid(),f0b=uid(),f0c=uid(),f0d=uid(),f0e=uid();
  const f1a=uid(),f1b=uid(),f1c=uid(),f1d=uid(),f1e=uid(),f1f=uid(),f1g=uid();
  const f2a=uid(),f2b=uid(),f2c=uid(),f2d=uid(),f2e=uid();
  const f3a=uid(),f3b=uid(),f3c=uid(),f3d=uid(),f3e=uid(),f3f=uid();
  const f4a=uid(),f4b=uid(),f4c=uid(),f4d=uid();
  const f5a=uid(),f5b=uid(),f5c=uid();
  let n=0; const ord=()=>Date.now()+n++;
  const C0="Fase 0 · Fundamentos", C1="Fase 1 · Nombre", C2="Fase 2 · Identidad", C3="Fase 3 · Producción", C4="Fase 4 · Canales", C5="Fase 5 · Legal";
  const base = { tags: [], subtasks: [], deps: [], links: [], notes: "", recurrence: "none" };
  return [
    // FASE 0 — Fundamentos (completado)
    { ...base, id:f0a, title:"Definir la idea y el modelo de negocio", description:"Marroquinería artesanal. Inicio lean, inversión mínima.", type:"internal", collection:C0, status:"done", priority:"medium", startDate:addDays(t,-90), endDate:addDays(t,-86), tags:["estrategia"], createdAt:ord() },
    { ...base, id:f0b, title:"Seleccionar producto inicial", description:"Tarjeteros, llaveros y cinturones — baja complejidad técnica, buena imagen de marca.", type:"product", collection:C0, status:"done", priority:"medium", startDate:addDays(t,-88), endDate:addDays(t,-84), tags:["producto"], createdAt:ord() },
    { ...base, id:f0c, title:"Identificar proveedores de cuero", description:"Dos proveedores ya localizados.", type:"product", collection:C0, status:"done", priority:"medium", startDate:addDays(t,-84), endDate:addDays(t,-78), tags:["cuero","proveedores"], createdAt:ord() },
    { ...base, id:f0d, title:"Definir canales de venta", description:"Online (Etsy + Instagram), mercados locales (Mercado de Motores) y multimarca boutiques — los tres en paralelo.", type:"internal", collection:C0, status:"done", priority:"medium", startDate:addDays(t,-82), endDate:addDays(t,-78), tags:["ventas"], createdAt:ord() },
    { ...base, id:f0e, title:"Identificar presupuesto de herramientas", description:"Estimado: €350–500 para equipamiento inicial.", type:"product", collection:C0, status:"done", priority:"low", startDate:addDays(t,-80), endDate:addDays(t,-77), tags:["presupuesto"], createdAt:ord() },

    // FASE 1 — Nombre de marca (BLOQUEO ACTUAL)
    { ...base, id:f1a, title:"Primera ronda de candidatos", description:"Evaluados y descartados: Vero, Tagus, Pellis, Pell, Blackhide, Corium, Crudo, Coria, Nervio.", type:"client", collection:C1, status:"done", priority:"low", startDate:addDays(t,-75), endDate:addDays(t,-68), tags:["naming"], createdAt:ord() },
    { ...base, id:f1b, title:"Verificación de marca + SEO de candidatos", description:"Aprendizaje clave: un nombre libre en OEPM puede seguir siendo problemático si hay confusión de marca.", type:"client", collection:C1, status:"done", priority:"low", startDate:addDays(t,-70), endDate:addDays(t,-63), tags:["naming","seo"], createdAt:ord() },
    { ...base, id:f1c, title:"Definir dirección emocional y visual del nombre", description:"El ejercicio de 2 preguntas estaba desplegado pero sin respuesta. Hay que retomarlo para generar candidatos mejor orientados.", type:"client", collection:C1, status:"progress", priority:"urgent", startDate:addDays(t,-7), endDate:addDays(t,3), tags:["naming"], notes:"Bloqueo actual del roadmap: todo lo demás depende del nombre.", createdAt:ord() },
    { ...base, id:f1d, title:"Generar nueva tanda de candidatos", description:"Basada en la dirección emocional elegida.", type:"client", collection:C1, status:"backlog", priority:"high", startDate:addDays(t,4), endDate:addDays(t,8), tags:["naming"], deps:[f1c], createdAt:ord() },
    { ...base, id:f1e, title:"Seleccionar nombre finalista", description:"Debe pasar el filtro emocional (amor genuino) + verificación técnica.", type:"client", collection:C1, status:"backlog", priority:"high", startDate:addDays(t,9), endDate:addDays(t,12), tags:["naming"], deps:[f1d], createdAt:ord() },
    { ...base, id:f1f, title:"Verificar en OEPM clases 18 y 25", description:"También comprobar handles disponibles en Instagram, Etsy y dominio web.", type:"client", collection:C1, status:"backlog", priority:"high", startDate:addDays(t,13), endDate:addDays(t,16), tags:["oepm","legal"], deps:[f1e], notes:"Obligatorio antes de registrar la marca.", createdAt:ord() },
    { ...base, id:f1g, title:"Registrar la marca en OEPM", description:"Solicitud formal una vez confirmado el nombre. Tasa oficial ~170€ para dos clases.", type:"client", collection:C1, status:"backlog", priority:"high", startDate:addDays(t,17), endDate:addDays(t,30), tags:["oepm","legal"], deps:[f1f], createdAt:ord() },

    // FASE 2 — Identidad de marca
    { ...base, id:f2a, title:"Prototipo de identidad para Vero y Nervio", description:"Taglines, valores, persona objetivo, tono de voz y handles. Ejercicio reutilizable para el nombre definitivo.", type:"client", collection:C2, status:"done", priority:"low", startDate:addDays(t,-60), endDate:addDays(t,-52), tags:["identidad"], createdAt:ord() },
    { ...base, id:f2b, title:"Construir identidad completa sobre el nombre elegido", description:"Aplicar el mismo framework: propósito, valores, persona, tono, tagline.", type:"client", collection:C2, status:"backlog", priority:"high", startDate:addDays(t,13), endDate:addDays(t,20), tags:["identidad"], deps:[f1e], createdAt:ord() },
    { ...base, id:f2c, title:"Diseño de logo y elementos visuales", description:"Paleta, tipografía, textura. Puede hacerse con herramientas de IA o diseñador freelance.", type:"client", collection:C2, status:"backlog", priority:"medium", startDate:addDays(t,21), endDate:addDays(t,28), tags:["logo","diseño"], deps:[f2b], createdAt:ord() },
    { ...base, id:f2d, title:"Crear los handles y perfiles digitales", description:"Instagram, Etsy, dominio web (aunque sea de aparcamiento inicial).", type:"client", collection:C2, status:"backlog", priority:"medium", startDate:addDays(t,13), endDate:addDays(t,16), tags:["handles"], deps:[f1e], createdAt:ord() },
    { ...base, id:f2e, title:"Diseñar packaging y etiquetas", description:"Etiquetas de cuero o papel, bolsa/caja de presentación. Impacto alto en percepción artesanal.", type:"client", collection:C2, status:"backlog", priority:"medium", startDate:addDays(t,29), endDate:addDays(t,36), tags:["packaging"], deps:[f2c], createdAt:ord() },

    // FASE 3 — Producción y producto (paralelo)
    { ...base, id:f3a, title:"Adquirir herramientas y materiales", description:"Presupuesto estimado €350–500. Incluye cutter, punzones, hilo encerado, agujas, mallet, tinte, sellador de bordes.", type:"product", collection:C3, status:"backlog", priority:"high", startDate:addDays(t,12), endDate:addDays(t,17), tags:["herramientas"], createdAt:ord() },
    { ...base, id:f3b, title:"Comprar primera partida de cuero", description:"Con los dos proveedores ya identificados. Pedir muestras y comparar calidad/precio.", type:"product", collection:C3, status:"backlog", priority:"high", startDate:addDays(t,14), endDate:addDays(t,19), tags:["cuero"], createdAt:ord() },
    { ...base, id:f3c, title:"Producir prototipos de cada producto", description:"Al menos 2–3 unidades de tarjetero, llavero y cinturón para testear calidad y tiempo de fabricación.", type:"product", collection:C3, status:"backlog", priority:"high", startDate:addDays(t,20), endDate:addDays(t,28), tags:["prototipos"], deps:[f3a,f3b], createdAt:ord() },
    { ...base, id:f3d, title:"Fotografía de producto", description:"Fotos con luz natural sobre fondos neutros. Clave para Etsy e Instagram. Invertir tiempo aquí.", type:"product", collection:C3, status:"backlog", priority:"high", startDate:addDays(t,29), endDate:addDays(t,33), tags:["fotografía"], deps:[f3c], createdAt:ord() },
    { ...base, id:f3e, title:"Calcular precios y margen", description:"Coste de materiales + tiempo + overheads. Definir PVP para cada canal (Etsy tiene comisiones distintas a mercado físico).", type:"product", collection:C3, status:"backlog", priority:"medium", startDate:addDays(t,29), endDate:addDays(t,32), tags:["precios","margen"], deps:[f3c], createdAt:ord() },
    { ...base, id:f3f, title:"Producir stock inicial", description:"Pequeño lote de cada referencia para el primer mercado o primeras ventas online.", type:"product", collection:C3, status:"backlog", priority:"high", startDate:addDays(t,33), endDate:addDays(t,42), tags:["stock"], deps:[f3c,f3e], createdAt:ord() },

    // FASE 4 — Canales de venta
    { ...base, id:f4a, title:"Abrir tienda Etsy y publicar primeras fichas", description:"SEO de fichas, políticas de envío, fotos. Los primeros reviews son críticos — considerar regalo a conocidos para arrancar.", type:"internal", collection:C4, status:"backlog", priority:"high", startDate:addDays(t,43), endDate:addDays(t,49), tags:["etsy"], deps:[f3f,f2d,f3d], createdAt:ord() },
    { ...base, id:f4b, title:"Lanzar Instagram", description:"Publicar el proceso de fabricación (behind the scenes) antes del lanzamiento oficial. Genera audiencia anticipada.", type:"internal", collection:C4, status:"backlog", priority:"medium", startDate:addDays(t,17), endDate:addDays(t,44), tags:["instagram"], deps:[f2d], createdAt:ord() },
    { ...base, id:f4c, title:"Inscribirse en Mercado de Motores u otro mercado local", description:"Mercado de Motores: primer domingo de mes en Madrid Río. Verificar fechas y requisitos de inscripción.", type:"internal", collection:C4, status:"backlog", priority:"medium", startDate:addDays(t,43), endDate:addDays(t,46), tags:["mercado"], deps:[f3f], createdAt:ord() },
    { ...base, id:f4d, title:"Contactar multimarca boutiques", description:"Preparar dossier de marca (lookbook, precios wholesale, condiciones). Empezar por 2–3 tiendas target en Madrid.", type:"internal", collection:C4, status:"backlog", priority:"medium", startDate:addDays(t,43), endDate:addDays(t,52), tags:["wholesale","boutiques"], deps:[f3f,f2e], createdAt:ord() },

    // FASE 5 — Legal y fiscal (antes de la primera venta)
    { ...base, id:f5a, title:"Alta como autónomo o forma jurídica", description:"Evaluar si arrancar como autónomo o SL. La cuota reducida (€80/mes primer año) favorece el autónomo inicial.", type:"internal", collection:C5, status:"backlog", priority:"high", startDate:addDays(t,30), endDate:addDays(t,35), tags:["autónomo","legal"], createdAt:ord() },
    { ...base, id:f5b, title:"Alta en epígrafe IAE correspondiente", description:"Artesanía en cuero / comercio al por menor de artículos de piel.", type:"internal", collection:C5, status:"backlog", priority:"medium", startDate:addDays(t,36), endDate:addDays(t,38), tags:["iae","legal"], deps:[f5a], createdAt:ord() },
    { ...base, id:f5c, title:"Gestión de IVA para ventas internacionales (Etsy)", description:"Etsy gestiona el IVA en muchos países automáticamente — verificar configuración.", type:"internal", collection:C5, status:"backlog", priority:"medium", startDate:addDays(t,40), endDate:addDays(t,44), tags:["iva","etsy"], createdAt:ord() },
  ];
}

const normalize = (t) => ({ tags: [], subtasks: [], deps: [], links: [], notes: "", recurrence: "none", ...t, subtasks: (t.subtasks || []).map((s) => ({ due: "", ...s })) });

export default function TaskAtlas() {
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);
  const [theme, setTheme] = useState("light");
  const [dense, setDense] = useState(false);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("map");
  const [groupBy, setGroupBy] = useState("collection");
  const [sortBy, setSortBy] = useState("default");
  const [filterType, setFilterType] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [editCols, setEditCols] = useState(false);
  const [editColls, setEditColls] = useState(false);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await loadState();
        if (d) {
          setTasks((d.tasks || []).map(normalize));
          setColumns(d.columns && d.columns.length ? d.columns : DEFAULT_COLUMNS);
          setCollections(d.collections && d.collections.length ? d.collections : DEFAULT_COLLECTIONS);
          if (d.settings) { setTheme(d.settings.theme || "light"); setDense(!!d.settings.dense); }
        } else {
          setTasks(seedTasks());
          setColumns(DEFAULT_COLUMNS);
          setCollections(DEFAULT_COLLECTIONS);
        }
      } catch (err) {
        console.error("Error cargando desde Supabase:", err);
        setTasks(seedTasks());
        setColumns(DEFAULT_COLUMNS);
        setCollections(DEFAULT_COLLECTIONS);
      } finally { setLoading(false); }
    })();
  }, []);

  // guardado central — debounced 800 ms
  const saveTimer = useRef(null);
  useEffect(() => {
    if (loading) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState({ tasks, columns, collections, settings: { theme, dense } })
        .catch((err) => console.error("Error guardando en Supabase:", err));
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [tasks, columns, collections, theme, dense, loading]);

  const saveTask = (task) => {
    setTasks((prev) => {
      const existing = task.id && prev.find((x) => x.id === task.id);
      let list, finalTask = task;
      if (existing) list = prev.map((x) => (x.id === task.id ? task : x));
      else { finalTask = { ...task, id: uid(), createdAt: Date.now() }; list = [...prev, finalTask]; }
      if (existing && doneIds.includes(finalTask.status) && !doneIds.includes(existing.status) && finalTask.recurrence && finalTask.recurrence !== "none") {
        const clone = spawnClone(finalTask, columns[0]?.id);
        if (clone) list = [...list, clone];
      }
      return list;
    });
    setEditing(null);
  };
  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((x) => x.id !== id).map((x) => ({ ...x, deps: (x.deps || []).filter((d) => d !== id) })));
    setEditing(null);
  };
  const moveTask = (id, status) => setTasks((prev) => {
    const before = prev.find((x) => x.id === id);
    if (!before) return prev;
    const after = { ...before, status };
    let list = prev.map((x) => (x.id === id ? after : x));
    if (doneIds.includes(status) && !doneIds.includes(before.status) && after.recurrence && after.recurrence !== "none") {
      const clone = spawnClone(after, columns[0]?.id);
      if (clone) list = [...list, clone];
    }
    return list;
  });
  const patchTask = (id, patch) => setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addColumn = (label) => setColumns((c) => [...c, { id: uid(), label, done: false }]);
  const renameColumn = (id, label) => setColumns((c) => c.map((x) => (x.id === id ? { ...x, label } : x)));
  const toggleDoneColumn = (id) => setColumns((c) => c.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const moveColumn = (id, dir) => setColumns((c) => { const i = c.findIndex((x) => x.id === id); const j = i + dir; if (j < 0 || j >= c.length) return c; const n = c.slice(); [n[i], n[j]] = [n[j], n[i]]; return n; });
  const deleteColumn = (id) => setColumns((c) => {
    if (c.length <= 1) return c;
    const next = c.filter((x) => x.id !== id);
    const fb = next[0].id;
    setTasks((prev) => prev.map((t) => (t.status === id ? { ...t, status: fb } : t)));
    return next;
  });

  // CRUD de colecciones (fases/agrupaciones de tareas)
  const collectionLabels = useMemo(() => collections.map((c) => c.label), [collections]);
  const addColl = (label, color) => setCollections((c) => [...c, { id: uid(), label, color: color || collectionColor(label) }]);
  const renameColl = (id, label) => {
    const old = collections.find((c) => c.id === id)?.label;
    setCollections((c) => c.map((x) => (x.id === id ? { ...x, label } : x)));
    if (old) setTasks((prev) => prev.map((t) => t.collection === old ? { ...t, collection: label } : t));
  };
  const recolorColl = (id, color) => setCollections((c) => c.map((x) => (x.id === id ? { ...x, color } : x)));
  const moveColl = (id, dir) => setCollections((c) => { const i = c.findIndex((x) => x.id === id); const j = i + dir; if (j < 0 || j >= c.length) return c; const n = c.slice(); [n[i], n[j]] = [n[j], n[i]]; return n; });
  const deleteColl = (id) => {
    const label = collections.find((c) => c.id === id)?.label;
    setCollections((c) => c.filter((x) => x.id !== id));
    if (label) setTasks((prev) => prev.map((t) => t.collection === label ? { ...t, collection: "" } : t));
  };

  const doneIds = useMemo(() => { const d = columns.filter((c) => c.done).map((c) => c.id); return d.length ? d : columns.length ? [columns[columns.length - 1].id] : []; }, [columns]);
  const isDone = (t) => doneIds.includes(t.status);

  const allTags = useMemo(() => Array.from(new Set(tasks.flatMap((t) => t.tags || []))).sort(), [tasks]);

  const conflictIds = useMemo(() => {
    const map = Object.fromEntries(tasks.map((t) => [t.id, t]));
    const s = new Set();
    tasks.forEach((t) => (t.deps || []).forEach((d) => { const p = map[d]; if (p && t.startDate && p.endDate && t.startDate <= p.endDate) s.add(t.id); }));
    return s;
  }, [tasks]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCollection !== "all" && t.collection !== filterCollection) return false;
    if (filterTag !== "all" && !(t.tags || []).includes(filterTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t.collection || "").toLowerCase().includes(q) || (t.tags || []).some((tg) => tg.toLowerCase().includes(q));
      if (!hay) return false;
    }
    return true;
  }), [tasks, filterType, filterCollection, filterTag, search]);

  const groupKey = (t) => (groupBy === "type" ? t.type : t.collection || "Sin colección");
  const groupLabel = (key) => {
    if (groupBy === "type") return TYPES[key]?.label || key;
    return key;
  };
  const groupColor = (key) => {
    if (groupBy === "type") return TYPES[key]?.color || "#8A93A0";
    return collections.find((c) => c.label === key)?.color || collectionColor(key);
  };

  return (
    <div className={`ta-root ${theme === "dark" ? "ta-dark" : "ta-light"}${dense ? " dense" : ""}`} style={styles.shell}>
      <style>{css}</style>

      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.mark}>◆</span>
          <div>
            <div style={styles.wordmark}>Task Atlas</div>
            <div style={styles.subbrand}>Petrus · marroquinería artesanal</div>
          </div>
        </div>
        <nav style={styles.tabs}>
          {[["focus", "Foco"], ["map", "Mapa"], ["kanban", "Kanban"], ["gantt", "Gantt"]].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{ ...styles.tab, ...(view === id ? styles.tabActive : {}) }}>{label}</button>
          ))}
        </nav>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn} title="Modo compacto" onClick={() => setDense((v) => !v)}>{dense ? "▦" : "▤"}</button>
          <button style={styles.iconBtn} title="Modo oscuro" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>{theme === "dark" ? "☀" : "☾"}</button>
          <button style={styles.newBtn} onClick={() => setEditing({})}>+ Nueva tarea</button>
        </div>
      </header>

      <div style={styles.toolbar}>
        {(view === "map" || view === "gantt") && (
          <div style={styles.segGroup}>
            <span style={styles.segLabel}>Agrupar por</span>
            {[["type", "Tipo"], ["collection", "Colección"]].map(([id, label]) => (
              <button key={id} onClick={() => setGroupBy(id)} style={{ ...styles.seg, ...(groupBy === id ? styles.segActive : {}) }}>{label}</button>
            ))}
          </div>
        )}
        {view === "kanban" && (
          <div style={styles.segGroup}>
            <span style={styles.segLabel}>Ordenar</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
              <option value="default">Por defecto</option>
              <option value="priority">Prioridad</option>
              <option value="enddate">Fecha de fin</option>
              <option value="title">Título</option>
            </select>
            <button style={styles.seg} onClick={() => setEditCols(true)}>⚙ Columnas</button>
            <button style={styles.seg} onClick={() => setEditColls(true)}>⚙ Fases</button>
          </div>
        )}
        <div style={styles.filters}>
          <input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={styles.select}>
            <option value="all">Todos los tipos</option>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterCollection} onChange={(e) => setFilterCollection(e.target.value)} style={styles.select}>
            <option value="all">Todas las colecciones</option>
            {collectionLabels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {allTags.length > 0 && (
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={styles.select}>
              <option value="all">Todas las etiquetas</option>
              {allTags.map((tg) => <option key={tg} value={tg}># {tg}</option>)}
            </select>
          )}
          {(filterType !== "all" || filterCollection !== "all" || filterTag !== "all" || search) && (
            <button style={styles.clearBtn} onClick={() => { setFilterType("all"); setFilterCollection("all"); setFilterTag("all"); setSearch(""); }}>Limpiar</button>
          )}
        </div>
      </div>

      <main style={{ ...styles.body, padding: dense ? 14 : 22 }}>
        {loading ? (
          <div style={styles.empty}>Cargando tu atlas…</div>
        ) : view === "focus" ? (
          <Agenda tasks={filtered} isDone={isDone} dense={dense} onEdit={setEditing} />
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No hay tareas que coincidan. Crea una con <b>+ Nueva tarea</b>.</div>
        ) : view === "map" ? (
          <MapView tasks={filtered} groupKey={groupKey} groupLabel={groupLabel} groupColor={groupColor} isDone={isDone} dense={dense}
            onOpenGroup={(key) => { if (groupBy === "type") setFilterType(key); else setFilterCollection(key); setView("kanban"); }} />
        ) : view === "kanban" ? (
          <Kanban tasks={filtered} columns={columns} sortBy={sortBy} conflictIds={conflictIds} dense={dense} onMove={moveTask} onEdit={setEditing} dragId={dragId} setDragId={setDragId} />
        ) : (
          <Gantt tasks={filtered} groupKey={groupKey} groupLabel={groupLabel} groupColor={groupColor} isDone={isDone} dense={dense} collections={collectionLabels} onEdit={setEditing} onPatch={patchTask} />
        )}
      </main>

      {editing && (
        <TaskModal task={editing} allTasks={tasks} columns={columns} collectionLabels={collectionLabels} knownTags={allTags}
          onSave={saveTask} onDelete={deleteTask} onClose={() => setEditing(null)} />
      )}
      {editCols && (
        <ColumnsModal columns={columns} onAdd={addColumn} onRename={renameColumn} onToggleDone={toggleDoneColumn}
          onMove={moveColumn} onDelete={deleteColumn} onClose={() => setEditCols(false)} />
      )}
      {editColls && (
        <CollectionsModal collections={collections} onAdd={addColl} onRename={renameColl} onRecolor={recolorColl}
          onMove={moveColl} onDelete={deleteColl} onClose={() => setEditColls(false)} />
      )}
    </div>
  );
}

/* ====================== FOCO / AGENDA ====================== */
function Agenda({ tasks, isDone, dense, onEdit }) {
  const t = todayISO();
  const wk = addDays(t, 7);
  const items = [];
  tasks.forEach((task) => {
    if (!isDone(task) && task.endDate) items.push({ kind: "task", date: task.endDate, task });
    (task.subtasks || []).forEach((s) => { if (s.due && !s.done) items.push({ kind: "sub", date: s.due, task, sub: s }); });
  });
  const buckets = { overdue: [], today: [], week: [], later: [] };
  items.forEach((it) => {
    if (it.date < t) buckets.overdue.push(it);
    else if (it.date === t) buckets.today.push(it);
    else if (it.date <= wk) buckets.week.push(it);
    else buckets.later.push(it);
  });
  Object.values(buckets).forEach((arr) => arr.sort((a, b) => a.date.localeCompare(b.date)));

  const sections = [
    ["overdue", "Vencidas", "#C0392B"],
    ["today", "Hoy", "#B0703A"],
    ["week", "Esta semana", "#2F7D78"],
    ["later", "Próximas", "#6B7280"],
  ];
  const anything = items.length > 0;

  return (
    <div style={styles.agendaWrap}>
      {!anything && <div style={styles.empty}>Nada pendiente con fecha. ¡Día despejado!</div>}
      {sections.map(([key, label, color]) => {
        const arr = buckets[key];
        if (!arr.length) return null;
        const list = key === "later" ? arr.slice(0, 12) : arr;
        return (
          <section key={key} style={styles.agendaSection}>
            <div style={styles.agendaHead}>
              <span style={{ ...styles.dot, background: color }} />
              <span style={{ color }}>{label}</span>
              <span style={styles.agendaCount}>{arr.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: dense ? 6 : 8 }}>
              {list.map((it, i) => {
                const overdue = it.date < t;
                return (
                  <div key={i} className="task-card" style={{ ...styles.agendaItem, padding: dense ? "8px 11px" : "11px 13px" }} onClick={() => onEdit(it.task)}>
                    <span style={{ ...styles.agDot, background: TYPES[it.task.type]?.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.agTitle}>
                        {it.kind === "sub" && <span style={styles.milestoneTag}>◆ mini-hito</span>}
                        {it.kind === "sub" ? it.sub.text : it.task.title}
                      </div>
                      <div style={styles.agMeta}>
                        {it.kind === "sub" ? `en ${it.task.title}` : it.task.collection || TYPES[it.task.type]?.label}
                      </div>
                    </div>
                    <div style={{ ...styles.agDate, color: overdue ? "#C0392B" : "var(--muted)" }}>{fmtLong(it.date)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ====================== MAPA ====================== */
function MapView({ tasks, groupKey, groupLabel, groupColor, isDone, dense, onOpenGroup }) {
  const groups = useMemo(() => {
    const m = {};
    tasks.forEach((t) => { const k = groupKey(t); (m[k] = m[k] || []).push(t); });
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [tasks, groupKey]);

  return (
    <div style={styles.mapGrid}>
      {groups.map(([key, items]) => {
        const done = items.filter(isDone).length;
        const pct = Math.round((done / items.length) * 100);
        const color = groupColor(key);
        const dates = items.flatMap((t) => [t.startDate, t.endDate]).filter(Boolean).sort();
        const prioCount = {};
        items.forEach((t) => (prioCount[t.priority] = (prioCount[t.priority] || 0) + 1));
        return (
          <button key={key} className="map-card" style={{ ...styles.mapCard, borderTopColor: color, padding: dense ? "12px 13px" : "16px 17px", gap: dense ? 7 : 10 }} onClick={() => onOpenGroup(key)}>
            <div style={styles.mapCardHead}>
              <span style={{ ...styles.dot, background: color }} />
              <span style={styles.mapTitle}>{groupLabel(key)}</span>
              <span style={styles.mapCount}>{items.length}</span>
            </div>
            <div style={styles.progressWrap}><div style={{ ...styles.progressBar, width: `${pct}%`, background: color }} /></div>
            <div style={styles.progressLabel}>{done}/{items.length} hechas · {pct}%</div>
            <div style={styles.prioRow}>
              {Object.entries(PRIORITIES).sort((a, b) => b[1].rank - a[1].rank).filter(([k]) => prioCount[k]).map(([k, v]) => (
                <span key={k} style={styles.prioChip}><span style={{ ...styles.prioDot, background: v.color }} />{prioCount[k]}</span>
              ))}
            </div>
            <div style={styles.mapDates}>{dates.length ? `${fmtShort(dates[0])} → ${fmtShort(dates[dates.length - 1])}` : "Sin fechas"}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ====================== KANBAN ====================== */
function sortItems(items, sortBy) {
  const arr = items.slice();
  if (sortBy === "priority") arr.sort((a, b) => PRIORITIES[b.priority].rank - PRIORITIES[a.priority].rank);
  else if (sortBy === "enddate") arr.sort((a, b) => (a.endDate || "").localeCompare(b.endDate || ""));
  else if (sortBy === "title") arr.sort((a, b) => a.title.localeCompare(b.title));
  else arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return arr;
}

function Kanban({ tasks, columns, sortBy, conflictIds, dense, onMove, onEdit, dragId, setDragId }) {
  return (
    <div style={{ ...styles.kanban, gap: dense ? 10 : 14, gridTemplateColumns: `repeat(${columns.length}, minmax(180px, 1fr))`, minWidth: columns.length * 190 }}>
      {columns.map((col) => {
        const items = sortItems(tasks.filter((t) => t.status === col.id), sortBy);
        return (
          <div key={col.id} className="kanban-col" style={styles.kCol} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) onMove(dragId, col.id); setDragId(null); }}>
            <div style={styles.kColHead}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{col.done && <span style={styles.doneTick}>✓</span>}{col.label}</span>
              <span style={styles.kColCount}>{items.length}</span>
            </div>
            <div style={{ ...styles.kColBody, gap: dense ? 6 : 9, padding: dense ? 8 : 10 }}>
              {items.map((t) => {
                const subDone = (t.subtasks || []).filter((s) => s.done).length;
                const subTotal = (t.subtasks || []).length;
                const subPct = subTotal ? Math.round((subDone / subTotal) * 100) : 0;
                const conflict = conflictIds.has(t.id);
                return (
                  <article key={t.id} draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)} onClick={() => onEdit(t)} className="task-card"
                    style={{ ...styles.card, borderLeftColor: TYPES[t.type]?.color || "#8A93A0", padding: dense ? "7px 9px" : "10px 12px" }}>
                    <div style={styles.cardTop}>
                      <span style={{ ...styles.typeTag, background: TYPES[t.type]?.soft, color: TYPES[t.type]?.color }}>{TYPES[t.type]?.label}</span>
                      <span style={{ ...styles.prioPill, color: PRIORITIES[t.priority]?.color, borderColor: PRIORITIES[t.priority]?.color }}>{PRIORITIES[t.priority]?.label}</span>
                    </div>
                    <div style={{ ...styles.cardTitle, fontSize: dense ? 13 : 14 }}>{conflict && <span title="Empieza antes de que acabe una dependencia" style={styles.conflictFlag}>⚠</span>}{t.title}</div>
                    {!dense && t.collection && <div style={styles.cardColl}>◷ {t.collection}</div>}
                    {!dense && (t.tags || []).length > 0 && (<div style={styles.tagRow}>{t.tags.map((tg) => <span key={tg} style={styles.tagChipSm}>#{tg}</span>)}</div>)}
                    {subTotal > 0 && (
                      <div style={styles.subProgressWrap}>
                        <div style={styles.subBarTrack}><div style={{ ...styles.subBarFill, width: `${subPct}%` }} /></div>
                        <span style={styles.subBarLabel}>{subDone}/{subTotal}</span>
                      </div>
                    )}
                    <div style={styles.cardFooter}>
                      <span style={styles.cardDates}>{fmtShort(t.startDate)} → {fmtShort(t.endDate)}</span>
                      <span style={styles.cardIcons}>
                        {t.recurrence && t.recurrence !== "none" && <span title="Recurrente">🔁</span>}
                        {(t.links || []).length > 0 && <span title={`${t.links.length} enlace(s)`}>🔗{t.links.length}</span>}
                        {t.notes && <span title="Tiene notas">📝</span>}
                      </span>
                    </div>
                  </article>
                );
              })}
              {items.length === 0 && <div style={styles.kEmpty}>Suelta aquí</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ====================== GANTT ====================== */
function Gantt({ tasks, groupKey, groupLabel, groupColor, isDone, dense, collections, onEdit, onPatch }) {
  const [draft, setDraft] = useState(null);
  const [focus, setFocus] = useState("all");
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  const ROW_H = dense ? 27 : 34, GHEAD_H = dense ? 26 : 30, LABEL_W = dense ? 180 : 220, BAR_H = dense ? 20 : 24;

  let dated = tasks.filter((t) => t.startDate && t.endDate);
  if (focus !== "all") dated = dated.filter((t) => (t.collection || "Sin colección") === focus);

  let min, max, totalDays, dayWidth, timelineW;
  if (dated.length) {
    const all = dated.flatMap((t) => [t.startDate, t.endDate]).sort();
    min = addDays(all[0], -2); max = addDays(all[all.length - 1], 2);
    totalDays = Math.max(daysBetween(min, max), 1);
    dayWidth = totalDays <= 31 ? 30 : totalDays <= 90 ? 15 : 8;
    timelineW = totalDays * dayWidth;
  }

  useEffect(() => {
    function onMove(e) {
      const s = dragRef.current; if (!s) return;
      const dx = e.clientX - s.startX;
      if (Math.abs(dx) > 3) { s.moved = true; movedRef.current = true; }
      const delta = Math.round(dx / (s.dayWidth || 20));
      let next;
      if (s.mode === "move") next = { id: s.id, startDate: addDays(s.origStart, delta), endDate: addDays(s.origEnd, delta) };
      else { let ne = addDays(s.origEnd, delta); if (ne < s.origStart) ne = s.origStart; next = { id: s.id, startDate: s.origStart, endDate: ne }; }
      s.cur = next; setDraft(next);
    }
    function onUp() { const s = dragRef.current; if (s && s.moved && s.cur) onPatch(s.id, { startDate: s.cur.startDate, endDate: s.cur.endDate }); dragRef.current = null; setDraft(null); }
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [onPatch]);

  const focusChips = (
    <div style={styles.focusRow}>
      <span style={styles.segLabel}>Foco</span>
      <button onClick={() => setFocus("all")} style={{ ...styles.focusChip, ...(focus === "all" ? styles.focusChipActive : {}) }}>Todas</button>
      {collections.map((c) => (
        <button key={c} onClick={() => setFocus(c)} style={{ ...styles.focusChip, ...(focus === c ? styles.focusChipActive : {}) }}>{c}</button>
      ))}
    </div>
  );

  if (!dated.length) return (<div>{focusChips}<div style={styles.empty}>No hay tareas con fechas{focus !== "all" ? " en esta colección" : ""}.</div></div>);

  const eff = (t) => (draft && draft.id === t.id ? { ...t, ...draft } : t);
  const effMap = Object.fromEntries(dated.map((t) => [t.id, eff(t)]));

  const groups = {};
  dated.forEach((t) => { const k = groupKey(t); (groups[k] = groups[k] || []).push(t); });
  const rows = []; const pos = {}; let y = 0;
  Object.entries(groups).forEach(([key, items]) => {
    rows.push({ type: "group", key, y }); y += GHEAD_H;
    items.slice().sort((a, b) => eff(a).startDate.localeCompare(eff(b).startDate)).forEach((task) => {
      const e = eff(task);
      const left = LABEL_W + daysBetween(min, e.startDate) * dayWidth;
      const w = Math.max((daysBetween(e.startDate, e.endDate) + 1) * dayWidth, dayWidth);
      pos[task.id] = { top: y, left, w, cy: y + ROW_H / 2 };
      rows.push({ type: "task", task, y, left, w }); y += ROW_H;
    });
  });
  const totalH = y; const fullW = LABEL_W + timelineW;
  const t = todayISO();
  const todayX = daysBetween(min, t) >= 0 && daysBetween(min, t) <= totalDays ? LABEL_W + daysBetween(min, t) * dayWidth : null;

  const months = [];
  let cur = new Date(min + "T00:00:00"); const endD = new Date(max + "T00:00:00"), minD = new Date(min + "T00:00:00");
  while (cur <= endD) {
    const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1), mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const segStart = mStart < minD ? minD : mStart, segEnd = mEnd > endD ? endD : mEnd;
    const offset = Math.round((segStart - minD) / 86400000) * dayWidth;
    const w = (Math.round((segEnd - segStart) / 86400000) + 1) * dayWidth;
    months.push({ label: cur.toLocaleDateString("es-ES", { month: "long", year: "numeric" }), offset, w });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  const arrows = []; let conflicts = 0;
  dated.forEach((task) => (task.deps || []).forEach((depId) => {
    if (pos[task.id] && pos[depId]) {
      const from = pos[depId], to = pos[task.id], dep = effMap[depId], me = effMap[task.id];
      const bad = dep && me && me.startDate <= dep.endDate; if (bad) conflicts++;
      arrows.push({ x1: from.left + from.w, y1: from.cy, x2: to.left, y2: to.cy, bad, key: depId + "-" + task.id });
    }
  }));
  const conflictTaskIds = new Set();
  dated.forEach((task) => (task.deps || []).forEach((depId) => { const dep = effMap[depId], me = effMap[task.id]; if (dep && me && me.startDate <= dep.endDate) conflictTaskIds.add(task.id); }));

  return (
    <div>
      {focusChips}
      <div style={styles.ganttScroll}>
        <div style={{ width: fullW, minWidth: "100%" }}>
          <div style={styles.ganttHeader}>
            <div style={{ width: LABEL_W, minWidth: LABEL_W }} />
            <div style={{ position: "relative", height: 28, width: timelineW }}>
              {months.map((m, i) => <div key={i} style={{ ...styles.monthCell, left: m.offset, width: m.w }}>{m.label}</div>)}
            </div>
          </div>
          <div style={{ position: "relative", height: totalH }}>
            <svg width={fullW} height={totalH} style={styles.ganttSvg}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#9AA3AE" /></marker>
                <marker id="arrowBad" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#C0392B" /></marker>
              </defs>
              {todayX !== null && <line x1={todayX} y1={0} x2={todayX} y2={totalH} stroke="#C0392B" strokeWidth="1.5" strokeDasharray="3,3" />}
              {arrows.map((a) => (
                <path key={a.key} d={`M ${a.x1} ${a.y1} H ${a.x1 + 10} V ${a.y2} H ${a.x2 - 4}`} fill="none" stroke={a.bad ? "#C0392B" : "#9AA3AE"} strokeWidth={a.bad ? 1.8 : 1.4} markerEnd={a.bad ? "url(#arrowBad)" : "url(#arrow)"} />
              ))}
            </svg>
            {rows.map((r, i) =>
              r.type === "group" ? (
                <div key={"g" + i} style={{ ...styles.ganttGroupHead, top: r.y, height: GHEAD_H }}><span style={{ ...styles.dot, background: groupColor(r.key) }} />{groupLabel(r.key)}</div>
              ) : (
                <React.Fragment key={r.task.id}>
                  <div style={{ ...styles.ganttRowLabel, top: r.y, width: LABEL_W, height: ROW_H, lineHeight: `${ROW_H}px` }} title={r.task.title}>
                    {conflictTaskIds.has(r.task.id) && <span style={styles.conflictFlag}>⚠</span>}{r.task.title}
                  </div>
                  <div className="gantt-bar"
                    onMouseDown={(e) => { if (e.button !== 0) return; e.preventDefault(); movedRef.current = false; dragRef.current = { id: r.task.id, mode: "move", startX: e.clientX, origStart: r.task.startDate, origEnd: r.task.endDate, moved: false, dayWidth }; }}
                    onClick={() => { if (movedRef.current) { movedRef.current = false; return; } onEdit(r.task); }}
                    style={{ ...styles.ganttBar, height: BAR_H, top: r.y + (ROW_H - BAR_H) / 2, left: r.left, width: r.w, background: TYPES[r.task.type]?.color || "#8A93A0", opacity: isDone(r.task) ? 0.5 : 1, outline: conflictTaskIds.has(r.task.id) ? "2px solid #C0392B" : "none" }}>
                    <span style={styles.ganttBarLabel}>{r.task.collection || PRIORITIES[r.task.priority]?.label}</span>
                    <span className="resize-handle" style={styles.resizeHandle}
                      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); movedRef.current = false; dragRef.current = { id: r.task.id, mode: "resize", startX: e.clientX, origStart: r.task.startDate, origEnd: r.task.endDate, moved: false, dayWidth }; }} />
                  </div>
                  {(r.task.subtasks || []).filter((s) => s.due && daysBetween(min, s.due) >= 0 && daysBetween(min, s.due) <= totalDays).map((s) => (
                    <div key={s.id} title={`${s.text} · ${fmtShort(s.due)}`} onClick={() => onEdit(r.task)}
                      style={{ ...styles.milestone, left: LABEL_W + daysBetween(min, s.due) * dayWidth - 5, top: r.y + ROW_H / 2 - 5, opacity: s.done ? 0.4 : 1 }} />
                  ))}
                </React.Fragment>
              )
            )}
          </div>
        </div>
        <div style={styles.ganttHint}>
          Arrastra para mover · borde derecho para duración · <span style={styles.milestoneInline} />&nbsp;mini-hito
          {conflicts > 0 && <span style={{ color: "#C0392B", fontWeight: 600 }}>{"  ·  ⚠ " + conflicts + " solape(s)"}</span>}
        </div>
      </div>
    </div>
  );
}

/* ====================== MODAL TAREA ====================== */
function TaskModal({ task, allTasks, columns, collectionLabels, knownTags, onSave, onDelete, onClose }) {
  const isNew = !task.id;
  const firstStatus = columns[0]?.id || "backlog";
  const [form, setForm] = useState({
    title: task.title || "", description: task.description || "", type: task.type || "product",
    collection: task.collection || "", status: task.status || firstStatus, priority: task.priority || "medium",
    startDate: task.startDate || todayISO(), endDate: task.endDate || addDays(todayISO(), 7),
    tags: task.tags || [], subtasks: task.subtasks || [], deps: task.deps || [],
    links: task.links || [], notes: task.notes || "", recurrence: task.recurrence || "none",
    id: task.id, createdAt: task.createdAt,
  });
  const [tagInput, setTagInput] = useState("");
  const [subInput, setSubInput] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim() && form.endDate >= form.startDate;

  const addTag = () => { const v = tagInput.trim().toLowerCase(); if (v && !form.tags.includes(v)) set("tags", [...form.tags, v]); setTagInput(""); };
  const addSub = () => { const v = subInput.trim(); if (v) set("subtasks", [...form.subtasks, { id: uid(), text: v, done: false, due: "" }]); setSubInput(""); };
  const toggleSub = (id) => set("subtasks", form.subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  const setSubDue = (id, due) => set("subtasks", form.subtasks.map((s) => (s.id === id ? { ...s, due } : s)));
  const removeSub = (id) => set("subtasks", form.subtasks.filter((s) => s.id !== id));
  const toggleDep = (id) => set("deps", form.deps.includes(id) ? form.deps.filter((d) => d !== id) : [...form.deps, id]);
  const addLink = () => set("links", [...form.links, { id: uid(), label: "", url: "" }]);
  const updateLink = (id, k, v) => set("links", form.links.map((l) => (l.id === id ? { ...l, [k]: v } : l)));
  const removeLink = (id) => set("links", form.links.filter((l) => l.id !== id));

  const candidates = allTasks.filter((x) => x.id && x.id !== form.id);
  const depConflicts = form.deps.map((id) => allTasks.find((x) => x.id === id)).filter((p) => p && p.endDate && form.startDate <= p.endDate);
  const subDone = form.subtasks.filter((s) => s.done).length;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}><span>{isNew ? "Nueva tarea" : "Editar tarea"}</span><button style={styles.closeBtn} onClick={onClose}>✕</button></div>

        <label style={styles.field}><span style={styles.fieldLabel}>Título</span>
          <input autoFocus value={form.title} onChange={(e) => set("title", e.target.value)} style={styles.input} placeholder="¿Qué hay que hacer?" /></label>
        <label style={styles.field}><span style={styles.fieldLabel}>Descripción</span>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} style={{ ...styles.input, minHeight: 56, resize: "vertical" }} placeholder="Detalles, contexto…" /></label>

        <div style={styles.row2}>
          <label style={styles.field}><span style={styles.fieldLabel}>Tipo</span>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} style={styles.input}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
          <label style={styles.field}><span style={styles.fieldLabel}>Colección / Producto</span>
            <input list="collections" value={form.collection} onChange={(e) => set("collection", e.target.value)} style={styles.input} placeholder="BlackHide, Agentforce…" />
            <datalist id="collections">{collectionLabels.map((c) => <option key={c} value={c} />)}</datalist></label>
        </div>

        <div style={styles.row2}>
          <label style={styles.field}><span style={styles.fieldLabel}>Estado</span>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} style={styles.input}>{columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label style={styles.field}><span style={styles.fieldLabel}>Prioridad</span>
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={styles.input}>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        </div>

        <div style={styles.row2}>
          <label style={styles.field}><span style={styles.fieldLabel}>Inicio</span><input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} style={styles.input} /></label>
          <label style={styles.field}><span style={styles.fieldLabel}>Fin</span><input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} style={styles.input} /></label>
        </div>
        {form.endDate < form.startDate && <div style={styles.warn}>La fecha de fin es anterior a la de inicio.</div>}
        {depConflicts.length > 0 && <div style={styles.warn}>⚠ Empieza antes de que termine: {depConflicts.map((p) => p.title).join(", ")}</div>}

        <label style={styles.field}><span style={styles.fieldLabel}>Repetir</span>
          <select value={form.recurrence} onChange={(e) => set("recurrence", e.target.value)} style={styles.input}>
            {Object.entries(RECUR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {form.recurrence !== "none" && <span style={styles.fieldHint}>Al pasarla a una columna "completada" se creará la siguiente automáticamente.</span>}
        </label>

        <div style={styles.field}><span style={styles.fieldLabel}>Etiquetas</span>
          <div style={styles.tagEditRow}>
            {form.tags.map((tg) => (<span key={tg} style={styles.tagChip}>#{tg}<button style={styles.tagX} onClick={() => set("tags", form.tags.filter((x) => x !== tg))}>×</button></span>))}
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} list="known-tags" style={styles.tagInput} placeholder="añadir + Enter" />
            <datalist id="known-tags">{knownTags.map((t) => <option key={t} value={t} />)}</datalist>
          </div></div>

        <div style={styles.field}>
          <span style={styles.fieldLabel}>Subtareas {form.subtasks.length > 0 && `· ${subDone}/${form.subtasks.length}`} <span style={styles.fieldHint}>(la fecha la convierte en mini-hito)</span></span>
          {form.subtasks.map((s) => (
            <div key={s.id} style={styles.subRow}>
              <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)} />
              <span style={{ ...styles.subText, textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--muted)" : "var(--ink)" }}>{s.text}</span>
              <input type="date" value={s.due || ""} onChange={(e) => setSubDue(s.id, e.target.value)} style={styles.subDate} title="Fecha (mini-hito)" />
              <button style={styles.subX} onClick={() => removeSub(s.id)}>×</button>
            </div>
          ))}
          <input value={subInput} onChange={(e) => setSubInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }} style={{ ...styles.input, marginTop: 4 }} placeholder="Nueva subtarea + Enter" />
        </div>

        <div style={styles.field}>
          <span style={styles.fieldLabel}>Enlaces</span>
          {form.links.map((l) => (
            <div key={l.id} style={styles.linkRow}>
              <input value={l.label} onChange={(e) => updateLink(l.id, "label", e.target.value)} style={{ ...styles.input, flex: "0 0 32%" }} placeholder="Texto" />
              <input value={l.url} onChange={(e) => updateLink(l.id, "url", e.target.value)} style={{ ...styles.input, flex: 1 }} placeholder="https://…" />
              {l.url && <a href={l.url} target="_blank" rel="noreferrer" style={styles.linkOpen} title="Abrir">↗</a>}
              <button style={styles.subX} onClick={() => removeLink(l.id)}>×</button>
            </div>
          ))}
          <button style={{ ...styles.ghostBtn, marginTop: 6, alignSelf: "flex-start", padding: "6px 12px", fontSize: 13 }} onClick={addLink}>+ Añadir enlace</button>
        </div>

        <label style={styles.field}><span style={styles.fieldLabel}>Notas</span>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...styles.input, minHeight: 64, resize: "vertical" }} placeholder="Notas largas, contexto, decisiones…" /></label>

        {candidates.length > 0 && (
          <div style={styles.field}><span style={styles.fieldLabel}>Depende de (debe terminar antes)</span>
            <div style={styles.depBox}>
              {candidates.map((c) => (<label key={c.id} style={styles.depItem}><input type="checkbox" checked={form.deps.includes(c.id)} onChange={() => toggleDep(c.id)} /><span style={styles.depText}>{c.title}</span></label>))}
            </div></div>
        )}

        <div style={styles.modalFoot}>
          {!isNew && <button style={styles.deleteBtn} onClick={() => onDelete(form.id)}>Eliminar</button>}
          <div style={{ flex: 1 }} />
          <button style={styles.ghostBtn} onClick={onClose}>Cancelar</button>
          <button style={{ ...styles.saveBtn, opacity: valid ? 1 : 0.5 }} disabled={!valid} onClick={() => onSave(form)}>{isNew ? "Crear tarea" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ====================== MODAL COLUMNAS ====================== */
function ColumnsModal({ columns, onAdd, onRename, onToggleDone, onMove, onDelete, onClose }) {
  const [newCol, setNewCol] = useState("");
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}><span>Columnas del Kanban</span><button style={styles.closeBtn} onClick={onClose}>✕</button></div>
        <p style={styles.colHelp}>Renombra, reordena y marca qué columna cuenta como "completada" (para el % de progreso).</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {columns.map((c, i) => (
            <div key={c.id} style={styles.colRow}>
              <div style={styles.colReorder}>
                <button style={styles.reorderBtn} disabled={i === 0} onClick={() => onMove(c.id, -1)}>▲</button>
                <button style={styles.reorderBtn} disabled={i === columns.length - 1} onClick={() => onMove(c.id, 1)}>▼</button>
              </div>
              <input value={c.label} onChange={(e) => onRename(c.id, e.target.value)} style={{ ...styles.input, flex: 1 }} />
              <label style={styles.colDoneToggle} title="Cuenta como completada"><input type="checkbox" checked={!!c.done} onChange={() => onToggleDone(c.id)} /> ✓</label>
              <button style={{ ...styles.subX, opacity: columns.length <= 1 ? 0.3 : 1 }} disabled={columns.length <= 1} onClick={() => onDelete(c.id)} title="Eliminar columna">🗑</button>
            </div>
          ))}
        </div>
        <div style={styles.tagEditRow}>
          <input value={newCol} onChange={(e) => setNewCol(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newCol.trim()) { onAdd(newCol.trim()); setNewCol(""); } }} style={styles.tagInput} placeholder="Nueva columna…" />
          <button style={{ ...styles.saveBtn, padding: "7px 14px" }} disabled={!newCol.trim()} onClick={() => { if (newCol.trim()) { onAdd(newCol.trim()); setNewCol(""); } }}>Añadir</button>
        </div>
        <div style={styles.modalFoot}><div style={{ flex: 1 }} /><button style={styles.saveBtn} onClick={onClose}>Hecho</button></div>
      </div>
    </div>
  );
}

/* ====================== MODAL COLECCIONES ====================== */
function CollectionsModal({ collections, onAdd, onRename, onRecolor, onMove, onDelete, onClose }) {
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#A6703C");
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <span>Colecciones / Fases</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={styles.colHelp}>
          Crea, renombra, reordena y colorea las colecciones (fases, áreas…). Al renombrar se actualiza en todas las tareas. Al eliminar, las tareas quedan sin colección.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {collections.map((c, i) => (
            <div key={c.id} style={styles.colRow}>
              <div style={styles.colReorder}>
                <button style={styles.reorderBtn} disabled={i === 0} onClick={() => onMove(c.id, -1)}>▲</button>
                <button style={styles.reorderBtn} disabled={i === collections.length - 1} onClick={() => onMove(c.id, 1)}>▼</button>
              </div>
              <input
                type="color"
                value={c.color}
                onChange={(e) => onRecolor(c.id, e.target.value)}
                style={styles.colorPicker}
                title="Color de la colección"
              />
              <input
                value={c.label}
                onChange={(e) => onRename(c.id, e.target.value)}
                style={{ ...styles.input, flex: 1 }}
              />
              <button style={styles.subX} onClick={() => onDelete(c.id)} title="Eliminar colección">🗑</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", border: "1px solid var(--line)", borderRadius: 9, padding: "7px 9px" }}>
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={styles.colorPicker} />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newLabel.trim()) { onAdd(newLabel.trim(), newColor); setNewLabel(""); } }}
            style={{ ...styles.tagInput }}
            placeholder="Nueva colección + Enter"
          />
          <button style={{ ...styles.saveBtn, padding: "7px 14px" }} disabled={!newLabel.trim()}
            onClick={() => { if (newLabel.trim()) { onAdd(newLabel.trim(), newColor); setNewLabel(""); } }}>
            Añadir
          </button>
        </div>
        <div style={styles.modalFoot}><div style={{ flex: 1 }} /><button style={styles.saveBtn} onClick={onClose}>Hecho</button></div>
      </div>
    </div>
  );
}

function collectionColor(name) {
  const palette = ["#B0703A", "#2F7D78", "#5B5BD6", "#9C4F8C", "#3A7DB0", "#6B8E23", "#C0392B", "#5A6B7B"];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

/* ====================== estilos (con variables de tema) ====================== */
const styles = {
  shell: { fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "var(--bg)", color: "var(--ink)", minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", gap: 20, padding: "14px 22px", background: "var(--surface)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" },
  brand: { display: "flex", alignItems: "center", gap: 11 },
  mark: { color: "#B0703A", fontSize: 22, lineHeight: 1 },
  wordmark: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink)" },
  subbrand: { fontSize: 11.5, color: "var(--muted)", marginTop: -1 },
  tabs: { display: "flex", gap: 4, marginLeft: 8 },
  tab: { border: "none", background: "transparent", padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "var(--muted)", cursor: "pointer" },
  tabActive: { background: "var(--strong)", color: "var(--strongtext)" },
  headerRight: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 },
  iconBtn: { border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", width: 34, height: 34, borderRadius: 9, fontSize: 15, cursor: "pointer" },
  newBtn: { border: "none", background: "#B0703A", color: "#fff", padding: "9px 16px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  toolbar: { display: "flex", alignItems: "center", gap: 18, padding: "12px 22px", background: "var(--surface)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" },
  segGroup: { display: "flex", alignItems: "center", gap: 6 },
  segLabel: { fontSize: 12.5, color: "var(--muted)", marginRight: 4 },
  seg: { border: "1px solid var(--line)", background: "var(--surface)", padding: "6px 13px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "var(--ink)", cursor: "pointer" },
  segActive: { background: "var(--strong)", color: "var(--strongtext)", borderColor: "var(--strong)" },
  filters: { display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" },
  searchInput: { border: "1px solid var(--line)", borderRadius: 8, padding: "7px 12px", fontSize: 13.5, width: 140, outline: "none", background: "var(--surface)", color: "var(--ink)" },
  select: { border: "1px solid var(--line)", borderRadius: 8, padding: "7px 10px", fontSize: 13.5, background: "var(--surface)", color: "var(--ink)", cursor: "pointer" },
  clearBtn: { border: "none", background: "transparent", color: "#B0703A", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  body: { flex: 1, overflow: "auto" },
  empty: { padding: 60, textAlign: "center", color: "var(--muted)", fontSize: 15 },

  agendaWrap: { maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 },
  agendaSection: {},
  agendaHead: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, marginBottom: 10 },
  agendaCount: { fontSize: 12, color: "var(--muted)", background: "var(--surface2)", borderRadius: 6, padding: "1px 8px" },
  agendaItem: { display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, cursor: "pointer" },
  agDot: { width: 10, height: 10, borderRadius: 10, flexShrink: 0 },
  agTitle: { fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  agMeta: { fontSize: 12, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  agDate: { fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", textTransform: "capitalize" },
  milestoneTag: { fontSize: 10.5, color: "#B0703A", fontWeight: 700, marginRight: 6 },

  mapGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 },
  mapCard: { textAlign: "left", background: "var(--surface)", border: "1px solid var(--line)", borderTop: "3px solid", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column" },
  mapCardHead: { display: "flex", alignItems: "center", gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 9, flexShrink: 0 },
  mapTitle: { fontWeight: 600, fontSize: 15, flex: 1, color: "var(--ink)" },
  mapCount: { fontSize: 13, fontWeight: 700, color: "var(--muted)", background: "var(--surface2)", borderRadius: 6, padding: "2px 8px" },
  progressWrap: { height: 6, background: "var(--surface2)", borderRadius: 6, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 6 },
  progressLabel: { fontSize: 12, color: "var(--muted)" },
  prioRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  prioChip: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" },
  prioDot: { width: 7, height: 7, borderRadius: 7 },
  mapDates: { fontSize: 11.5, color: "var(--muted)", marginTop: 2, borderTop: "1px solid var(--line)", paddingTop: 8 },

  kanban: { display: "grid" },
  kCol: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, display: "flex", flexDirection: "column", minHeight: 200 },
  kColHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", fontWeight: 600, fontSize: 13.5, borderBottom: "1px solid var(--line)", color: "var(--ink)" },
  doneTick: { color: "#2F7D78", fontWeight: 700 },
  kColCount: { fontSize: 12, color: "var(--muted)", background: "var(--surface2)", borderRadius: 6, padding: "1px 7px" },
  kColBody: { display: "flex", flexDirection: "column" },
  card: { background: "var(--surface)", border: "1px solid var(--line)", borderLeft: "3px solid", borderRadius: 9, cursor: "pointer", boxShadow: "0 1px 2px rgba(20,25,40,0.04)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 7 },
  typeTag: { fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5 },
  prioPill: { fontSize: 10.5, fontWeight: 600, border: "1px solid", borderRadius: 5, padding: "1px 6px", whiteSpace: "nowrap" },
  cardTitle: { fontWeight: 600, lineHeight: 1.3, color: "var(--ink)" },
  conflictFlag: { color: "#C0392B", marginRight: 5 },
  cardColl: { fontSize: 12, color: "var(--muted)", marginTop: 5 },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 },
  tagChipSm: { fontSize: 10.5, color: "var(--muted)", background: "var(--surface2)", borderRadius: 5, padding: "1px 6px" },
  subProgressWrap: { display: "flex", alignItems: "center", gap: 7, marginTop: 8 },
  subBarTrack: { flex: 1, height: 5, background: "var(--surface2)", borderRadius: 5, overflow: "hidden" },
  subBarFill: { height: "100%", background: "#2F7D78", borderRadius: 5 },
  subBarLabel: { fontSize: 10.5, color: "var(--muted)", fontWeight: 600 },
  cardDates: { fontSize: 11.5, color: "var(--muted)" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  cardIcons: { display: "flex", gap: 6, fontSize: 11, color: "var(--muted)" },
  linkRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  linkOpen: { textDecoration: "none", color: "#B0703A", fontSize: 16, fontWeight: 700 },
  kEmpty: { fontSize: 12.5, color: "var(--muted)", textAlign: "center", padding: "18px 0", border: "1px dashed var(--line)", borderRadius: 8, opacity: 0.7 },

  focusRow: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 12 },
  focusChip: { border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", padding: "5px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  focusChipActive: { background: "var(--strong)", color: "var(--strongtext)", borderColor: "var(--strong)" },

  ganttScroll: { overflow: "auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 4 },
  ganttHeader: { display: "flex", alignItems: "flex-end", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 3 },
  monthCell: { position: "absolute", top: 0, fontSize: 11.5, fontWeight: 600, color: "var(--muted)", textTransform: "capitalize", borderLeft: "1px solid var(--line)", paddingLeft: 6, height: 28, lineHeight: "28px", overflow: "hidden", whiteSpace: "nowrap" },
  ganttSvg: { position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 },
  ganttGroupHead: { position: "absolute", left: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--ink)", padding: "8px 12px 0", textTransform: "capitalize" },
  ganttRowLabel: { position: "absolute", left: 0, fontSize: 12.5, paddingRight: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink)" },
  ganttBar: { position: "absolute", borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 8, cursor: "grab", boxShadow: "0 1px 2px rgba(20,25,40,0.12)", zIndex: 2, userSelect: "none" },
  ganttBarLabel: { fontSize: 11, color: "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", pointerEvents: "none" },
  resizeHandle: { position: "absolute", right: 0, top: 0, width: 9, height: "100%", cursor: "ew-resize", borderRadius: "0 6px 6px 0" },
  milestone: { position: "absolute", width: 10, height: 10, background: "var(--ink)", border: "2px solid var(--surface)", transform: "rotate(45deg)", zIndex: 4, cursor: "pointer" },
  milestoneInline: { display: "inline-block", width: 8, height: 8, background: "var(--ink)", transform: "rotate(45deg)", verticalAlign: "middle" },
  ganttHint: { fontSize: 11.5, color: "var(--muted)", padding: "8px 10px 4px" },

  overlay: { position: "fixed", inset: 0, background: "rgba(10,12,18,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 },
  modal: { background: "var(--surface)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Fraunces', Georgia, serif", fontSize: 19, fontWeight: 600, marginBottom: 16, color: "var(--ink)" },
  closeBtn: { border: "none", background: "var(--surface2)", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "var(--muted)" },
  field: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 13, flex: 1 },
  fieldLabel: { fontSize: 12.5, fontWeight: 600, color: "var(--muted)" },
  fieldHint: { fontWeight: 400, fontStyle: "italic" },
  input: { border: "1px solid var(--line)", borderRadius: 9, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: "inherit", color: "var(--ink)", background: "var(--surface)" },
  row2: { display: "flex", gap: 12 },
  warn: { fontSize: 12.5, color: "#C0392B", marginTop: -6, marginBottom: 10 },
  tagEditRow: { display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", border: "1px solid var(--line)", borderRadius: 9, padding: "7px 9px" },
  tagChip: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, background: "var(--surface2)", borderRadius: 6, padding: "3px 4px 3px 8px", color: "var(--muted)" },
  tagX: { border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 14, lineHeight: 1, padding: 0 },
  tagInput: { border: "none", outline: "none", fontSize: 13.5, fontFamily: "inherit", flex: 1, minWidth: 110, padding: "2px 0", background: "transparent", color: "var(--ink)" },
  subRow: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0" },
  subText: { flex: 1, fontSize: 13.5 },
  subDate: { border: "1px solid var(--line)", borderRadius: 7, padding: "3px 6px", fontSize: 12, color: "var(--ink)", background: "var(--surface)", fontFamily: "inherit" },
  subX: { border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 15, lineHeight: 1 },
  depBox: { border: "1px solid var(--line)", borderRadius: 9, padding: 8, maxHeight: 130, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 },
  depItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", color: "var(--ink)" },
  depText: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  modalFoot: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 },
  deleteBtn: { border: "none", background: "transparent", color: "#C0392B", fontWeight: 600, fontSize: 13.5, cursor: "pointer" },
  ghostBtn: { border: "1px solid var(--line)", background: "var(--surface)", padding: "9px 16px", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: "pointer", color: "var(--ink)" },
  saveBtn: { border: "none", background: "var(--strong)", color: "var(--strongtext)", padding: "9px 18px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  colHelp: { fontSize: 13, color: "var(--muted)", marginTop: -6, marginBottom: 14, lineHeight: 1.4 },
  colRow: { display: "flex", alignItems: "center", gap: 8 },
  colReorder: { display: "flex", flexDirection: "column", gap: 1 },
  reorderBtn: { border: "1px solid var(--line)", background: "var(--surface)", borderRadius: 5, width: 22, height: 16, fontSize: 8, cursor: "pointer", color: "var(--muted)", padding: 0, lineHeight: 1 },
  colDoneToggle: { display: "flex", alignItems: "center", gap: 3, fontSize: 13, color: "#2F7D78", cursor: "pointer", whiteSpace: "nowrap" },
  colorPicker: { width: 32, height: 32, padding: 2, border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", background: "none", flexShrink: 0 },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
.ta-light { --bg:#F6F7F9; --surface:#ffffff; --surface2:#F1F3F5; --ink:#1A1D24; --muted:#6B7280; --line:#E4E7EC; --strong:#1A1D24; --strongtext:#ffffff; }
.ta-dark  { --bg:#15171C; --surface:#1E2128; --surface2:#262A32; --ink:#E7E9ED; --muted:#9BA1AB; --line:#2E333C; --strong:#E7E9ED; --strongtext:#15171C; }
.map-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.10); transform: translateY(-1px); transition: all .15s; }
.task-card:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.12); }
.gantt-bar:active { cursor: grabbing; }
.gantt-bar:hover { filter: brightness(1.07); }
.resize-handle:hover { background: rgba(255,255,255,0.35); }
.kanban-col { transition: background .12s; }
::-webkit-scrollbar { height: 10px; width: 10px; }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 6px; }
@media (max-width: 720px) { .kanban-col { min-width: 190px; } }
`;
