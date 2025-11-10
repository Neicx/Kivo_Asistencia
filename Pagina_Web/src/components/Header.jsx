import React from "react";

export default function Header({ user, onLogout }) {
  return (
    <div className="header" role="banner">
      <h1>Gestión de Asistencia</h1>
      <div className="user">
        <div style={{textAlign:"right"}}>
          <div style={{fontWeight:600}}>{user.name}</div>
          <div style={{fontSize:12,color:"#6b7280"}}>{user.role}</div>
        </div>
        <button onClick={onLogout} className="btn btn-danger" style={{marginLeft:12}}>Cerrar sesión</button>
      </div>
    </div>
  );
}
