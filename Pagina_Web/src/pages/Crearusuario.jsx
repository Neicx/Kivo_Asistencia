import React, { useState, useEffect } from "react";

const API_URL = "http://192.168.56.1:8000/api";

export default function CrearUsuario() {
  const [empresas, setEmpresas] = useState([]);
  const [turnos, setTurnos] = useState([]);

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
  const [loading, setLoading] = useState(false); // <-- Agregado para loading

  // ⚠ IMPORTANTE: usa el nombre real de tu token
  const token = localStorage.getItem("accessToken");

  // 👉 Cargar EMPRESAS al inicio
  useEffect(() => {
    fetch(`${API_URL}/empresas/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setEmpresas)
      .catch(() => setError("Error al cargar empresas."));
  }, [token]);

  // 👉 Manejar cambios normales
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 👉 Manejar cambio de empresa y cargar TURNOS
  const handleEmpresaChange = (e) => {
    const empresaId = e.target.value;

    setForm((prev) => ({ ...prev, empresa_id: empresaId }));

    if (!empresaId) {
      setTurnos([]);
      return;
    }

    fetch(`${API_URL}/empresas/${empresaId}/turnos/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then(setTurnos)
      .catch(() => setError("Error al cargar turnos."));
  };

  // 👉 Crear usuario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true); // <-- Iniciar loading

    try {
      const res = await fetch(`${API_URL}/rrhh/usuarios/crear/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(JSON.stringify(data, null, 2));
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
        empresa_id: "",
        turno_id: "",
      });

    } catch (error) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false); // <-- Terminar loading
    }
  };

  const isTrabajador = form.rol === "trabajador";

  return (
    <>
      <div className="crear-usuario-container">
        <div className="crear-usuario-header">
          <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h2 className="crear-usuario-title">Crear Usuario / Trabajador</h2>
        </div>

        {/* Mensajes de éxito/error */}
        {success && (
          <div className="alert alert-success">
            <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form className="crear-usuario-form" onSubmit={handleSubmit}>
          {/* Sección: Datos de Usuario */}
          <div className="form-section">
            <h3 className="section-title">
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos de Usuario
            </h3>
            <div className="form-grid">
              {/* Campos básicos */}
              <div className="form-group">
                <label htmlFor="rut" className="form-label">RUT *</label>
                <input
                  id="rut"
                  name="rut"
                  type="text"
                  placeholder="Ej: 12345678-9"
                  value={form.rut}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Correo Usuario *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Contraseña *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rol" className="form-label">Rol</label>
                <select
                  id="rol"
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="trabajador">Trabajador</option>
                  <option value="asistente_rrhh">Asistente RRHH</option>
                  <option value="admin_rrhh">Admin RRHH</option>
                  <option value="fiscalizador">Fiscalizador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Datos del Trabajador */}
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
                  <label htmlFor="nombres" className="form-label">Nombres *</label>
                  <input
                    id="nombres"
                    name="nombres"
                    type="text"
                    value={form.nombres}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="apellidos" className="form-label">Apellidos *</label>
                  <input
                    id="apellidos"
                    name="apellidos"
                    type="text"
                    value={form.apellidos}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                {/* EMPRESA */}
                <div className="form-group">
                  <label htmlFor="empresa_id" className="form-label">Empresa *</label>
                  <select
                    id="empresa_id"
                    name="empresa_id"
                    value={form.empresa_id}
                    onChange={handleEmpresaChange}
                    required
                    className="form-select"
                  >
                    <option value="">Seleccione empresa</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.razon_social}</option>
                    ))}
                  </select>
                </div>

                {/* TURNOS */}
                <div className="form-group">
                  <label htmlFor="turno_id" className="form-label">Turno (opcional)</label>
                  <select
                    id="turno_id"
                    name="turno_id"
                    value={form.turno_id}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Sin turno</option>
                    {turnos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cargo" className="form-label">Cargo</label>
                  <input
                    id="cargo"
                    name="cargo"
                    type="text"
                    value={form.cargo}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="area_trabajador" className="form-label">Área</label>
                  <input
                    id="area_trabajador"
                    name="area_trabajador"
                    type="text"
                    value={form.area_trabajador}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tipo_contrato" className="form-label">Tipo de Contrato</label>
                  <select
                    id="tipo_contrato"
                    name="tipo_contrato"
                    value={form.tipo_contrato}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="contrato_indefinido">Contrato indefinido</option>
                    <option value="contrato_plazo_fijo">Plazo fijo</option>
                    <option value="contrato_por_obra">Por obra o faena</option>
                    <option value="contrato_part_time">Part Time</option>
                    <option value="contrato_para_extranjeros">Extranjeros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="correo" className="form-label">Correo Laboral (opcional)</label>
                  <input
                    id="correo"
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

          {/* Botón */}
          <div className="form-submit">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <svg className="loading-spinner" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="31.416" strokeDashoffset="31.416">
                      <animate attributeName="stroke-dashoffset" dur="1s" values="31.416;0" repeatCount="indefinite" />
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

      {/* CSS embebido */}
      <style>{`
        .crear-usuario-container {
          max-width: 900px;
          margin: 2rem auto;
          padding: 2rem;
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          border-radius: 20px;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
          font-family: 'Arial', sans-serif;
        }

        .crear-usuario-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .header-icon {
          width: 2rem;
          height: 2rem;
          color: #3b82f6;
          margin-right: 0.75rem;
        }

        .crear-usuario-title {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }

        .alert {
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          animation: fadeIn 0.5s ease-in;
        }

        .alert-success {
          background-color: #d1fae5;
          border: 1px solid #10b981;
          color: #065f46;
        }

        .alert-error {
          background-color: #fee2e2;
          border: 1px solid #ef4444;
          color: #991b1b;
        }

        .alert-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .crear-usuario-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-section {
          background: white;
          padding: 1.5rem;
          border-radius: 15px;
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #374151;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }

        .section-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #3b82f6;
          margin-right: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input, .form-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background-color: #f9fafb;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-submit {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 10px;
`}</style>
    </>
  );
}
