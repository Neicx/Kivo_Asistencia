import React from "react";

const vacaciones = [
  { id:1, trabajador:"Juan Pérez", dias_tomados:10, dias_disponibles:5 },
  { id:2, trabajador:"María Soto", dias_tomados:7, dias_disponibles:8 },
];

export default function Vacaciones() {
  return (
    <div className="card">
      <h2>Vacaciones</h2>
      <table className="table">
        <thead><tr><th>Trabajador</th><th>Días tomados</th><th>Días disponibles</th></tr></thead>
        <tbody>
          {vacaciones.map(v=>(
            <tr key={v.id}>
              <td>{v.trabajador}</td><td>{v.dias_tomados}</td><td>{v.dias_disponibles}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
