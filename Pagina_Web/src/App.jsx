import React, { useState, useEffect } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Asistencias from "./pages/Asistencias";
import Licencias from "./pages/Licencias";
import Vacaciones from "./pages/Vacaciones";
import Reportes from "./pages/Reportes";
import Auditoria from "./pages/Auditoria";
import PerfilTrabajador from "./pages/PerfilTrabajador";
import CrearUsuario from "./pages/Crearusuario";

const API_URL = "http://192.168.1.50:8000/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("asistencias");
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [selectedTrabajadorId, setSelectedTrabajadorId] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("kivoUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedAccess = localStorage.getItem("accessToken");
    if (storedAccess) {
      // nothing else, just avoid flashing logout
    }
  }, []);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token || !user) return;
      try {
        const res = await fetch(`${API_URL}/empresas/asignadas/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setEmpresas(data);
        if (data.length > 0) {
          setEmpresaId((prev) => prev || data[0].id);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchEmpresas();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingLogin(true);
    try {
      const res = await fetch(`${API_URL}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, password }),
      });

      if (!res.ok) {
        setError("RUT o contrasena invalidos");
        setLoadingLogin(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);

      const displayUser = {
        name: data.user.nombre ? `${data.user.nombre} ${data.user.apellido || ""}`.trim() : data.user.rut,
        role: data.user.rol,
        access: data.access,
        refresh: data.refresh,
        empresas: data.user.empresas || [],
      };
      localStorage.setItem("kivoUser", JSON.stringify(displayUser));
      setUser(displayUser);
      if ((data.user.empresas || []).length > 0) {
        setEmpresaId(data.user.empresas[0].id);
        setEmpresas(data.user.empresas);
      }
    } catch (err) {
      setError("Error de conexion con el servidor");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("kivoUser");
    setUser(null);
    setView("asistencias");
    setSelectedTrabajadorId(null);
    setEmpresas([]);
    setEmpresaId(null);
  };

  const handleVerPerfil = (trabajadorId) => {
    setSelectedTrabajadorId(trabajadorId);
    setView("perfil");
  };

  const renderPage = () => {
    switch (view) {
      case "asistencias":
        return <Asistencias onVerPerfil={handleVerPerfil} empresaId={empresaId} />;
      case "licencias":
        return <Licencias user={user} empresaId={empresaId} />;
      case "vacaciones":
        return <Vacaciones user={user} empresaId={empresaId} />;
      case "reportes":
        return <Reportes />;
      case "auditoria":
        return <Auditoria user={user} empresaId={empresaId} empresas={empresas} />;
      case "usuarios":
        return (
          <CrearUsuario
            onVerPerfil={handleVerPerfil}
            empresaId={empresaId}
            empresas={empresas}
            user={user}
          />
        );
      case "perfil":
        return <PerfilTrabajador trabajadorId={selectedTrabajadorId} user={user} empresas={empresas} />;
      default:
        return <Asistencias onVerPerfil={handleVerPerfil} empresaId={empresaId} />;
    }
  };

  if (!user) {
    return (
      <>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <svg className="login-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="login-title">Iniciar Sesion</h2>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="rut" className="form-label">RUT</label>
                <input
                  id="rut"
                  className="form-input"
                  type="text"
                  placeholder="Ingresa tu RUT"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Contrasena</label>
                <input
                  id="password"
                  className="form-input"
                  type="password"
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="error-message">
                  <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              <button className="btn-login" type="submit" disabled={loadingLogin}>
                {loadingLogin ? (
                  <>
                    <svg className="loading-spinner" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dashoffset" dur="1s" values="31.416;0" repeatCount="indefinite" />
                      </circle>
                    </svg>
                    Ingresando...
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <style>{`
          .login-container { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: 'Arial', sans-serif; }
          .login-card { background-color: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1); width: 100%; max-width: 28rem; }
          .login-header { text-align: center; margin-bottom: 2rem; }
          .login-icon { width: 3rem; height: 3rem; color: #3b82f6; margin-bottom: 1rem; }
          .login-title { font-size: 1.875rem; font-weight: bold; color: #1f2937; margin: 0; }
          .form-group { margin-bottom: 1.5rem; }
          .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem; }
          .form-input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
          .form-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
          .error-message { display: flex; align-items: center; color: #dc2626; font-size: 0.875rem; margin-bottom: 1rem; padding: 0.5rem; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; }
          .error-icon { width: 1.25rem; height: 1.25rem; margin-right: 0.5rem; flex-shrink: 0; }
          .btn-login { width: 100%; display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; border-radius: 0.5rem; font-weight: 500; font-size: 1rem; cursor: pointer; transition: background 0.2s, transform 0.1s; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .btn-login:hover:not(:disabled) { background: linear-gradient(135deg, #2563eb, #1e40af); transform: translateY(-1px); }
          .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-icon, .loading-spinner { width: 1.25rem; height: 1.25rem; margin-right: 0.5rem; }
          .loading-spinner { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className="app-root">
        <Sidebar view={view} setView={setView} user={user} />
        <div className="main">
          <Header user={user} onLogout={handleLogout} empresas={empresas} empresaId={empresaId} onChangeEmpresa={setEmpresaId} />
          {renderPage()}
          <div className="footer">© 2025 Sistema de Asistencia - Resolucion Exenta N°38</div>
        </div>
      </div>

      <style>{`
        .app-root { display: flex; min-height: 100vh; font-family: 'Arial', sans-serif; }
        .main { flex: 1; margin-left: 16rem; display: flex; flex-direction: column; min-height: 100vh; }
        .footer { margin-top: auto; text-align: center; padding: 1rem; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 0.875rem; color: #6b7280; }
      `}</style>
    </>
  );
}
