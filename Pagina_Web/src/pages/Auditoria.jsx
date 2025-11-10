import React from "react";

const cambios = [
  { id:1, usuario:"RRHH - María", accion:"Modificó marcación", fecha:"2025-10-12 09:14", motivo:"Corrección de digitación" },
  { id:2, usuario:"Supervisor - Luis", accion:"Agregó licencia", fecha:"2025-10-10 14:30", motivo:"Documento entregado" },
];

export default function Auditoria() {
  return (
    <div className="card">
      <h2>Registro de Auditoría</h2>
      <table className="table">
        <thead><tr><th>Usuario</th><th>Acción</th><th>Fecha</th><th>Motivo</th></tr></thead>
        <tbody>
          {cambios.map(c=>(
            <tr key={c.id}>
              <td>{c.usuario}</td>
              <td>{c.accion}</td>
              <td>{c.fecha}</td>
              <td>{c.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
