import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/templates/AdminLayout";
import { getDashboardSummary } from "../../services/dashboardService";
import { getAllReportesData } from "../../services/reportesService";
import { getStoredUser } from "../../utils/authSession";
import VehiculosAdmin from "./VehiculosAdmin";
import EmpleadosAdmin from "./EmpleadosAdmin";
import RutasAdmin from "./RutasAdmin";
import HorariosAdmin from "./HorariosAdmin";
import ObjetosPerdidosAdmin from "./ObjetosPerdidosAdmin";
import CalificacionesAdmin from "./CalificacionesAdmin";
import ReportesAdmin from "./ReportesAdmin";

function ProgressRow({ label, percentage, detail, gradientClass = "from-[#0d2544] to-[#2563eb]" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs sm:text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">{detail}</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-xs text-[#123254]">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${gradientClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ExecutiveKpiCard({ title, value, subtitle, accentColor, iconBg, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Franja de acento superior */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${accentColor}`} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black text-[#0d2544] tracking-tight">
            {value}
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>{subtitle}</span>
        {onClick && (
          <span className="text-[#123254] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir →
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { section } = useParams();
  const navigate = useNavigate();

  const activeMenu = section || "dashboard";
  const storedUser = getStoredUser() || {};
  const adminFirstName =
    storedUser.nombre ||
    storedUser.Nombre ||
    (storedUser.email ? storedUser.email.split("@")[0] : "Administrador");

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("--:--");
  const [summary, setSummary] = useState({
    rutasActivas: 0,
    vehiculosTotal: 0,
    vehiculosServicio: 0,
    objetosTotal: 0,
    objetosPendientes: 0,
    objetosEntregados: 0,
    calificacionPromedio: "0 / 5",
    calificacionChoferPromedio: 0,
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
        const [data, repData] = await Promise.all([
          getDashboardSummary(),
          getAllReportesData().catch(() => ({ calificaciones: [] })),
        ]);

        const listaCalif = repData?.calificaciones || [];
        const totalOp = listaCalif.length || data.totalOpiniones || 0;

        const promRuta =
          listaCalif.length > 0
            ? Math.round(
                listaCalif.reduce(
                  (acc, c) => acc + Number(c.resolvedCalServicio || 0),
                  0
                ) / listaCalif.length
              )
            : Math.round(Number(data.calificacionPromedio || 0));

        const promChofer =
          listaCalif.length > 0
            ? Math.round(
                listaCalif.reduce(
                  (acc, c) => acc + Number(c.resolvedCalChofer || 0),
                  0
                ) / listaCalif.length
              )
            : 0;

        setSummary({
          ...data,
          calificacionPromedio: `${promRuta} / 5`,
          calificacionChoferPromedio: promChofer,
          totalOpiniones: totalOp,
          alertas: {
            ...data.alertas,
            comentariosRecibidos: totalOp,
          },
        });

        const now = new Date();
        setLastUpdated(
          `${String(now.getHours()).padStart(2, "0")}:${String(
            now.getMinutes()
          ).padStart(2, "0")}`
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
      ) : activeMenu === "calificaciones" || activeMenu === "calif-servicio" ? (
        <CalificacionesAdmin />
      ) : activeMenu === "reportes" ? (
        <ReportesAdmin />
      ) : activeMenu !== "dashboard" ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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
            className="px-4 py-2 rounded-xl bg-[#123254] text-white text-xs font-semibold hover:bg-[#1a4573] transition"
          >
            ← Volver al Panel de control
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Hero Banner Ejecutivo */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d2544] via-[#123254] to-[#1b497c] p-6 text-white shadow-lg shadow-[#0d2544]/15">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-sky-400/10 blur-xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-amber-300 mb-2">
                  <span>CENTRO DE CONTROL OPERATIVO</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Bienvenido, {adminFirstName}
                </h1>
                <p className="mt-1 text-xs text-slate-300">
                  {isLoading
                    ? "Sincronizando métricas en tiempo real con el servidor..."
                    : "Monitoreo integral de flota, rutas, personal y atención a pasajeros."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => goToSection("rutas")}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0d2544] text-xs font-extrabold shadow-sm transition"
                >
                  + Gestionar Rutas
                </button>
                <button
                  type="button"
                  onClick={() => goToSection("vehiculos")}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-sm transition"
                >
                  + Registrar Unidad
                </button>
                <button
                  type="button"
                  onClick={() => goToSection("empleados")}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-sm transition"
                >
                  + Nuevo Empleado
                </button>
              </div>
            </div>
          </div>

          {/* Fila 1: 4 Tarjetas KPI Ejecutivas */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ExecutiveKpiCard
              title="Rutas activas"
              value={String(summary.rutasActivas).padStart(2, "0")}
              subtitle={
                summary.rutasActivas > 0
                  ? "Rutas registradas en sistema"
                  : "Sin rutas registradas aún"
              }
              accentColor="from-[#0d2544] to-[#2563eb]"
              iconBg="bg-[#E8F1FA] text-[#123254]"
              onClick={() => goToSection("rutas")}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />

            <ExecutiveKpiCard
              title="Vehículos en servicio"
              value={String(summary.vehiculosServicio).padStart(2, "0")}
              subtitle={`De ${summary.vehiculosTotal} unidades registradas`}
              accentColor="from-emerald-500 to-teal-500"
              iconBg="bg-emerald-50 text-emerald-600"
              onClick={() => goToSection("vehiculos")}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-6 4h4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <ExecutiveKpiCard
              title="Objetos pendientes"
              value={String(summary.objetosPendientes).padStart(2, "0")}
              subtitle={`De ${summary.objetosTotal} reportes totales`}
              accentColor="from-amber-400 to-orange-500"
              iconBg="bg-amber-50 text-amber-600"
              onClick={() => goToSection("objetos-perdidos")}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <ExecutiveKpiCard
              title="Satisfacción servicio"
              value={summary.calificacionPromedio}
              subtitle={
                summary.totalOpiniones > 0
                  ? `Choferes: ${summary.calificacionChoferPromedio}/5 • ${summary.totalOpiniones} reseñas`
                  : "Sin calificaciones aún"
              }
              accentColor="from-sky-500 to-indigo-500"
              iconBg="bg-sky-50 text-sky-600"
              onClick={() => goToSection("calificaciones")}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
          </section>

          {/* Fila 2: Indicadores Operativos + Alertas */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-[#123254]">
                    Indicadores Operativos
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Porcentajes calculados según registros actuales
                  </p>
                </div>
                <span className="text-[11px] bg-slate-100 border border-slate-200/70 text-slate-600 px-2.5 py-1 rounded-lg font-semibold">
                  Actualizado: {lastUpdated}
                </span>
              </div>

              <div className="space-y-4">
                <ProgressRow
                  label="Disponibilidad de rutas"
                  detail={`${summary.rutasActivas} registradas`}
                  percentage={summary.indicadores.pctRutasOperando}
                  gradientClass="from-[#0d2544] to-[#2563eb]"
                />
                <ProgressRow
                  label="Flota vehicular activa"
                  detail={`${summary.vehiculosServicio} / ${summary.vehiculosTotal} unidades`}
                  percentage={summary.indicadores.pctFlotaActiva}
                  gradientClass="from-emerald-500 to-teal-500"
                />
                <ProgressRow
                  label="Objetos perdidos entregados"
                  detail={`${summary.objetosEntregados} / ${summary.objetosTotal} reportes`}
                  percentage={summary.indicadores.pctReportesResueltos}
                  gradientClass="from-amber-400 to-orange-500"
                />
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-[#123254]">
                  Alertas y Pendientes
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En vivo
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-2 hover:bg-amber-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      !
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {summary.alertas.reportesRevision} reportes en revisión
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Objetos extraviados sin entregar
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToSection("objetos-perdidos")}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-bold text-[#123254] hover:bg-[#123254] hover:text-white transition shrink-0"
                  >
                    Ver →
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-between gap-2 hover:bg-rose-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      !
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {summary.alertas.combisMantenimiento} unidades en mantenimiento
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Chequeo preventivo en taller
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToSection("vehiculos")}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-xs font-bold text-[#123254] hover:bg-[#123254] hover:text-white transition shrink-0"
                  >
                    Ver →
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-2 hover:bg-emerald-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {summary.alertas.comentariosRecibidos} opiniones registradas
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Evaluaciones de ruta y choferes
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToSection("calificaciones")}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-bold text-[#123254] hover:bg-[#123254] hover:text-white transition shrink-0"
                  >
                    Ver →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Fila 3: Tablas operativas */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-[#123254]">
                    Estado de Flota Vehicular
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Unidades registradas en /vehiculos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToSection("vehiculos")}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-[#123254] text-[#123254] hover:text-white text-xs font-bold transition"
                >
                  Gestionar →
                </button>
              </div>

              {summary.recentUnits.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-500 mb-2">
                    Aún no hay vehículos registrados en la base de datos.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToSection("vehiculos")}
                    className="px-3.5 py-2 rounded-xl bg-[#123254] text-white text-xs font-semibold hover:bg-[#1a4573] transition"
                  >
                    + Registrar primer vehículo
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Unidad</th>
                        <th className="py-2.5 px-3">Placa</th>
                        <th className="py-2.5 px-3">Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {summary.recentUnits.map((unit) => {
                        const isMaint = String(unit.estado)
                          .toLowerCase()
                          .includes("mantenimiento");
                        return (
                          <tr key={unit.id} className="hover:bg-slate-50/90 transition">
                            <td className="py-2.5 px-3 font-bold text-[#123254]">
                              {unit.unidad}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {unit.placa || unit.capacidad}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
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

            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-[#123254]">
                    Objetos Perdidos Recientes
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Reportes registrados en /cosas-per
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToSection("objetos-perdidos")}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-[#123254] text-[#123254] hover:text-white text-xs font-bold transition"
                >
                  Gestionar →
                </button>
              </div>

              {summary.recentObjects.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-500 mb-2">
                    No hay objetos perdidos reportados todavía.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToSection("objetos-perdidos")}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-[#123254] text-xs font-semibold hover:bg-slate-100 transition"
                  >
                    + Registrar reporte
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {summary.recentObjects.map((obj) => {
                    const isDone = String(obj.estado).toLowerCase() === "entregado";
                    return (
                      <div
                        key={obj.id}
                        className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/70 hover:bg-white hover:shadow-sm flex items-center justify-between gap-2 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {obj.descripcion}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {obj.lugar}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            isDone
                              ? "bg-slate-200 text-slate-700"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
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
      )}
    </AdminLayout>
  );
}