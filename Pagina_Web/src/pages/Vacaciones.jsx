import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://192.168.56.1:8000";

export default function Vacaciones({ user }) {
  const [vacaciones, setVacaciones] = useState([]);
  const [form, setForm] = useState({
    fecha_inicio: "",
    fecha_fin: "",
  });

  const cargarVacaciones = async () => {
    const res = await axios.get(`${API}/api/vacaciones/`, {
      headers: { Authorization: `Bearer ${user.access}` },
    });
    setVacaciones(res.data);
  };

  const crearVacaciones = async () => {
    await axios.post(
      `${API}/api/vacaciones/`,
      {
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
      },
      {
        headers: { Authorization: `Bearer ${user.access}` },
      }
    );

    cargarVacaciones();
    setForm({ fecha_inicio: "", fecha_fin: "" });
  };

  const resolver = async (id, accion) => {
    try {
      const res = await axios.post(
        `${API}/api/vacaciones/${id}/resolver/`,
        { accion },
        { headers: { Authorization: `Bearer ${user.access}` } }
      );

      const nuevoEstado = res.data.estado;

      setVacaciones((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, estado: nuevoEstado } : v
        )
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Error al resolver la solicitud");
    }
  };

  useEffect(() => {
    cargarVacaciones();
  }, []);

  return (
    <>
      <div className="licencias-container">
        <h2 className="licencias-title">Gestión de Vacaciones</h2>

        {user.role === "trabajador" && (
          <div className="form-card">
            <h3 className="form-title">Solicitar Vacaciones</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Fecha de Inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Fin</label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-submit">
              <button onClick={crearVacaciones} className="btn-primary">
                Solicitar Vacaciones
              </button>
            </div>
          </div>
        )}

        <h3 className="list-title">Listado de Vacaciones</h3>
        <div className="table-container">
          <table className="licencias-table">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Días</th>
                {["admin_rrhh", "asistente_rrhh"].includes(user.role) && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {vacaciones.map((v) => (
                <tr key={v.id} className={`table-row ${v.estado.toLowerCase()}`}>
                  <td>{v.trabajador_nombre}</td>
                  <td className={`estado-${v.estado.toLowerCase()}`}>{v.estado}</td>
                  <td>{v.fecha_inicio}</td>
                  <td>{v.fecha_fin}</td>
                  <td>{v.dias}</td>

                  {["admin_rrhh", "asistente_rrhh"].includes(user.role) && (
                    <td>
                      {v.estado === "pendiente" ? (
                        <div className="action-buttons">
                          <button
                            onClick={() => resolver(v.id, "aceptar")}
                            className="btn-accept"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => resolver(v.id, "rechazar")}
                            className="btn-reject"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className={`estado-final ${v.estado.toLowerCase()}`}>
                          {v.estado}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        /* Contenedor principal */
        .licencias-container {
          min-height: 100vh;
          background-color: #f9fafb; /* Gris claro */
          padding: 2rem 1rem;
          font-family: 'Arial', sans-serif;
        }

        .licencias-title, .list-title {
          font-size: 2.5rem;
          font-weight: bold;
          color: #1f2937; /* Gris oscuro */
          text-align: center;
          margin-bottom: 2rem;
        }

        .list-title {
          margin-top: 3rem;
        }

        /* Formulario */
        .form-card {
          background-color: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group-full {
          grid-column: 1 / -1; /* Ocupa toda la fila */
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input, .form-select, .form-textarea, .form-file {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
        }

        .form-file {
          padding: 0.5rem;
        }

        .form-submit {
          text-align: center;
          margin-top: 1.5rem;
        }

        /* Botones */
        .btn-primary, .btn-accept, .btn-reject {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-1px);
        }

        .btn-accept {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          margin-right: 0.5rem;
        }

        .btn-accept:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
        }

        .btn-reject {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .btn-reject:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-1px);
        }

        .btn-icon, .btn-icon-small {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
        }

        .btn-icon-small {
          width: 1rem;
          height: 1rem;
        }

        /* Tabla */
        .table-container {
          overflow-x: auto; /* Scroll horizontal en móviles */
          background-color: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }

        .licencias-table {
          width: 100%;
          border-collapse: collapse;
        }

        .licencias-table th, .licencias-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .licencias-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }

        .table-row {
          transition: background-color 0.2s;
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .table-row.pendiente {
          background-color: #fef3c7; /* Amarillo claro */
        }

        .estado-pendiente {
          color: #d97706; /* Amarillo oscuro */
          font-weight: 500;
        }

        .estado-aceptado {
          color: #059669; /* Verde */
          font-weight: 500;
        }

        .estado-rechazado {
          color: #dc2626; /* Rojo */
          font-weight: 500;
        }

        .estado-final {
          font-weight: 500;
        }

        .link-pdf {
          display: inline-flex;
          align-items: center;
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .link-pdf:hover {
          text-decoration: underline;
        }

        .link-icon {
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
        }

        .no-file {
          color: #9ca3af;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
      `}</style>
    </>
  );
}
