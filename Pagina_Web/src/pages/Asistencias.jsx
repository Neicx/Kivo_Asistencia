import React, { useState, useEffect } from "react";

const API_URL = "http://192.168.56.1:8000/api";

export default function Asistencias({ onVerPerfil }) {
  const [data, setData] = useState([]);
  const [filterNombre, setFilterNombre] = useState("");
  const [filterFecha, setFilterFecha] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsistencias = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/asistencias/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const json = await res.json();
        const mapped = json.map((m) => {
          const dt = new Date(m.timestamp);
          return {
            id: m.id,
            trabajadorId: m.trabajador,
            trabajador: `${m.trabajador_nombre} ${m.trabajador_apellido}`,
            fecha: dt.toISOString().slice(0, 10),
            hora: dt.toTimeString().slice(0, 5),
            tipo: m.tipo_marca === "entrada" ? "Entrada" : "Salida",
            modificada_por: "-",
          };
        });
        setData(mapped);
      } catch (err) {
        // Manejo de error silencioso
      } finally {
        setLoading(false);
      }
    };

    fetchAsistencias();
  }, []);

  const filtered = data.filter((d) => {
    return (
      (filterNombre ? d.trabajador.toLowerCase().includes(filterNombre.toLowerCase()) : true) &&
      (filterFecha ? d.fecha === filterFecha : true) &&
      (filterTipo ? d.tipo === filterTipo : true)
    );
  });

  const limpiarFiltros = () => {
    setFilterNombre("");
    setFilterFecha("");
    setFilterTipo("");
  };

  // Función para exportar CSV
  const exportCSV = () => {
    if (filtered.length === 0) return alert("No hay registros para exportar.");

    const headers = ["Trabajador", "Fecha", "Hora", "Tipo", "Modificada por"];
    const rows = filtered.map((r) => [r.trabajador, r.fecha, r.hora, r.tipo, r.modificada_por]);

    const csvContent =
      [headers, ...rows]
        .map((e) => e.map((v) => `"${v}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "asistencias.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="asistencias-container">
        <div className="loading-card">
          <svg className="loading-spinner" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
            >
              <animate
                attributeName="stroke-dashoffset"
                dur="1s"
                values="31.416;0"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          <p>Cargando asistencias...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="asistencias-container">
        <h2 className="asistencias-title">Historial de Asistencias</h2>

        {/* Filtros */}
        <div className="filters-card">
          <h3 className="filters-title">
            Filtros
          </h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="filterNombre" className="filter-label">Trabajador</label>
              <input
                id="filterNombre"
                className="filter-input"
                type="text"
                placeholder="Buscar por nombre..."
                value={filterNombre}
                onChange={(e) => setFilterNombre(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filterFecha" className="filter-label">Fecha</label>
              <input
                id="filterFecha"
                className="filter-input"
                type="date"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filterTipo" className="filter-label">Tipo</label>
              <select
                id="filterTipo"
                className="filter-select"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
            </div>
            <div className="filter-group">
              <button className="btn-clear" onClick={limpiarFiltros}>
                Limpiar
              </button>
              <button className="btn-export" onClick={exportCSV}>
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-container">
          <table className="asistencias-table">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Modificada por</th>
                <th>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="table-row">
                  <td>{r.trabajador}</td>
                  <td>{r.fecha}</td>
                  <td>{r.hora}</td>
                  <td className={`tipo-${r.tipo.toLowerCase()}`}>{r.tipo}</td>
                  <td>{r.modificada_por}</td>
                  <td>
                    <button
                      className="btn-profile"
                      onClick={() => onVerPerfil && onVerPerfil(r.trabajadorId)}
                    >
                      Ver perfil
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="no-results">
                    No hay registros que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS embebido */}
      <style>{`
        .asistencias-container { min-height:100vh; padding:2rem 1rem; font-family: Arial,sans-serif; background:#f9fafb; }
        .asistencias-title { font-size:2.5rem; font-weight:bold; text-align:center; margin-bottom:2rem; color:#1f2937; }
        .filters-card { background:white; border-radius:0.75rem; padding:1.5rem; box-shadow:0 10px 15px rgba(0,0,0,0.1); margin-bottom:2rem; }
        .filters-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
        @media(min-width:768px){.filters-grid{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}}
        .filter-group { display:flex; flex-direction:column; }
        .filter-label { margin-bottom:0.5rem; font-size:0.875rem; font-weight:500; color:#374151; }
        .filter-input,.filter-select { padding:0.75rem; border:1px solid #d1d5db; border-radius:0.5rem; font-size:1rem; }
        .btn-clear,.btn-export { margin-top:1rem; padding:0.5rem 1rem; border:none; border-radius:0.5rem; cursor:pointer; font-weight:500; color:white; background:#3b82f6; margin-right:0.5rem; }
        .btn-export { background:#10b981; }
        .table-container { overflow-x:auto; background:white; border-radius:0.75rem; box-shadow:0 10px 15px rgba(0,0,0,0.1); }
        .asistencias-table { width:100%; border-collapse:collapse; }
        .asistencias-table th,.asistencias-table td { padding:1rem; text-align:left; border-bottom:1px solid #e5e7eb; }
        .asistencias-table th { background:#f3f4f6; font-weight:600; color:#374151; }
        .table-row:hover { background:#f9fafb; }
        .tipo-entrada { color:#059669; font-weight:500; }
        .tipo-salida { color:#dc2626; font-weight:500; }
        .btn-profile { padding:0.5rem 1rem; border:none; border-radius:0.5rem; background:#3b82f6; color:white; cursor:pointer; font-weight:500; }
        .btn-profile:hover { background:#2563eb; }
        .no-results { text-align:center; padding:2rem; color:#6b7280; font-size:1.125rem; }
      `}</style>
    </>
  );
}
