import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://192.168.1.50:8000";

export default function Licencias({ user, empresaId }) {
  const [licencias, setLicencias] = useState([]);
  const [form, setForm] = useState({
    tipo: "licencia_medica",
    fecha_inicio: "",
    fecha_fin: "",
    motivo_detallado: "",
    archivo: null,
  });

  const cargarLicencias = async () => {
    const token = user.access;
    const params = {};
    if (empresaId) params.empresa_id = empresaId;
    const res = await axios.get(`${API}/api/licencias/`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    setLicencias(res.data);
  };

  const crearLicencia = async () => {
    const fd = new FormData();
    fd.append("tipo", form.tipo);
    fd.append("fecha_inicio", form.fecha_inicio);
    fd.append("fecha_fin", form.fecha_fin);
    fd.append("motivo_detallado", form.motivo_detallado);
    if (form.archivo) fd.append("archivo", form.archivo);

    await axios.post(`${API}/api/licencias/`, fd, {
      headers: {
        Authorization: `Bearer ${user.access}`,
        "Content-Type": "multipart/form-data",
      },
    });

    cargarLicencias();
    setForm({
      tipo: "licencia_medica",
      fecha_inicio: "",
      fecha_fin: "",
      motivo_detallado: "",
      archivo: null,
    });
  };

  const resolver = async (id, accion) => {
    try {
      const res = await axios.post(
        `${API}/api/licencias/${id}/resolver/`,
        { accion },
        { headers: { Authorization: `Bearer ${user.access}` } }
      );

      const nuevoEstado = res.data.estado;
      setLicencias((prev) => prev.map((l) => (l.id === id ? { ...l, estado: nuevoEstado } : l)));
    } catch (err) {
      alert(err.response?.data?.detail || "Error al resolver la solicitud");
    }
  };

  useEffect(() => {
    cargarLicencias();
  }, [empresaId]);

  return (
    <>
      <div className="licencias-container">
        <h2 className="licencias-title">Gestion de Licencias</h2>

        {user.role === "trabajador" && (
          <div className="form-card">
            <h3 className="form-title">Crear Licencia</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tipo" className="form-label">Tipo de Licencia</label>
                <select
                  id="tipo"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="form-select"
                >
                  <option value="licencia_medica">Licencia medica</option>
                  <option value="permiso_administrativo">Permiso administrativo</option>
                  <option value="permiso_sin_goce">Permiso sin goce de sueldo</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fecha_inicio" className="form-label">Fecha de Inicio</label>
                <input
                  id="fecha_inicio"
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="fecha_fin" className="form-label">Fecha de Fin</label>
                <input
                  id="fecha_fin"
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="motivo_detallado" className="form-label">Motivo Detallado</label>
                <textarea
                  id="motivo_detallado"
                  value={form.motivo_detallado}
                  onChange={(e) => setForm({ ...form, motivo_detallado: e.target.value })}
                  className="form-textarea"
                  placeholder="Describe el motivo de la licencia..."
                  rows="3"
                  required
                />
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="archivo" className="form-label">Adjuntar Archivo PDF (opcional)</label>
                <input
                  id="archivo"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setForm({ ...form, archivo: e.target.files[0] })}
                  className="form-file"
                />
              </div>
            </div>
            <div className="form-submit">
              <button onClick={crearLicencia} className="btn-primary">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar Licencia
              </button>
            </div>
          </div>
        )}

        <h3 className="list-title">Listado de Licencias</h3>
        <div className="table-container">
          <table className="licencias-table">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Documento</th>
                {["admin_rrhh", "asistente_rrhh"].includes(user.role) && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {licencias.map((l) => (
                <tr key={l.id} className={`table-row ${l.estado.toLowerCase()}`}>
                  <td>{l.trabajador_nombre}</td>
                  <td>{l.tipo.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                  <td className={`estado-${l.estado.toLowerCase()}`}>{l.estado}</td>
                  <td>{l.fecha_inicio}</td>
                  <td>{l.fecha_fin}</td>
                  <td>
                    {l.archivo ? (
                      <a href={`${API}${l.archivo}`} target="_blank" rel="noreferrer" className="link-pdf">
                        <svg className="link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Ver PDF
                      </a>
                    ) : (
                      <span className="no-file">-</span>
                    )}
                  </td>
                  {["admin_rrhh", "asistente_rrhh"].includes(user.role) && (
                    <td>
                      {l.estado === "pendiente" ? (
                        <div className="action-buttons">
                          <button onClick={() => resolver(l.id, "aceptar")} className="btn-accept">
                            <svg className="btn-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Aceptar
                          </button>
                          <button onClick={() => resolver(l.id, "rechazar")} className="btn-reject">
                            <svg className="btn-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className={`estado-final ${l.estado.toLowerCase()}`}>{l.estado}</span>
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
        .licencias-container { min-height: 100vh; background-color: #f9fafb; padding: 2rem 1rem; font-family: 'Arial', sans-serif; }
        .licencias-title, .list-title { font-size: 2.5rem; font-weight: bold; color: #1f2937; text-align: center; margin-bottom: 2rem; }
        .list-title { margin-top: 3rem; }
        .form-card { background-color: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); margin-bottom: 2rem; }
        .form-title { font-size: 1.5rem; font-weight: 600; color: #374151; margin-bottom: 1rem; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 768px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
        .form-group { display: flex; flex-direction: column; }
        .form-group-full { grid-column: 1 / -1; }
        .form-label { font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem; }
        .form-input, .form-select, .form-textarea, .form-file { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .form-textarea { resize: vertical; }
        .form-file { padding: 0.5rem; }
        .form-submit { text-align: center; margin-top: 1.5rem; }
        .btn-primary, .btn-accept, .btn-reject { display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s, transform 0.1s; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .btn-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
        .btn-primary:hover { background: linear-gradient(135deg, #2563eb, #1e40af); transform: translateY(-1px); }
        .btn-accept { background: linear-gradient(135deg, #10b981, #059669); color: white; margin-right: 0.5rem; }
        .btn-accept:hover { background: linear-gradient(135deg, #059669, #047857); transform: translateY(-1px); }
        .btn-reject { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .btn-reject:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); transform: translateY(-1px); }
        .btn-icon, .btn-icon-small { width: 1.25rem; height: 1.25rem; margin-right: 0.5rem; }
        .btn-icon-small { width: 1rem; height: 1rem; }
        .table-container { overflow-x: auto; background-color: white; border-radius: 0.75rem; box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); }
        .licencias-table { width: 100%; border-collapse: collapse; }
        .licencias-table th, .licencias-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .licencias-table th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
        .table-row { transition: background-color 0.2s; }
        .table-row:hover { background-color: #f9fafb; }
        .table-row.pendiente { background-color: #fef3c7; }
        .estado-pendiente { color: #d97706; font-weight: 500; }
        .estado-aceptado { color: #059669; font-weight: 500; }
        .estado-rechazado { color: #dc2626; font-weight: 500; }
        .estado-final { font-weight: 500; }
        .link-pdf { display: inline-flex; align-items: center; color: #3b82f6; text-decoration: none; font-weight: 500; }
        .link-pdf:hover { text-decoration: underline; }
        .link-icon { width: 1rem; height: 1rem; margin-right: 0.5rem; }
        .no-file { color: #9ca3af; }
        .action-buttons { display: flex; gap: 0.5rem; }
      `}</style>
    </>
  );
}
