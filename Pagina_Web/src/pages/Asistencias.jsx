import React, { useState, useEffect } from "react";

const API_URL = "http://192.168.56.1:8000/api";

export default function Asistencias({ onVerPerfil }) {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");
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
            ubicacion: "-",
            modificada_por: "-",
          };
        });
        setData(mapped);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchAsistencias();
  }, []);

  const filtered = data.filter((d) =>
    d.trabajador.toLowerCase().includes(filter.toLowerCase()) ||
    d.fecha.includes(filter)
  );

  if (loading) return <div className="card">Cargando asistencias...</div>;

  return (
    <div className="card" aria-live="polite">
      <h2>Historial de Asistencias</h2>
      <div style={{marginTop:10, marginBottom:10, display:"flex", gap:8}}>
        <input
          className="input"
          style={{width:220}}
          placeholder="Filtrar por nombre o fecha (YYYY-MM-DD)"
          value={filter}
          onChange={e=>setFilter(e.target.value)}
        />
        <button className="btn" onClick={()=>setFilter("")}>Limpiar</button>
      </div>

      <table className="table" role="table" aria-label="Tabla de asistencias">
        <thead>
          <tr>
            <th>Trabajador</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Modificada por</th>
            <th>Perfil</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r=>(
            <tr key={r.id}>
              <td>{r.trabajador}</td>
              <td>{r.fecha}</td>
              <td>{r.hora}</td>
              <td>{r.tipo}</td>
              <td>{r.ubicacion}</td>
              <td>{r.modificada_por}</td>
              <td>
                <button
                  className="btn"
                  onClick={() => onVerPerfil && onVerPerfil(r.trabajadorId)}
                >
                  Ver perfil
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="7" style={{padding:12, color:"#6b7280"}}>
                No hay registros que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
