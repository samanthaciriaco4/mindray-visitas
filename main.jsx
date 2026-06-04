import { useState, useEffect } from "react";

const STORAGE_KEY = "mindray_visitas";

const PRODUCTOS = [
  "Torre de Laparoscopia UX3",
  "Torre de Laparoscopia UX5",
  "Instrumental REHUSABLE",
  "Instrumental DESECHABLE",
];

const ROLES_CONTACTO = [
  "Doctor/a", "Cirujano/a", "Anestesiólogo/a",
  "Enfermera/o Quirófano", "Sala de Operaciones",
  "Logística", "Compras / Administración", "Dirección", "Otro"
];

const ESTADOS = ["Interesado", "En negociación", "Pendiente oferta", "Cerrado ✓", "No interesado"];

const COLOR_ESTADO = {
  "Interesado": "#22c55e",
  "En negociación": "#f59e0b",
  "Pendiente oferta": "#3b82f6",
  "Cerrado ✓": "#8b5cf6",
  "No interesado": "#ef4444",
};

const COLOR_ROL = {
  "Doctor/a": "#00b4d8",
  "Cirujano/a": "#7c3aed",
  "Anestesiólogo/a": "#6366f1",
  "Enfermera/o Quirófano": "#ec4899",
  "Sala de Operaciones": "#f43f5e",
  "Logística": "#f59e0b",
  "Compras / Administración": "#10b981",
  "Dirección": "#e11d48",
  "Otro": "#64748b",
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function defaultContacto() {
  return { id: genId(), nombre: "", rol: "Doctor/a", telefono: "", notas: "" };
}

function defaultForm() {
  return {
    id: null,
    fecha: new Date().toISOString().slice(0, 10),
    cliente: "",
    productos: [],
    estado: "Interesado",
    notasVisita: "",
    proximoPaso: "",
    contactos: [defaultContacto()],
  };
}

export default function App() {
  const [view, setView] = useState("home");
  const [visitas, setVisitas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm());
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [expandedContacto, setExpandedContacto] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitas));
  }, [visitas]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function guardar() {
    if (!form.cliente.trim()) { showToast("⚠️ El nombre del cliente es obligatorio"); return; }
    if (form.contactos.some(c => !c.nombre.trim())) { showToast("⚠️ Todos los contactos necesitan nombre"); return; }
    if (form.id) {
      setVisitas(v => v.map(x => x.id === form.id ? { ...form } : x));
      showToast("✅ Visita actualizada");
    } else {
      setVisitas(v => [{ ...form, id: genId() }, ...v]);
      showToast("✅ Visita registrada");
    }
    setForm(defaultForm());
    setView("home");
  }

  function eliminar(id) {
    if (confirm("¿Eliminar esta visita?")) {
      setVisitas(v => v.filter(x => x.id !== id));
      setView("home");
      showToast("🗑️ Visita eliminada");
    }
  }

  function editar(v) {
    setForm({ ...v, productos: v.productos || (v.producto ? [v.producto] : []), contactos: v.contactos || [defaultContacto()] });
    setExpandedContacto(0);
    setView("nueva");
  }

  // Contactos helpers
  function addContacto() {
    const c = defaultContacto();
    setForm(f => ({ ...f, contactos: [...f.contactos, c] }));
    setExpandedContacto(form.contactos.length);
  }

  function updateContacto(idx, field, val) {
    setForm(f => ({
      ...f,
      contactos: f.contactos.map((c, i) => i === idx ? { ...c, [field]: val } : c)
    }));
  }

  function removeContacto(idx) {
    if (form.contactos.length === 1) { showToast("⚠️ Debe haber al menos un contacto"); return; }
    setForm(f => ({ ...f, contactos: f.contactos.filter((_, i) => i !== idx) }));
    setExpandedContacto(0);
  }

  const filtradas = visitas.filter(v => {
    const q = search.toLowerCase();
    return (
      v.cliente.toLowerCase().includes(q) ||
      (v.productos || []).some(p => p.toLowerCase().includes(q)) ||
      (v.contactos || []).some(c => c.nombre.toLowerCase().includes(q) || c.rol.toLowerCase().includes(q))
    );
  });

  const hoy = new Date().toISOString().slice(0, 10);
  const visitasHoy = visitas.filter(v => v.fecha === hoy).length;
  const estaSemana = (() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return visitas.filter(v => new Date(v.fecha) >= d).length;
  })();
  const cerrados = visitas.filter(v => v.estado === "Cerrado ✓").length;
  const pendientes = visitas.filter(v => v.proximoPaso && v.estado !== "Cerrado ✓" && v.estado !== "No interesado").length;

  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div>
            <div style={S.logo}>
              <span style={S.logoMark}>M</span>
              <span style={S.logoText}>MINDRAY</span>
            </div>
            <div style={S.headerSub}>Gestión de Visitas Comerciales</div>
          </div>
          <button style={S.btnResumen} onClick={() => setView(view === "resumen" ? "home" : "resumen")}>
            {view === "resumen" ? "← Volver" : "📊 Resumen"}
          </button>
        </div>
      </div>

      <div style={S.content}>
        {toast && <div style={S.toast}>{toast}</div>}

        {/* ── HOME ── */}
        {view === "home" && (
          <div>
            <div style={S.statsRow}>
              <Stat label="Hoy" value={visitasHoy} color="#00b4d8" />
              <Stat label="Semana" value={estaSemana} color="#7c3aed" />
              <Stat label="Cerrados" value={cerrados} color="#22c55e" />
              <Stat label="Seguim." value={pendientes} color="#f59e0b" />
            </div>
            <div style={S.row}>
              <input style={S.search} placeholder="🔍 Buscar cliente, contacto, producto..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <button style={S.btnNueva} onClick={() => { setForm(defaultForm()); setExpandedContacto(0); setView("nueva"); }}>
                + Nueva
              </button>
            </div>
            {filtradas.length === 0 ? (
              <div style={S.empty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ color: "#94a3b8", fontSize: 15 }}>
                  {search ? "Sin resultados" : "Registra tu primera visita"}
                </div>
              </div>
            ) : filtradas.map(v => (
              <div key={v.id} style={S.card} onClick={() => { setSelected(v); setView("detalle"); }}>
                <div style={S.cardTop}>
                  <div style={S.cardCliente}>{v.cliente}</div>
                  <div style={{ ...S.badge, background: COLOR_ESTADO[v.estado] + "22", color: COLOR_ESTADO[v.estado], border: `1px solid ${COLOR_ESTADO[v.estado]}44` }}>
                    {v.estado}
                  </div>
                </div>
                {(v.productos || []).length > 0 && <div style={{ fontSize: 12, color: "#00b4d8", marginBottom: 6 }}>🔬 {(v.productos || []).join(" · ")}</div>}
                <div style={S.cardContactos}>
                  {(v.contactos || []).map(c => (
                    <span key={c.id} style={{ ...S.rolChip, background: (COLOR_ROL[c.rol] || "#64748b") + "22", color: COLOR_ROL[c.rol] || "#64748b", border: `1px solid ${(COLOR_ROL[c.rol] || "#64748b")}44` }}>
                      {c.nombre} · {c.rol}
                    </span>
                  ))}
                </div>
                <div style={S.cardMeta}>
                  <span>📅 {formatDate(v.fecha)}</span>
                  <span>👥 {(v.contactos || []).length} contacto{(v.contactos || []).length !== 1 ? "s" : ""}</span>
                </div>
                {v.proximoPaso && <div style={S.cardSeguimiento}>→ {v.proximoPaso}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── NUEVA / EDITAR ── */}
        {view === "nueva" && (
          <div>
            <div style={S.pageTitle}>{form.id ? "✏️ Editar visita" : "➕ Nueva visita"}</div>

            <Label>Fecha *</Label>
            <input style={S.input} type="date" value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />

            <Label>Cliente / Hospital *</Label>
            <input style={S.input} placeholder="Ej: Hospital Universitario La Paz"
              value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />

            <Label>Producto(s) presentado(s)</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {PRODUCTOS.map(p => {
                const sel = (form.productos || []).includes(p);
                return (
                  <button key={p} style={{
                    background: sel ? "#00b4d8" : "transparent",
                    color: sel ? "#fff" : "#94a3b8",
                    border: `1.5px solid ${sel ? "#00b4d8" : "#334155"}`,
                    borderRadius: 10, padding: "10px 14px", fontSize: 13,
                    fontWeight: sel ? 700 : 400, cursor: "pointer", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }} onClick={() => setForm(f => ({
                    ...f,
                    productos: sel
                      ? (f.productos || []).filter(x => x !== p)
                      : [...(f.productos || []), p]
                  }))}>
                    {p}
                    {sel && <span style={{ fontSize: 16 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            <Label>Estado</Label>
            <div style={S.estadoGrid}>
              {ESTADOS.map(e => (
                <button key={e} style={{
                  ...S.estadoBtn,
                  background: form.estado === e ? COLOR_ESTADO[e] : "transparent",
                  color: form.estado === e ? "#fff" : COLOR_ESTADO[e],
                  border: `1.5px solid ${COLOR_ESTADO[e]}`,
                }} onClick={() => setForm(f => ({ ...f, estado: e }))}>{e}</button>
              ))}
            </div>

            {/* CONTACTOS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                👥 Contactos del cliente
              </div>
              <button style={S.btnAddContacto} onClick={addContacto}>+ Añadir contacto</button>
            </div>

            {form.contactos.map((c, idx) => (
              <div key={c.id} style={S.contactoCard}>
                <div style={S.contactoHeader} onClick={() => setExpandedContacto(expandedContacto === idx ? -1 : idx)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ ...S.rolDot, background: COLOR_ROL[c.rol] || "#64748b" }} />
                    <span style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>
                      {c.nombre || `Contacto ${idx + 1}`}
                    </span>
                    {c.rol && <span style={{ ...S.badge, background: (COLOR_ROL[c.rol] || "#64748b") + "22", color: COLOR_ROL[c.rol] || "#64748b", fontSize: 10 }}>{c.rol}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {form.contactos.length > 1 && (
                      <button style={S.btnDelContacto} onClick={e => { e.stopPropagation(); removeContacto(idx); }}>✕</button>
                    )}
                    <span style={{ color: "#64748b", fontSize: 12 }}>{expandedContacto === idx ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expandedContacto === idx && (
                  <div style={{ padding: "12px 0 4px" }}>
                    <Label>Nombre *</Label>
                    <input style={S.input} placeholder="Ej: Dra. García"
                      value={c.nombre} onChange={e => updateContacto(idx, "nombre", e.target.value)} />

                    <Label>Rol / Departamento</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {ROLES_CONTACTO.map(r => (
                        <button key={r} style={{
                          ...S.rolBtn,
                          background: c.rol === r ? (COLOR_ROL[r] || "#64748b") : "transparent",
                          color: c.rol === r ? "#fff" : (COLOR_ROL[r] || "#64748b"),
                          border: `1.5px solid ${COLOR_ROL[r] || "#64748b"}`,
                        }} onClick={() => updateContacto(idx, "rol", r)}>{r}</button>
                      ))}
                    </div>

                    <Label>Teléfono</Label>
                    <input style={S.input} type="tel" placeholder="Ej: 612 345 678"
                      value={c.telefono} onChange={e => updateContacto(idx, "telefono", e.target.value)} />

                    <Label>Notas del contacto</Label>
                    <input style={S.input} placeholder="Observaciones sobre esta persona..."
                      value={c.notas} onChange={e => updateContacto(idx, "notas", e.target.value)} />
                  </div>
                )}
              </div>
            ))}

            <Label>Notas de la visita</Label>
            <textarea style={{ ...S.input, minHeight: 90, resize: "vertical" }}
              placeholder="¿Qué se habló? ¿Qué les interesó?..."
              value={form.notasVisita} onChange={e => setForm(f => ({ ...f, notasVisita: e.target.value }))} />

            <Label>Próximo paso / Seguimiento</Label>
            <input style={S.input} placeholder="Ej: Enviar oferta la semana que viene"
              value={form.proximoPaso} onChange={e => setForm(f => ({ ...f, proximoPaso: e.target.value }))} />

            <div style={S.btnRow}>
              <button style={S.btnCancel} onClick={() => setView("home")}>Cancelar</button>
              <button style={S.btnGuardar} onClick={guardar}>
                {form.id ? "Guardar cambios" : "Registrar visita"}
              </button>
            </div>
          </div>
        )}

        {/* ── DETALLE ── */}
        {view === "detalle" && selected && (() => {
          const v = visitas.find(x => x.id === selected.id) || selected;
          return (
            <div>
              <button style={S.backBtn} onClick={() => setView("home")}>← Volver</button>
              <div style={S.detailHeader}>
                <div style={S.detailCliente}>{v.cliente}</div>
                <div style={{ ...S.badge, background: COLOR_ESTADO[v.estado] + "22", color: COLOR_ESTADO[v.estado], border: `1px solid ${COLOR_ESTADO[v.estado]}44`, fontSize: 13 }}>
                  {v.estado}
                </div>
              </div>

              <div style={S.detailGrid}>
                <DetailRow icon="📅" label="Fecha" value={formatDate(v.fecha)} />
                {(v.productos || []).length > 0 && <DetailRow icon="🔬" label="Producto(s)" value={(v.productos || []).join(", ")} />}
              </div>

              {/* Contactos */}
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 10 }}>
                👥 Contactos ({(v.contactos || []).length})
              </div>
              {(v.contactos || []).map(c => (
                <div key={c.id} style={{ ...S.detailBlock, borderLeft: `3px solid ${COLOR_ROL[c.rol] || "#64748b"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 15 }}>{c.nombre}</div>
                    <div style={{ ...S.badge, background: (COLOR_ROL[c.rol] || "#64748b") + "22", color: COLOR_ROL[c.rol] || "#64748b", fontSize: 11 }}>{c.rol}</div>
                  </div>
                  {c.telefono && <div style={{ fontSize: 13, color: "#94a3b8" }}>📞 {c.telefono}</div>}
                  {c.notas && <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>{c.notas}</div>}
                </div>
              ))}

              {v.notasVisita && (
                <div style={S.detailBlock}>
                  <div style={S.detailBlockLabel}>📝 Notas de la visita</div>
                  <div style={S.detailBlockText}>{v.notasVisita}</div>
                </div>
              )}

              {v.proximoPaso && (
                <div style={{ ...S.detailBlock, borderLeft: "3px solid #f59e0b" }}>
                  <div style={{ ...S.detailBlockLabel, color: "#f59e0b" }}>→ Próximo paso</div>
                  <div style={S.detailBlockText}>{v.proximoPaso}</div>
                </div>
              )}

              <div style={S.btnRow}>
                <button style={S.btnCancel} onClick={() => eliminar(v.id)}>🗑️ Eliminar</button>
                <button style={S.btnGuardar} onClick={() => editar(v)}>✏️ Editar</button>
              </div>
            </div>
          );
        })()}

        {/* ── RESUMEN ── */}
        {view === "resumen" && (
          <div>
            <div style={S.pageTitle}>📊 Resumen para mi jefe</div>
            <div style={S.resumenBox}>
              <div style={S.resumenTitle}>Panel de actividad comercial</div>
              <div style={S.resumenMeta}>Actualizado: {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</div>

              <div style={S.statsRow}>
                <Stat label="Total" value={visitas.length} color="#00b4d8" />
                <Stat label="Semana" value={estaSemana} color="#7c3aed" />
                <Stat label="Cerrados" value={cerrados} color="#22c55e" />
                <Stat label="Seguim." value={pendientes} color="#f59e0b" />
              </div>

              <div style={S.resumenSeccion}>Por estado:</div>
              {ESTADOS.map(e => {
                const n = visitas.filter(v => v.estado === e).length;
                if (!n) return null;
                return (
                  <div key={e} style={S.resumenEstadoRow}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLOR_ESTADO[e] }} />
                      <span style={{ color: "#e2e8f0", fontSize: 14 }}>{e}</span>
                    </div>
                    <div style={{ ...S.badge, background: COLOR_ESTADO[e] + "22", color: COLOR_ESTADO[e] }}>{n}</div>
                  </div>
                );
              })}

              <div style={{ ...S.resumenSeccion, marginTop: 18 }}>Por producto:</div>
              {PRODUCTOS.map(p => {
                const n = visitas.filter(v => (v.productos || []).includes(p)).length;
                if (!n) return null;
                return (
                  <div key={p} style={S.resumenEstadoRow}>
                    <span style={{ color: "#e2e8f0", fontSize: 13 }}>🔬 {p}</span>
                    <div style={{ ...S.badge, background: "#00b4d822", color: "#00b4d8" }}>{n}</div>
                  </div>
                );
              })}

              {pendientes > 0 && (
                <>
                  <div style={{ ...S.resumenSeccion, marginTop: 20 }}>Próximos pasos pendientes:</div>
                  {visitas.filter(v => v.proximoPaso && v.estado !== "Cerrado ✓" && v.estado !== "No interesado").map(v => (
                    <div key={v.id} style={S.resumenPaso}>
                      <div style={{ color: "#00b4d8", fontWeight: 600, fontSize: 14 }}>{v.cliente}</div>
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>{v.proximoPaso}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <button style={{ ...S.btnGuardar, width: "100%", marginTop: 0 }}
              onClick={() => {
                const totalContactos = visitas.reduce((acc, v) => acc + (v.contactos || []).length, 0);
                const lines = [
                  "INFORME DE VISITAS COMERCIALES — MINDRAY",
                  `Fecha: ${new Date().toLocaleDateString("es-ES")}`,
                  "",
                  `Total visitas: ${visitas.length} | Contactos totales: ${totalContactos}`,
                  `Esta semana: ${estaSemana} | Cerrados: ${cerrados} | Seguimientos: ${pendientes}`,
                  "",
                  "POR ESTADO:",
                  ...ESTADOS.map(e => {
                    const n = visitas.filter(v => v.estado === e).length;
                    return n ? `  ${e}: ${n}` : null;
                  }).filter(Boolean),
                  "",
                  "POR PRODUCTO:",
                  ...PRODUCTOS.map(p => {
                    const n = visitas.filter(v => (v.productos || []).includes(p)).length;
                    return n ? `  ${p}: ${n}` : null;
                  }).filter(Boolean),
                  "",
                  "PRÓXIMOS PASOS:",
                  ...visitas.filter(v => v.proximoPaso && v.estado !== "Cerrado ✓" && v.estado !== "No interesado")
                    .map(v => `  • ${v.cliente}: ${v.proximoPaso}`),
                  "",
                  "HISTÓRICO COMPLETO:",
                  ...visitas.map(v => [
                    `  [${formatDate(v.fecha)}] ${v.cliente} | ${(v.productos || []).join(", ") || "—"} | ${v.estado}`,
                    ...(v.contactos || []).map(c => `    - ${c.nombre} (${c.rol})${c.telefono ? " · " + c.telefono : ""}`),
                    v.notasVisita ? `    Notas: ${v.notasVisita}` : null,
                    v.proximoPaso ? `    Siguiente: ${v.proximoPaso}` : null,
                  ].filter(Boolean)).flat()
                ].join("\n");
                navigator.clipboard.writeText(lines).then(() => showToast("📋 Copiado al portapapeles"));
              }}>
              📋 Copiar informe completo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ ...S.stat, borderTop: `3px solid ${color}` }}>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function Label({ children }) {
  return <div style={S.label}>{children}</div>;
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={S.detailRow}>
      <span style={S.detailIcon}>{icon}</span>
      <div>
        <div style={S.detailLabel}>{label}</div>
        <div style={S.detailValue}>{value}</div>
      </div>
    </div>
  );
}

const S = {
  root: { background: "#0f172a", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0" },
  header: { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderBottom: "1px solid #1e3a5f", padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 10 },
  headerInner: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoMark: { background: "#00b4d8", color: "#fff", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 },
  logoText: { fontWeight: 800, fontSize: 17, letterSpacing: 2, color: "#fff" },
  headerSub: { fontSize: 11, color: "#64748b", marginTop: 2, letterSpacing: 0.5 },
  btnResumen: { background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "7px 13px", fontSize: 13, cursor: "pointer" },
  content: { padding: "16px 16px 40px" },
  toast: { position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", padding: "10px 20px", borderRadius: 10, fontSize: 14, zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 20px #0008" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 },
  stat: { background: "#1e293b", borderRadius: 10, padding: "10px 8px 8px", textAlign: "center" },
  statValue: { fontWeight: 800, fontSize: 22, lineHeight: 1 },
  statLabel: { fontSize: 10, color: "#64748b", marginTop: 4, lineHeight: 1.2 },
  row: { display: "flex", gap: 8, marginBottom: 14 },
  search: { flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" },
  btnNueva: { background: "#00b4d8", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" },
  empty: { textAlign: "center", padding: "60px 20px" },
  card: { background: "#1e293b", borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer", border: "1px solid #334155" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  cardCliente: { fontWeight: 700, fontSize: 15, color: "#f1f5f9" },
  badge: { borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  cardContactos: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 7 },
  rolChip: { borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 500 },
  cardMeta: { display: "flex", gap: 14, fontSize: 12, color: "#64748b" },
  cardSeguimiento: { marginTop: 8, fontSize: 12, color: "#f59e0b", background: "#f59e0b11", borderRadius: 6, padding: "4px 8px" },
  pageTitle: { fontWeight: 800, fontSize: 18, marginBottom: 18, color: "#f1f5f9" },
  label: { fontSize: 12, color: "#64748b", marginBottom: 5, marginTop: 14, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" },
  input: { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box" },
  estadoGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  estadoBtn: { borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnAddContacto: { background: "transparent", border: "1px solid #00b4d8", color: "#00b4d8", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  contactoCard: { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", marginBottom: 8 },
  contactoHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" },
  rolDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  btnDelContacto: { background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "2px 6px" },
  rolBtn: { borderRadius: 20, padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  btnRow: { display: "flex", gap: 10, marginTop: 24 },
  btnCancel: { flex: 1, background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 10, padding: "13px", fontSize: 15, cursor: "pointer" },
  btnGuardar: { flex: 2, background: "#00b4d8", border: "none", color: "#fff", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  backBtn: { background: "none", border: "none", color: "#64748b", fontSize: 14, cursor: "pointer", padding: "0 0 14px", display: "block" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 },
  detailCliente: { fontWeight: 800, fontSize: 20, color: "#f1f5f9" },
  detailGrid: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  detailRow: { display: "flex", gap: 12, alignItems: "flex-start" },
  detailIcon: { fontSize: 18, marginTop: 1 },
  detailLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: "#e2e8f0", fontWeight: 500 },
  detailBlock: { background: "#1e293b", borderRadius: 10, padding: 14, marginBottom: 10, borderLeft: "3px solid #334155" },
  detailBlockLabel: { fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" },
  detailBlockText: { fontSize: 14, color: "#cbd5e1", lineHeight: 1.6 },
  resumenBox: { background: "#1e293b", borderRadius: 14, padding: 18, marginBottom: 16, border: "1px solid #334155" },
  resumenTitle: { fontWeight: 800, fontSize: 17, color: "#f1f5f9", marginBottom: 2 },
  resumenMeta: { fontSize: 12, color: "#64748b", marginBottom: 16, textTransform: "capitalize" },
  resumenSeccion: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 10 },
  resumenEstadoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resumenPaso: { background: "#0f172a", borderRadius: 8, padding: "10px 12px", marginBottom: 8, borderLeft: "3px solid #f59e0b" },
};
