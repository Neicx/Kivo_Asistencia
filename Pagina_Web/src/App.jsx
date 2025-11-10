import React, { useState } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Asistencias from "./pages/Asistencias";
import Licencias from "./pages/Licencias";
import Vacaciones from "./pages/Vacaciones";
import Reportes from "./pages/Reportes";
import Auditoria from "./pages/Auditoria";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("asistencias");

  const handleLogin = (e) => {
    e.preventDefault();
    // mock login
    setUser({ name: "Admin RRHH", role: "Administrador" });
  };

  if (!user) {
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={handleLogin}>
          <h2>Iniciar sesión</h2>
          <input className="input" type="email" placeholder="Correo" required />
          <input className="input" type="password" placeholder="Contraseña" required />
          <button className="btn btn-primary" type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  const renderPage = () => {
    switch (view) {
      case "asistencias": return <Asistencias />;
      case "licencias": return <Licencias />;
      case "vacaciones": return <Vacaciones />;
      case "reportes": return <Reportes />;
      case "auditoria": return <Auditoria />;
      default: return <Asistencias />;
    }
  };

  return (
    <div className="app-root">
      <Sidebar view={view} setView={setView} />
      <div className="main">
        <Header user={user} onLogout={() => setUser(null)} />
        {renderPage()}
        <div className="footer">© 2025 Sistema de Asistencia — Resolución Exenta N°38</div>
      </div>
    </div>
  );
}
