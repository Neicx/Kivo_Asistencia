import React, { useEffect, useState } from "react";

const API_URL = "http://192.168.56.1:8000/api";

const tiposContrato = [
  { value: "contrato_por_obra", label: "Contrato por obra o faena" },
  { value: "contrato_plazo_fijo", label: "Contrato a plazo fijo" },
  { value: "contrato_part_time", label: "Contrato part time" },
  { value: "contrato_indefinido", label: "Contrato indefinido" },
  { value: "contrato_para_extranjeros", label: "Contrato para extranjeros" },
];

export default function PerfilTrabajador({ trabajadorId, user, empresas = [] }) {
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editMode, setEditMode] = useState(false);

  const canEdit = user?.role === "admin_rrhh";

  const cargarPerfil = async () => {
    if (!trabajadorId) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/trabajadores/${trabajadorId}/perfil/`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
      setForm({
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        cargo: data.cargo || "",
        area_trabajador: data.area_trabajador || "",
        tipo_contrato: data.tipo_contrato || "",
        correo: data.correo || "",
        empresa_id: data.empresa_id || "",
        motivo: "",
      });
      setEditMode(false);
    } catch (e) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError("");
    setMessage("");
    setLoading(true);
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajadorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    if (!canEdit || !perfil?.usuario_id) return;
    if (!form.motivo || form.motivo.trim() === "") {
        setError("Debes ingresar un motivo para auditoría");
        return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        ...form,
        empresa_id: form.empresa_id ? Number(form.empresa_id) : null,
      };

      const res = await fetch(`${API_URL}/rrhh/usuarios/${perfil.usuario_id}/actualizar/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data.detail || data;
        setError(typeof detail === "string" ? detail : "No se pudo guardar los cambios");
        return;
      }

      setMessage("Datos actualizados correctamente");
      setEditMode(false);
      await cargarPerfil();
    } catch (e) {
      setError("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

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

  if (error && !perfil) {
    return (
      <div className="card">
        <h2>Perfil de Trabajador</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!perfil) {
    return null;
  }

  const nombreCompleto = `${perfil.nombres} ${perfil.apellidos}`;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Perfil de Trabajador</h2>
        {canEdit && (
          <div style={{ display: "flex", gap: 8 }}>
            {!editMode && (
              <button className="btn" onClick={() => setEditMode(true)}>
                Editar
              </button>
            )}
            {editMode && (
              <>
                <button className="btn" onClick={handleGuardar} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                    setMessage("");
                    cargarPerfil();
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombres</label>
          <input
            type="text"
            name="nombres"
            className="form-input"
            value={form.nombres || ""}
            onChange={handleChange}
            disabled={!canEdit || !editMode}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Apellidos</label>
          <input
            type="text"
            name="apellidos"
            className="form-input"
            value={form.apellidos || ""}
            onChange={handleChange}
            disabled={!canEdit || !editMode}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Cargo</label>
          <input
            type="text"
            name="cargo"
            className="form-input"
            value={form.cargo || ""}
            onChange={handleChange}
            disabled={!canEdit || !editMode}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Área</label>
          <input
            type="text"
            name="area_trabajador"
            className="form-input"
            value={form.area_trabajador || ""}
            onChange={handleChange}
            disabled={!canEdit || !editMode}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de contrato</label>
          <select
            name="tipo_contrato"
            className="form-input"
            value={form.tipo_contrato || ""}
            onChange={handleChange}
            disabled={!canEdit || !editMode}
          >
            <option value="">Seleccione</option>
            {tiposContrato.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Correo</label>
          <input
            type="email"
            name="correo"
            className="form-input"
            value={form.correo || ""}
            onChange={handleChange}
            disabled={!canEdit || !editMode}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Empresa</label>
          <select
            name="empresa_id"
            className="form-input"
            value={form.empresa_id || ""}
            onChange={handleChange}
            disabled={!canEdit || !editMode}
          >
            <option value="">Seleccione</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.razon_social || e.nombre}</option>
            ))}
          </select>
        </div>
        {canEdit && editMode && (
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Motivo (auditoría)</label>
              <textarea
                name="motivo"
                className="form-input"
                rows={2}
                value={form.motivo || ""}
                onChange={handleChange}
                required
              />
            </div>
          )}
      </div>

      <div style={{ marginTop: 16 }}>
        <p><strong>RUT:</strong> {perfil.rut}</p>
        <p><strong>Estado:</strong> {perfil.estado}</p>
        <p><strong>Fecha de ingreso:</strong> {perfil.fecha_ingreso || "-"}</p>
        <p><strong>Empresa actual:</strong> {perfil.empresa_nombre || "-"}</p>
      </div>

      <h3 style={{ marginTop: 24 }}>Historial de marcaciones</h3>
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
