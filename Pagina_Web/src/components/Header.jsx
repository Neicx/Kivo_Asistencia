import React from "react";

export default function Header({ user, onLogout, empresas = [], empresaId, onChangeEmpresa }) {
  const puedeCambiarEmpresa = ["admin_rrhh", "asistente_rrhh", "fiscalizador"].includes(user.role);

  return (
    <div className="header" role="banner">
      <h1>Gestion de Asistencia</h1>
      <div className="user" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {puedeCambiarEmpresa && empresas.length > 0 && (
          <select
            value={empresaId || ""}
            onChange={(e) => onChangeEmpresa && onChangeEmpresa(Number(e.target.value))}
            className="form-select"
            style={{ minWidth: 180 }}
          >
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.razon_social}
              </option>
            ))}
          </select>
        )}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{user.role}</div>
        </div>
        <button onClick={onLogout} className="btn btn-danger" style={{ marginLeft: 12 }}>
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
