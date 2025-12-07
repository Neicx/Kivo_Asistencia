import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://192.168.56.1:8000/api";

export default function CrearUsuario({ onVerPerfil, empresaId, empresas: empresasProp = [], user }) {
  const [empresas, setEmpresas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresaListadoId, setEmpresaListadoId] = useState(empresaId || "");
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [form, setForm] = useState({
    rut: "",
    email: "",
    password: "",
    rol: "trabajador",
    nombres: "",
    apellidos: "",
    cargo: "",
    area_trabajador: "",
    tipo_contrato: "contrato_indefinido",
    correo: "",
    empresa_id: "",
    turno_id: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = useMemo(() => localStorage.getItem("accessToken"), []);

  // cargar empresas
  useEffect(() => {
    if (empresasProp.length) {
      setEmpresas(empresasProp);
      return;
    }
    fetch(`${API_URL}/empresas/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setEmpresas)
      .catch(() => setError("Error al cargar empresas."));
  }, [token, empresasProp]);

  // set empresa seleccionada desde props
  useEffect(() => {
    if (empresaId) {
      setEmpresaListadoId(empresaId);
      setForm((prev) => ({ ...prev, empresa_id: String(empresaId) }));
    }
  }, [empresaId]);

  // cargar turnos al cambiar empresa del formulario
  const handleEmpresaChange = (e) => {
    const empresaIdSel = e.target.value;
    setForm((prev) => ({ ...prev, empresa_id: empresaIdSel, turno_id: "" }));
    if (!empresaIdSel) {
      setTurnos([]);
      return;
    }
    fetch(`${API_URL}/empresas/${empresaIdSel}/turnos/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTurnos)
      .catch(() => setError("Error al cargar turnos."));
  };

  // cargar usuarios por empresa
  const fetchUsuarios = async (empId) => {
    setLoadingUsuarios(true);
    try {
      const res = await fetch(`${API_URL}/usuarios/?empresa_id=${empId || ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setUsuarios([]);
        return;
      }
      const data = await res.json();
      setUsuarios(data);
    } catch (e) {
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    if (empresaListadoId) {
      fetchUsuarios(empresaListadoId);
    }
  }, [empresaListadoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rrhh/usuarios/crear/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data === "string" ? data : JSON.stringify(data, null, 2));
        return;
      }
      setSuccess("Usuario creado exitosamente.");
      setForm({
        rut: "",
        email: "",
        password: "",
        rol: "trabajador",
        nombres: "",
        apellidos: "",
        cargo: "",
        area_trabajador: "",
        tipo_contrato: "contrato_indefinido",
        correo: "",
        empresa_id: empresaId ? String(empresaId) : "",
        turno_id: "",
      });
      if (empresaListadoId) {
        fetchUsuarios(empresaListadoId);
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const isTrabajador = form.rol === "trabajador";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="crear-usuario-container">
        <div className="crear-usuario-header" style={{ alignItems: "center", gap: 8 }}>
          <h2 className="crear-usuario-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Usuarios de la empresa
          </h2>
        </div>

        <div className="form-section" style={{ marginBottom: 24 }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <select
                className="form-input"
                value={empresaListadoId}
                onChange={(e) => setEmpresaListadoId(e.target.value)}
              >
                <option value="">Todas</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.razon_social || e.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {loadingUsuarios ? (
              <p>Cargando usuarios...</p>
            ) : (
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>RUT</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Empresa</th>
                    <th>Trabajador</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={6}>No hay usuarios para esta empresa.</td>
                    </tr>
                  )}
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.rut}</td>
                      <td>{u.email}</td>
                      <td>{u.rol}</td>
                      <td>{(u.empresas && u.empresas[0] && u.empresas[0].razon_social) || "-"}</td>
                      <td>
                        {u.trabajador_nombre
                          ? `${u.trabajador_nombre} ${u.trabajador_apellidos || ""}`
                          : "-"}
                      </td>
                      <td>
                        {u.trabajador_id && onVerPerfil && (
                          <button className="btn" onClick={() => onVerPerfil(u.trabajador_id)}>
                            Ver perfil
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="crear-usuario-header" style={{ marginTop: 24, alignItems: "center", gap: 8 }}>
          <h2 className="crear-usuario-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear Usuario / Trabajador
          </h2>
        </div>

        {success && (
          <div className="alert alert-success">
            <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        <form className="crear-usuario-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos de Usuario
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">RUT *</label>
                <input
                  name="rut"
                  type="text"
                  value={form.rut}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Usuario *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select name="rol" value={form.rol} onChange={handleChange} className="form-input">
                  <option value="trabajador">Trabajador</option>
                  <option value="asistente_rrhh">Asistente RRHH</option>
                  <option value="admin_rrhh">Admin RRHH</option>
                  <option value="fiscalizador">Fiscalizador</option>
                </select>
              </div>
            </div>
          </div>

          {isTrabajador && (
            <div className="form-section">
              <h3 className="section-title">
                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Datos del Trabajador
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombres *</label>
                  <input
                    name="nombres"
                    type="text"
                    value={form.nombres}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input
                    name="apellidos"
                    type="text"
                    value={form.apellidos}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Empresa *</label>
                  <select
                    name="empresa_id"
                    value={form.empresa_id}
                    onChange={handleEmpresaChange}
                    required
                    className="form-input"
                  >
                    <option value="">Seleccione empresa</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.razon_social}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Turno (opcional)</label>
                  <select
                    name="turno_id"
                    value={form.turno_id}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Sin turno</option>
                    {turnos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo</label>
                  <input
                    name="cargo"
                    type="text"
                    value={form.cargo}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Área</label>
                  <input
                    name="area_trabajador"
                    type="text"
                    value={form.area_trabajador}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Contrato</label>
                  <select
                    name="tipo_contrato"
                    value={form.tipo_contrato}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="contrato_indefinido">Contrato indefinido</option>
                    <option value="contrato_plazo_fijo">Plazo fijo</option>
                    <option value="contrato_por_obra">Por obra o faena</option>
                    <option value="contrato_part_time">Part Time</option>
                    <option value="contrato_para_extranjeros">Extranjeros</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Laboral (opcional)</label>
                  <input
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-submit">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <svg className="loading-spinner" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray="31.416"
                      strokeDashoffset="31.416"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        dur="1s"
                        values="31.416;0"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                  Creando...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
