import React from "react";

const Sidebar = ({ view, setView, user }) => {
  const items = [
    {
      id: "asistencias",
      label: "Asistencias",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "licencias",
      label: "Licencias",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "vacaciones",
      label: "Vacaciones",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    ...(user?.role === "fiscalizador"
      ? [
          {
            id: "auditoria",
            label: "Auditoría",
            icon: (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  if (user?.role === "admin_rrhh" || user?.role === "asistente_rrhh") {
    items.push({
      id: "usuarios",
      label: "Usuarios",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    });
  }

  return (
    <>
      <aside className="sidebar" role="navigation" aria-label="Menú principal">
        <div className="sidebar-header">
          <svg className="sidebar-logo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="sidebar-title">Panel RRHH</h2>
        </div>
        <nav className="sidebar-nav">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className={`nav-btn ${view === it.id ? "active" : ""}`}
              aria-current={view === it.id ? "page" : undefined}
            >
              <span className="nav-icon">{it.icon}</span>
              <span className="nav-label">{it.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">Kivo Asistencia</div>
      </aside>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 16rem;
          height: 100vh;
          background: linear-gradient(135deg, #1f2937, #374151);
          color: white;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          font-family: 'Arial', sans-serif;
          z-index: 1000;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
        }
        .sidebar-logo {
          width: 2rem;
          height: 2rem;
          color: #3b82f6;
          margin-right: 0.75rem;
        }
        .sidebar-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          color: #d1d5db;
          text-align: left;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          font-size: 1rem;
        }
        .nav-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .nav-btn.active {
          background: #3b82f6;
          color: white;
        }
        .nav-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-icon svg {
          width: 100%;
          height: 100%;
        }
        .sidebar-footer {
          margin-top: auto;
          font-size: 0.75rem;
          opacity: 0.8;
          text-align: center;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
