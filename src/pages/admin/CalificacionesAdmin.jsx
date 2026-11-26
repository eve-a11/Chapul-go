// src/pages/admin/CalificacionesAdmin.jsx
import { useState, useEffect } from "react";
import {
  getAllReportesData,
  formatFechaLegible,
  exportToCSV,
} from "../../services/reportesService";

const getTodayYYYYMMDD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function CalificacionesAdmin() {
  const [calificaciones, setCalificaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFecha, setFilterFecha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadCalificaciones = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await getAllReportesData();
      setCalificaciones(data.calificaciones || []);
    } catch (error) {
      console.error("Error cargando calificaciones:", error);
      setErrorMsg("No se pudieron cargar las calificaciones desde la API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalificaciones();
  }, []);

  // Filtros
  const filteredCalificaciones = calificaciones.filter((c) => {
    if (filterFecha && c.resolvedFecha !== filterFecha) return false;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return `#${c.resolvedId} ${c.resolvedPasajero} ${c.resolvedHorario}`
      .toLowerCase()
      .includes(q);
  });

  // Promedios REDONDOS (sin decimales) para Ruta/Servicio y Choferes
  const promedioRutaServicio =
    filteredCalificaciones.length > 0
      ? Math.round(
          filteredCalificaciones.reduce((acc, c) => acc + Number(c.resolvedCalServicio || 0), 0) /
            filteredCalificaciones.length
        )
      : 0;

  const promedioChofer =
    filteredCalificaciones.length > 0
      ? Math.round(
          filteredCalificaciones.reduce((acc, c) => acc + Number(c.resolvedCalChofer || 0), 0) /
            filteredCalificaciones.length
        )
      : 0;

  const getStarDistribution = (field) => {
    const total = filteredCalificaciones.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = filteredCalificaciones.filter(
        (c) => Math.round(Number(c[field] || 0)) === star
      ).length;
      return {
        star,
        count,
        pct: filteredCalificaciones.length > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  };

  const handleExport = () => {
    const today = getTodayYYYYMMDD();
    exportToCSV(
      `reporte_calificaciones_${today}`,
      ["ID", "Pasajero", "Ruta / Corrida", "Cal. Ruta/Servicio (1-5)", "Cal. Chofer (1-5)", "Fecha"],
      filteredCalificaciones.map((c) => [
        c.resolvedId,
        c.resolvedPasajero,
        c.resolvedHorario,
        Math.round(Number(c.resolvedCalServicio || 0)),
        Math.round(Number(c.resolvedCalChofer || 0)),
        c.resolvedFecha || "—",
      ])
    );
  };

  const renderStars = (score) => {
    const full = Math.round(Number(score || 0));
    return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="pb-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
            CALIFICACIÓN DE RUTA Y CHOFERES
          </h1>
          <p className="text-xs text-slate-500">
            Evaluación general de la ruta/servicio y desempeño de conducción de choferes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
          >
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#123254] text-xs font-semibold shadow-sm transition"
          >
            Imprimir
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg("")} className="font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas Resumen (Números redondos enteros) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">
            Calificación de la Ruta / Servicio
          </p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">
            {promedioRutaServicio} <span className="text-sm text-slate-400">/ 5 ★</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Basado en {filteredCalificaciones.length} evaluaciones
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">
            Calificación de Choferes
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {promedioChofer} <span className="text-sm text-slate-400">/ 5 ★</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Evaluación de conducción y trato
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">
            Total de Evaluaciones
          </p>
          <p className="text-2xl font-extrabold text-[#123254] mt-1">
            {filteredCalificaciones.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Reseñas registradas en sistema
          </p>
        </div>
      </div>

      {/* Desglose visual de estrellas (Ruta vs Chofer) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          {
            title: "Distribución Calificación de la Ruta / Servicio",
            data: getStarDistribution("resolvedCalServicio"),
            barColor: "bg-amber-400",
          },
          {
            title: "Distribución Desempeño de Choferes",
            data: getStarDistribution("resolvedCalChofer"),
            barColor: "bg-emerald-500",
          },
        ].map((block) => (
          <div
            key={block.title}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm"
          >
            <h3 className="text-xs font-bold text-[#123254] uppercase mb-3">
              {block.title}
            </h3>
            <div className="space-y-2">
              {block.data.map((row) => (
                <div key={row.star} className="flex items-center gap-3 text-xs">
                  <span className="w-10 font-bold text-slate-600">{row.star} ★</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${block.barColor} rounded-full transition-all`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-[11px] text-slate-500 font-semibold">
                    {row.count} ({row.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla principal de calificaciones */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#123254]">
              Calificaciones de Ruta y Chofer ({filteredCalificaciones.length})
            </h2>
            <p className="text-[11px] text-slate-400">
              Filtra por fecha exacta o busca por pasajero o ruta
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
            <input
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
            />

            <input
              type="text"
              placeholder="Buscar pasajero o ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-52 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
            />

            {(filterFecha || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setFilterFecha("");
                  setSearchTerm("");
                }}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-[#123254] hover:bg-white rounded-lg transition"
              >
                Limpiar
              </button>
            )}

            <button
              type="button"
              onClick={loadCalificaciones}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#123254] transition"
            >
              Actualizar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Consultando calificaciones desde la API...
          </div>
        ) : filteredCalificaciones.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No hay calificaciones registradas con este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">PASAJERO</th>
                  <th className="py-3 px-4">RUTA / CORRIDA</th>
                  <th className="py-3 px-4">CAL. RUTA / SERVICIO</th>
                  <th className="py-3 px-4">CAL. CHOFER</th>
                  <th className="py-3 px-4">FECHA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCalificaciones.map((c) => {
                  const notaRuta = Math.round(Number(c.resolvedCalServicio || 0));
                  const notaChofer = Math.round(Number(c.resolvedCalChofer || 0));
                  return (
                    <tr key={c.resolvedId} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 text-slate-400 font-semibold">
                        #{c.resolvedId}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#123254]">
                        {c.resolvedPasajero}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.resolvedHorario}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-amber-500 font-bold">
                          {renderStars(notaRuta)}
                        </span>{" "}
                        <span className="text-slate-600 font-bold">
                          ({notaRuta}/5)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-600 font-bold">
                          {renderStars(notaChofer)}
                        </span>{" "}
                        <span className="text-slate-600 font-bold">
                          ({notaChofer}/5)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatFechaLegible(c.resolvedFecha)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}