import React from "react";

const licencias = [
  { id:1, trabajador:"Juan Pérez", motivo:"Licencia médica", dias:5, fecha_inicio:"2025-09-20" },
  { id:2, trabajador:"María Soto", motivo:"Permiso administrativo", dias:1, fecha_inicio:"2025-09-25" },
];

export default function Licencias() {
  return (
    <div className="card">
      <h2>Gestión de Licencias</h2>
      <table className="table" aria-label="Tabla de licencias">
        <thead>
          <tr><th>Trabajador</th><th>Motivo</th><th>Días</th><th>Fecha inicio</th></tr>
        </thead>
        <tbody>
          {licencias.map(l=>(
            <tr key={l.id}>
              <td>{l.trabajador}</td>
              <td>{l.motivo}</td>
              <td>{l.dias}</td>
              <td>{l.fecha_inicio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
