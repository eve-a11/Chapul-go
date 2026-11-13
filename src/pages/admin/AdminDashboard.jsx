import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/templates/AdminLayout";
import StatCard from "../../components/molecules/StatCard";
import { getDashboardSummary } from "../../services/dashboardService";
import VehiculosAdmin from "./VehiculosAdmin";
import EmpleadosAdmin from "./EmpleadosAdmin";
import RutasAdmin from "./RutasAdmin";
import HorariosAdmin from "./HorariosAdmin";
import ObjetosPerdidosAdmin from "./ObjetosPerdidosAdmin";
import ReportesAdmin from "./ReportesAdmin";

function ProgressRow({ label, percentage, detail, colorClass = "bg-[#123254]" }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs sm:text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">{detail}</span>
          <span className="font-bold text-[#123254]">{percentage}%</span>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { section } = useParams();
  const navigate = useNavigate();

  // Si no hay subruta (/admin), el módulo activo es "dashboard"
  const activeMenu = section || "dashboard";

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("--:--");
  const [summary, setSummary] = useState({
    rutasActivas: 0,
    vehiculosTotal: 0,
    vehiculosServicio: 0,
    objetosTotal: 0,
    objetosPendientes: 0,
    objetosEntregados: 0,
    calificacionPromedio: "0.0",
    totalOpiniones: 0,
    indicadores: {
      pctRutasOperando: 0,
      pctFlotaActiva: 0,
      pctReportesResueltos: 0,
    },
    alertas: {
      reportesRevision: 0,
      combisMantenimiento: 0,
      comentariosRecibidos: 0,
    },
    recentUnits: [],
    recentObjects: [],
  });

  // Navega cambiando la URL (SIN replace) para que la flecha "Atrás" regrese a /admin
  const goToSection = (target) => {
    const id = typeof target === "string" ? target : target?.id;
    if (!id || id === "dashboard") {
      navigate("/admin");
    } else {
      navigate(`/admin/${id}`);
    }
  };

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardSummary();
        setSummary(data);
        const now = new Date();
        setLastUpdated(
          `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        );
      } catch (error) {
        console.error("Error al cargar datos reales del panel:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeMenu === "dashboard") {
      loadSummary();
    }
  }, [activeMenu]);

  return (
    <AdminLayout activeItem={activeMenu} onSelectMenu={goToSection}>
      {activeMenu === "vehiculos" ? (
        <VehiculosAdmin />
      ) : activeMenu === "empleados" || activeMenu === "choferes" ? (
        <EmpleadosAdmin />
      ) : activeMenu === "rutas" ? (
        <RutasAdmin />
      ) : activeMenu === "horarios" ? (
        <HorariosAdmin />
      ) : activeMenu === "objetos" ||
        activeMenu === "objetos-perdidos" ||
        activeMenu === "cosas-per" ||
        activeMenu === "perdidos" ? (
        <ObjetosPerdidosAdmin />
      ) : activeMenu === "reportes" ? (
        <ReportesAdmin />
      ) : activeMenu !== "dashboard" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E8F1FA] text-[#123254] text-xs font-semibold uppercase mb-2">
            Módulo listo para conectar
          </span>
          <h2 className="text-lg font-bold text-[#123254] capitalize mb-1.5">
            Administración de {activeMenu}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            Aquí construiremos el formulario de registro y la tabla conectada a la API.
          </p>
          <button
            type="button"
            onClick={() => goToSection("dashboard")}
            className="px-4 py-2 rounded-lg bg-[#123254] text-white text-xs font-semibold hover:bg-[#1a4573] transition"
          >
            ← Volver al Panel de control
          </button>
        </div>
      ) : (
        <>
          {/* Encabezado y Acciones Rápidas */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
                PANEL DE CONTROL
              </h1>
              <p className="text-xs text-slate-500">
                {isLoading
                  ? "Sincronizando datos con el servidor..."
                  : "Resumen operativo en tiempo real desde la base de datos"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => goToSection("rutas")}
                className="px-3 py-1.5 rounded-lg bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition"
              >
                + Gestionar Rutas
              </button>
              <button
                type="button"
                onClick={() => goToSection("vehiculos")}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#123254] border border-slate-200 text-xs font-semibold transition"
              >
                + Registrar Unidad
              </button>
              <button
                type="button"
                onClick={() => goToSection("empleados")}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#123254] border border-slate-200 text-xs font-semibold transition"
              >
                + Nuevo Empleado
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Fila 1: 4 Tarjetas KPI */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Rutas activas"
                value={summary.rutasActivas}
                subtitle={
                  summary.rutasActivas > 0
                    ? "Rutas registradas en sistema"
                    : "Sin rutas registradas aún"
                }
                variant="navy"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                }
              />

              <StatCard
                title="Vehículos en servicio"
                value={summary.vehiculosServicio}
                subtitle={`De ${summary.vehiculosTotal} unidades registradas`}
                variant="emerald"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-6 4h4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <StatCard
                title="Objetos pendientes"
                value={summary.objetosPendientes}
                subtitle={`De ${summary.objetosTotal} reportes totales`}
                variant="amber"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <StatCard
                title="Satisfacción servicio"
                value={summary.calificacionPromedio}
                subtitle={
                  summary.totalOpiniones > 0
                    ? `Basado en ${summary.totalOpiniones} evaluaciones`
                    : "Sin calificaciones aún"
                }
                variant="blue"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                }
              />
            </section>

            {/* Fila 2: Indicadores reales + Alertas */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#123254]">
                      Indicadores Operativos
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Porcentajes calculados según registros actuales
                    </p>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    Actualizado: {lastUpdated}
                  </span>
                </div>

                <div className="space-y-3">
                  <ProgressRow
                    label="Disponibilidad de rutas"
                    detail={`${summary.rutasActivas} registradas`}
                    percentage={summary.indicadores.pctRutasOperando}
                    colorClass="bg-[#123254]"
                  />
                  <ProgressRow
                    label="Flota vehicular activa"
                    detail={`${summary.vehiculosServicio} / ${summary.vehiculosTotal} unidades`}
                    percentage={summary.indicadores.pctFlotaActiva}
                    colorClass="bg-emerald-600"
                  />
                  <ProgressRow
                    label="Objetos perdidos entregados"
                    detail={`${summary.objetosEntregados} / ${summary.objetosTotal} reportes`}
                    percentage={summary.indicadores.pctReportesResueltos}
                    colorClass="bg-amber-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-[#123254]">
                    Alertas y Pendientes
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    En vivo
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        !
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {summary.alertas.reportesRevision} reportes en revisión
                        </p>
                        <p className="text-[11px] text-slate-500">Objetos extraviados sin entregar</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToSection("objetos")}
                      className="text-xs font-semibold text-[#123254] hover:underline shrink-0"
                    >
                      Ver →
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        !
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {summary.alertas.combisMantenimiento} unidades en mantenimiento
                        </p>
                        <p className="text-[11px] text-slate-500">Chequeo preventivo en taller</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToSection("vehiculos")}
                      className="text-xs font-semibold text-[#123254] hover:underline shrink-0"
                    >
                      Ver →
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        ✓
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {summary.alertas.comentariosRecibidos} opiniones registradas
                        </p>
                        <p className="text-[11px] text-slate-500">Evaluaciones del servicio</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToSection("reportes")}
                      className="text-xs font-semibold text-[#123254] hover:underline shrink-0"
                    >
                      Ver →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Fila 3: Tablas reales */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h2 className="text-sm font-bold text-[#123254]">
                      Estado de Flota Vehicular
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Unidades registradas en /vehiculos
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToSection("vehiculos")}
                    className="text-xs font-semibold text-[#123254] hover:underline"
                  >
                    Gestionar →
                  </button>
                </div>

                {summary.recentUnits.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <p className="text-xs text-slate-500 mb-2">
                      Aún no hay vehículos registrados en la base de datos.
                    </p>
                    <button
                      type="button"
                      onClick={() => goToSection("vehiculos")}
                      className="px-3 py-1.5 rounded-lg bg-[#123254] text-white text-xs font-semibold hover:bg-[#1a4573] transition"
                    >
                      + Registrar primer vehículo
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-400">
                          <th className="py-2 px-2.5">Unidad</th>
                          <th className="py-2 px-2.5">Placa</th>
                          <th className="py-2 px-2.5">Estatus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {summary.recentUnits.map((unit) => {
                          const isMaint = String(unit.estado)
                            .toLowerCase()
                            .includes("mantenimiento");
                          return (
                            <tr key={unit.id} className="hover:bg-slate-50 transition">
                              <td className="py-2 px-2.5 font-medium text-slate-800">
                                {unit.unidad}
                              </td>
                              <td className="py-2 px-2.5 text-slate-500">
                                {unit.placa || unit.capacidad}
                              </td>
                              <td className="py-2 px-2.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    isMaint
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {unit.estado}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h2 className="text-sm font-bold text-[#123254]">
                      Objetos Perdidos Recientes
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Reportes registrados en /cosas-per
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToSection("objetos")}
                    className="text-xs font-semibold text-[#123254] hover:underline"
                  >
                    Gestionar →
                  </button>
                </div>

                {summary.recentObjects.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <p className="text-xs text-slate-500 mb-2">
                      No hay objetos perdidos reportados todavía.
                    </p>
                    <button
                      type="button"
                      onClick={() => goToSection("objetos")}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[#123254] text-xs font-semibold hover:bg-slate-100 transition"
                    >
                      + Registrar reporte
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summary.recentObjects.map((obj) => {
                      const isDone = String(obj.estado).toLowerCase() === "entregado";
                      return (
                        <div
                          key={obj.id}
                          className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {obj.descripcion}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{obj.lugar}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                              isDone
                                ? "bg-slate-200 text-slate-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {obj.estado}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </AdminLayout>
  );
}