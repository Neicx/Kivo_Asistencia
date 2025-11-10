import React, { useState } from "react";

const initial = [
  { id:1, trabajador:"Juan Pérez", fecha:"2025-10-13", hora:"08:00", tipo:"Entrada", ubicacion:"Planta 1", modificada_por:"-" },
  { id:2, trabajador:"María Soto", fecha:"2025-10-13", hora:"18:02", tipo:"Salida", ubicacion:"Oficina Central", modificada_por:"RRHH" },
  { id:3, trabajador:"Carlos Díaz", fecha:"2025-10-12", hora:"08:05", tipo:"Entrada", ubicacion:"Sucursal A", modificada_por:"-" },
];

export default function Asistencias() {
  const [data] = useState(initial);
  const [filter, setFilter] = useState("");

  const filtered = data.filter(d => 
    d.trabajador.toLowerCase().includes(filter.toLowerCase()) ||
    d.fecha.includes(filter)
  );

  return (
    <div className="card" aria-live="polite">
      <h2>Historial de Asistencias</h2>
      <div style={{marginTop:10, marginBottom:10, display:"flex", gap:8}}>
        <input className="input" style={{width:220}} placeholder="Filtrar por nombre o fecha (YYYY-MM-DD)" value={filter} onChange={e=>setFilter(e.target.value)} />
        <button className="btn" onClick={()=>setFilter("")}>Limpiar</button>
      </div>

      <table className="table" role="table" aria-label="Tabla de asistencias">
        <thead>
          <tr>
            <th>Trabajador</th><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Ubicación</th><th>Modificada por</th>
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
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan="6" style={{padding:12, color:"#6b7280"}}>No hay registros que coincidan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
