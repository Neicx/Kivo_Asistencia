import React, { useEffect, useState } from "react";

const API_URL = "http://192.168.56.1:8000/api";

export default function PerfilTrabajador({ trabajadorId }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trabajadorId) {
      setLoading(false);
      return;
    }

    const fetchPerfil = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/trabajadores/${trabajadorId}/perfil/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          setError("No se pudo cargar el perfil");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setPerfil(data);
      } catch (e) {
        setError("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [trabajadorId]);

  if (!trabajadorId) {
    return (
      <div className="card">
        <h2>Perfil de Trabajador</h2>
        <p>Selecciona un trabajador desde la tabla de asistencias.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Perfil de Trabajador</h2>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="card">
        <h2>Perfil de Trabajador</h2>
        <p>{error || "No se encontraron datos"}</p>
      </div>
    );
  }

  const nombreCompleto = `${perfil.nombres} ${perfil.apellidos}`;

  return (
    <div className="card">
      <h2>Perfil de Trabajador</h2>
      <div style={{ marginBottom: 16 }}>
        <p><strong>Nombre:</strong> {nombreCompleto}</p>
        <p><strong>RUT:</strong> {perfil.rut}</p>
        <p><strong>Cargo:</strong> {perfil.cargo || "-"}</p>
        <p><strong>Estado:</strong> {perfil.estado}</p>
        <p><strong>Fecha de ingreso:</strong> {perfil.fecha_ingreso || "-"}</p>
      </div>

      <h3>Historial de marcaciones</h3>
      {perfil.marcas && perfil.marcas.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {perfil.marcas.map((m) => {
              const dt = new Date(m.timestamp);
              const fecha = dt.toISOString().slice(0, 10);
              const hora = dt.toTimeString().slice(0, 5);
              const tipo = m.tipo_marca === "entrada" ? "Entrada" : "Salida";
              return (
                <tr key={m.id}>
                  <td>{fecha}</td>
                  <td>{hora}</td>
                  <td>{tipo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No hay marcaciones registradas.</p>
      )}
    </div>
  );
}
