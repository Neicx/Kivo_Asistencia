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

const API_URL = "http://192.168.56.1:8000/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("asistencias");
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [selectedTrabajadorId, setSelectedTrabajadorId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("kivoUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
        setError("RUT o contraseña inválidos");
        setLoadingLogin(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);

      const displayUser = {
        name: data.user.nombre ? `${data.user.nombre} ${data.user.apellido || ""}`.trim() : data.user.rut,
        role: data.user.rol,
      };

      localStorage.setItem("kivoUser", JSON.stringify(displayUser));
      setUser(displayUser);
      setRut("");
      setPassword("");
    } catch (err) {
      setError("Error de conexión con el servidor");
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
  };

  const handleVerPerfil = (trabajadorId) => {
    setSelectedTrabajadorId(trabajadorId);
    setView("perfil");
  };

  if (!user) {
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={handleLogin}>
          <h2>Iniciar sesión</h2>
          <input
            className="input"
            type="text"
            placeholder="RUT"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
              {error}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={loadingLogin}>
            {loadingLogin ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  const renderPage = () => {
    switch (view) {
      case "asistencias":
        return <Asistencias onVerPerfil={handleVerPerfil} />;
      case "licencias":
        return <Licencias />;
      case "vacaciones":
        return <Vacaciones />;
      case "reportes":
        return <Reportes />;
      case "auditoria":
        return <Auditoria />;
      case "perfil":
        return <PerfilTrabajador trabajadorId={selectedTrabajadorId} />;
      default:
        return <Asistencias onVerPerfil={handleVerPerfil} />;
    }
  };

  return (
    <div className="app-root">
      <Sidebar view={view} setView={setView} />
      <div className="main">
        <Header user={user} onLogout={handleLogout} />
        {renderPage()}
        <div className="footer">© 2025 Sistema de Asistencia — Resolución Exenta N°38</div>
      </div>
    </div>
  );
}
