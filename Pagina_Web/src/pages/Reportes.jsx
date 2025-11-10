import React from "react";

export default function Reportes() {
  const handleExport = (type) => {
    alert(`Mock: exportando reporte en formato ${type}`);
  };

  return (
    <div className="card">
      <h2>Reportes y Exportaciones</h2>
      <p style={{color:"#6b7280"}}>Genera reportes en PDF o Excel para fiscalización.</p>
      <div style={{marginTop:12, display:"flex", gap:10}}>
        <button className="btn btn-primary" onClick={()=>handleExport("PDF")}>Exportar PDF</button>
        <button className="btn" onClick={()=>handleExport("Excel")}>Exportar Excel</button>
      </div>
    </div>
  );
}
