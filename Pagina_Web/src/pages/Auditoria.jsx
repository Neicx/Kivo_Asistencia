import React, { useEffect, useState } from "react";

const API_URL = "http://192.168.56.1:8000/api";

export default function Auditoria({ user, empresaId, empresas = [] }) {
  const [cambios, setCambios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditoria = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const url = new URL(`${API_URL}/auditoria/`);
        if (empresaId) url.searchParams.append("empresa_id", empresaId);
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCambios(data);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAuditoria();
  }, [empresaId]);

  if (loading) {
    return (
      <div className="card">
        <h2>Registro de Auditoria</h2>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Registro de Auditoria</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Accion</th>
            <th>Empresa</th>
            <th>Modelo</th>
            <th>Registro</th>
            <th>Fecha</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {cambios.map((c) => (
            <tr key={c.id}>
              <td>{c.usuario_rut || c.usuario_email}</td>
              <td>{c.accion}</td>
              <td>{c.empresa_nombre || "-"}</td>
              <td>{c.modelo_afectado}</td>
              <td>{c.registro_id}</td>
              <td>{c.fecha}</td>
              <td>{c.motivo || "-"}</td>
            </tr>
          ))}
          {cambios.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "1rem" }}>
                No hay eventos para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
