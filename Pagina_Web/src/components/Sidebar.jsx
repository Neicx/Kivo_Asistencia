import React from "react";

const Sidebar = ({ view, setView }) => {
  const items = [
    { id: "asistencias", label: "Asistencias", icon: "🕒" },
    { id: "licencias", label: "Licencias", icon: "📋" },
    { id: "vacaciones", label: "Vacaciones", icon: "🌴" },
    { id: "reportes", label: "Reportes", icon: "📑" },
    { id: "auditoria", label: "Auditoría", icon: "🔍" },
  ];

  return (
    <aside className="sidebar" role="navigation" aria-label="Menú principal">
      <h2>Panel RRHH</h2>
      <nav>
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setView(it.id)}
            className={`nav-btn ${view === it.id ? "active" : ""}`}
            aria-current={view === it.id ? "page" : undefined}
          >
            <span style={{fontSize:18}}>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div style={{marginTop:"auto", fontSize:12, opacity:0.9}}>Versión mock • Multiplataforma</div>
    </aside>
  );
};

export default Sidebar;
