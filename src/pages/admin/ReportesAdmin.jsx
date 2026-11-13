import { useState, useEffect } from "react";
import {
  getAllReportesData,
  createSueldo,
  deleteSueldo,
  createPago,
  updatePagoEstado,
  deletePago,
  formatFechaLegible,
  formatCurrency,
  exportToCSV,
} from "../../services/reportesService";

const getTodayYYYYMMDD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function ReportesAdmin() {
  const [activeTab, setActiveTab] = useState("pagos");
  const [pagos, setPagos] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [chequeos, setChequeos] = useState([]);
  const [sueldos, setSueldos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFecha, setFilterFecha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Formularios desplegables en Pagos y Sueldos
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagoUserId, setPagoUserId] = useState("");
  const [pagoSueldoId, setPagoSueldoId] = useState("");
  const [pagoDescripcion, setPagoDescripcion] = useState("");
  const [pagoMetodo, setPagoMetodo] = useState("Transferencia Bancaria");
  const [pagoFecha, setPagoFecha] = useState(getTodayYYYYMMDD());
  const [pagoEstado, setPagoEstado] = useState("Pagado");

  const [sueldoNombre, setSueldoNombre] = useState("");
  const [sueldoTipo, setSueldoTipo] = useState("Semanal");
  const [sueldoMonto, setSueldoMonto] = useState("");
  const [sueldoDescripcion, setSueldoDescripcion] = useState("");

  const loadReports = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await getAllReportesData();
      setPagos(data.pagos);
      setCalificaciones(data.calificaciones);
      setChequeos(data.chequeos);
      setSueldos(data.sueldos);
      setUsuarios(data.usuarios);

      if (data.usuarios.length > 0) {
        setPagoUserId((prev) => prev || data.usuarios[0].idUser);
      }
      if (data.sueldos.length > 0) {
        setPagoSueldoId((prev) => prev || String(data.sueldos[0].resolvedId));
      }
    } catch (error) {
      console.error("Error cargando reportes:", error);
      setErrorMsg("No se pudieron cargar los reportes desde la API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // ==================== HANDLERS DE PAGOS Y SUELDOS ====================
  const handleCreatePago = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!pagoUserId || !pagoSueldoId) {
      setErrorMsg("Selecciona un empleado y un tabulador de sueldo.");
      return;
    }

    const tabulador = sueldos.find(
      (s) => String(s.resolvedId) === String(pagoSueldoId)
    );
    const descFinal =
      pagoDescripcion.trim() ||
      `Pago ${tabulador?.resolvedNombre || "de nómina"}`;

    setIsSaving(true);
    try {
      await createPago({
        descripcion: descFinal,
        estado: pagoEstado,
        fechaPago: pagoFecha,
        metodoPago: pagoMetodo,
        idUser: pagoUserId,
        idSueldo: pagoSueldoId,
      });
      setSuccessMsg("Pago de nómina registrado correctamente.");
      setPagoDescripcion("");
      setShowPagoForm(false);
      await loadReports();
    } catch (error) {
      const raw = error.response?.data?.message || error.response?.data?.error;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo registrar el pago."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePagoEstado = async (p) => {
    const nuevo = p.resolvedEstado === "Pagado" ? "Pendiente" : "Pagado";
    try {
      await updatePagoEstado(p.resolvedId, nuevo);
      setSuccessMsg(`Estado del pago #${p.resolvedId} actualizado a ${nuevo}.`);
      await loadReports();
    } catch {
      setErrorMsg("No se pudo actualizar el estado del pago.");
    }
  };

  const handleDeletePago = async (p) => {
    if (!window.confirm(`¿Eliminar el registro de pago #${p.resolvedId}?`)) return;
    try {
      await deletePago(p.resolvedId);
      setSuccessMsg(`Pago #${p.resolvedId} eliminado.`);
      await loadReports();
    } catch {
      setErrorMsg("No se pudo eliminar el pago.");
    }
  };

  const handleCreateSueldo = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!sueldoNombre.trim() || !sueldoMonto || Number(sueldoMonto) <= 0) {
      setErrorMsg("Ingresa el nombre del tabulador y un monto válido mayor a 0.");
      return;
    }

    setIsSaving(true);
    try {
      await createSueldo({
        nombre: sueldoNombre.trim(),
        tipoSueldo: sueldoTipo,
        monto: Number(sueldoMonto),
        descripcion: sueldoDescripcion.trim() || `${sueldoNombre.trim()} (${sueldoTipo})`,
      });
      setSuccessMsg(`Tabulador "${sueldoNombre.trim()}" creado.`);
      setSueldoNombre("");
      setSueldoMonto("");
      setSueldoDescripcion("");
      await loadReports();
    } catch (error) {
      const raw = error.response?.data?.message || error.response?.data?.error;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo crear el tabulador."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSueldo = async (s) => {
    if (!window.confirm(`¿Eliminar el tabulador "${s.resolvedNombre}"?`)) return;
    try {
      await deleteSueldo(s.resolvedId);
      setSuccessMsg("Tabulador eliminado.");
      await loadReports();
    } catch {
      setErrorMsg("No se pudo eliminar el tabulador (puede estar asociado a un pago).");
    }
  };

  // ==================== FILTROS ====================
  const matchesFilters = (fecha, searchableText) => {
    if (filterFecha && fecha !== filterFecha) return false;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return searchableText.toLowerCase().includes(q);
  };

  const filteredPagos = pagos.filter((p) =>
    matchesFilters(
      p.resolvedFecha,
      `#${p.resolvedId} ${p.resolvedEmpleado} ${p.resolvedTabulador} ${p.resolvedDescripcion} ${p.resolvedMetodo} ${p.resolvedEstado}`
    )
  );

  const filteredCalificaciones = calificaciones.filter((c) =>
    matchesFilters(
      c.resolvedFecha,
      `#${c.resolvedId} ${c.resolvedPasajero} ${c.resolvedHorario}`
    )
  );

  const filteredChequeos = chequeos.filter((ch) =>
    matchesFilters(
      ch.resolvedFecha,
      `#${ch.resolvedId} ${ch.resolvedParada} ${ch.resolvedChofer} ${ch.resolvedHorario}`
    )
  );

  const filteredSueldos = sueldos.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return `#${s.resolvedId} ${s.resolvedNombre} ${s.resolvedDescripcion} ${s.resolvedTipo}`
      .toLowerCase()
      .includes(q);
  });

  // ==================== MÉTRICAS Y ANALÍTICA ====================
  const totalPagosNomina = filteredPagos.reduce((acc, p) => acc + p.resolvedMonto, 0);
  const pagosLiquidados = filteredPagos.filter(
    (p) => p.resolvedEstado.toLowerCase() === "pagado"
  ).length;

  const promedioServicio =
    filteredCalificaciones.length > 0
      ? (
          filteredCalificaciones.reduce((acc, c) => acc + c.resolvedCalServicio, 0) /
          filteredCalificaciones.length
        ).toFixed(1)
      : "0.0";

  const promedioChofer =
    filteredCalificaciones.length > 0
      ? (
          filteredCalificaciones.reduce((acc, c) => acc + c.resolvedCalChofer, 0) /
          filteredCalificaciones.length
        ).toFixed(1)
      : "0.0";

  const getStarDistribution = (field) => {
    const total = filteredCalificaciones.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = filteredCalificaciones.filter(
        (c) => Math.round(c[field]) === star
      ).length;
      return {
        star,
        count,
        pct: filteredCalificaciones.length > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  };

  // ==================== EXPORTACIÓN CSV ====================
  const handleExport = () => {
    const today = getTodayYYYYMMDD();

    if (activeTab === "pagos") {
      exportToCSV(
        `reporte_nomina_${today}`,
        ["ID", "Empleado", "Tabulador", "Concepto", "Monto", "Método", "Fecha", "Estado"],
        filteredPagos.map((p) => [
          p.resolvedId,
          p.resolvedEmpleado,
          p.resolvedTabulador,
          p.resolvedDescripcion,
          p.resolvedMonto.toFixed(2),
          p.resolvedMetodo,
          p.resolvedFecha || "—",
          p.resolvedEstado,
        ])
      );
    } else if (activeTab === "calificaciones") {
      exportToCSV(
        `reporte_calificaciones_${today}`,
        ["ID", "Pasajero", "Corrida", "Cal. Servicio (1-5)", "Cal. Chofer (1-5)", "Fecha"],
        filteredCalificaciones.map((c) => [
          c.resolvedId,
          c.resolvedPasajero,
          c.resolvedHorario,
          c.resolvedCalServicio,
          c.resolvedCalChofer,
          c.resolvedFecha || "—",
        ])
      );
    } else if (activeTab === "chequeos") {
      exportToCSV(
        `reporte_chequeo_vuelta_${today}`,
        ["ID", "Parada", "Operador", "Horario", "Fecha", "Hora Registro"],
        filteredChequeos.map((ch) => [
          ch.resolvedId,
          ch.resolvedParada,
          ch.resolvedChofer,
          ch.resolvedHorario,
          ch.resolvedFecha || "—",
          ch.resolvedHora,
        ])
      );
    } else if (activeTab === "sueldos") {
      exportToCSV(
        `tabulador_sueldos_${today}`,
        ["ID", "Nombre", "Tipo de Sueldo", "Monto", "Descripción"],
        filteredSueldos.map((s) => [
          s.resolvedId,
          s.resolvedNombre,
          s.resolvedTipo,
          s.resolvedMonto.toFixed(2),
          s.resolvedDescripcion,
        ])
      );
    }
  };

  const renderStars = (score) => {
    const full = Math.round(score);
    return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
  };

  return (
    <div className="space-y-5">
      {/* Encabezado y Pestañas */}
      <div className="pb-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
            REPORTES OPERATIVOS Y NÓMINA
          </h1>
          <p className="text-xs text-slate-500">
            Control de nómina, satisfacción del servicio, chequeos de vuelta y tabuladores
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            {[
              { id: "pagos", label: `Pagos (${pagos.length})` },
              { id: "calificaciones", label: `Calificaciones (${calificaciones.length})` },
              { id: "chequeos", label: `Chequeo Vuelta (${chequeos.length})` },
              { id: "sueldos", label: `Sueldos (${sueldos.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#123254] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#123254]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

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

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg("")} className="font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Nómina Filtrada</p>
          <p className="text-xl font-extrabold text-[#123254] mt-1">
            {formatCurrency(totalPagosNomina)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {pagosLiquidados} de {filteredPagos.length} pago(s) liquidado(s)
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Calificación Servicio</p>
          <p className="text-xl font-extrabold text-amber-500 mt-1">
            {promedioServicio} <span className="text-sm text-slate-400">/ 5.0</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Basado en {filteredCalificaciones.length} reseñas
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Calificación Choferes</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            {promedioChofer} <span className="text-sm text-slate-400">/ 5.0</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Evaluación de conducción</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Chequeos de Vuelta</p>
          <p className="text-xl font-extrabold text-[#123254] mt-1">
            {filteredChequeos.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Registros de paso en parada</p>
        </div>
      </div>

      {/* ==================== DESGLOSE VISUAL EN PESTAÑA CALIFICACIONES ==================== */}
      {activeTab === "calificaciones" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              title: "Distribución Calificación del Servicio",
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
      )}

      {/* ==================== FORMULARIO DE ALTA EN PESTAÑA SUELDOS ==================== */}
      {activeTab === "sueldos" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#123254] mb-4">
            Registrar Nuevo Tabulador de Sueldo
          </h2>
          <form
            onSubmit={handleCreateSueldo}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Puesto / Tabulador *
              </label>
              <input
                type="text"
                placeholder="Ej. Chofer Ruta Larga"
                value={sueldoNombre}
                onChange={(e) => setSueldoNombre(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Sueldo *
              </label>
              <select
                value={sueldoTipo}
                onChange={(e) => setSueldoTipo(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
              >
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
                <option value="Por Vuelta">Por Vuelta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto ($ MXN) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="Ej. 2800.00"
                value={sueldoMonto}
                onChange={(e) => setSueldoMonto(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                placeholder="Ej. Incluye bono de puntualidad"
                value={sueldoDescripcion}
                onChange={(e) => setSueldoDescripcion(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full px-5 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar Tabulador"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== FORMULARIO DESPLEGABLE DE PAGO DE NÓMINA ==================== */}
      {activeTab === "pagos" && showPagoForm && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#123254]">
              Registrar Pago de Nómina a Empleado
            </h2>
            <button
              type="button"
              onClick={() => setShowPagoForm(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Cerrar ✕
            </button>
          </div>

          <form onSubmit={handleCreatePago} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Empleado *
                </label>
                <select
                  value={pagoUserId}
                  onChange={(e) => setPagoUserId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  {usuarios.length === 0 && <option value="">Sin usuarios</option>}
                  {usuarios.map((u) => (
                    <option key={u.idUser} value={u.idUser}>
                      #{u.idUser} — {u.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tabulador de Sueldo *
                </label>
                <select
                  value={pagoSueldoId}
                  onChange={(e) => setPagoSueldoId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  {sueldos.length === 0 && (
                    <option value="">Crea primero un tabulador en Sueldos</option>
                  )}
                  {sueldos.map((s) => (
                    <option key={s.resolvedId} value={s.resolvedId}>
                      {s.resolvedNombre} ({formatCurrency(s.resolvedMonto)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de Pago *
                </label>
                <select
                  value={pagoMetodo}
                  onChange={(e) => setPagoMetodo(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Depósito">Depósito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Pago *
                </label>
                <input
                  type="date"
                  value={pagoFecha}
                  onChange={(e) => setPagoFecha(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concepto / Observación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pago semana 45 - Ruta Chapulhuacán"
                  value={pagoDescripcion}
                  onChange={(e) => setPagoDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  value={pagoEstado}
                  onChange={(e) => setPagoEstado(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSaving || sueldos.length === 0}
                  className="w-full px-5 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Registrando..." : "Guardar Pago"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ==================== TABLA PRINCIPAL ==================== */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#123254]">
              {activeTab === "pagos" && `Historial de Pagos a Personal (${filteredPagos.length})`}
              {activeTab === "calificaciones" &&
                `Calificaciones de Servicio y Chofer (${filteredCalificaciones.length})`}
              {activeTab === "chequeos" &&
                `Bitácora de Chequeo de Vuelta (${filteredChequeos.length})`}
              {activeTab === "sueldos" &&
                `Catálogo de Tabuladores (${filteredSueldos.length})`}
            </h2>
            <p className="text-[11px] text-slate-400">
              Filtra por fecha exacta o busca por empleado, parada o concepto
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
            {activeTab === "pagos" && !showPagoForm && (
              <button
                type="button"
                onClick={() => setShowPagoForm(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold transition"
              >
                + Registrar Pago
              </button>
            )}

            {activeTab !== "sueldos" && (
              <input
                type="date"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            )}

            <input
              type="text"
              placeholder="Buscar en el reporte..."
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
              onClick={loadReports}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#123254] transition"
            >
              Actualizar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Consultando registros desde la API...
          </div>
        ) : (
          <>
            {/* TAB 1: PAGOS */}
            {activeTab === "pagos" &&
              (filteredPagos.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No hay registros de pagos con este filtro.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">EMPLEADO</th>
                        <th className="py-3 px-4">TABULADOR / CONCEPTO</th>
                        <th className="py-3 px-4">MONTO</th>
                        <th className="py-3 px-4">MÉTODO</th>
                        <th className="py-3 px-4">FECHA PAGO</th>
                        <th className="py-3 px-4">ESTADO</th>
                        <th className="py-3 px-4 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredPagos.map((p) => {
                        const isPagado =
                          p.resolvedEstado.toLowerCase() === "pagado";
                        return (
                          <tr key={p.resolvedId} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 text-slate-400 font-semibold">
                              #{p.resolvedId}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#123254]">
                              {p.resolvedEmpleado}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-700">
                                {p.resolvedTabulador}
                              </p>
                              {p.resolvedDescripcion !== p.resolvedTabulador && (
                                <p className="text-[11px] text-slate-400">
                                  {p.resolvedDescripcion}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                              {formatCurrency(p.resolvedMonto)}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {p.resolvedMetodo}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {formatFechaLegible(p.resolvedFecha)}
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleTogglePagoEstado(p)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                  isPagado
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                }`}
                              >
                                {p.resolvedEstado}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeletePago(p)}
                                className="text-rose-600 font-semibold hover:underline"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* TAB 2: CALIFICACIONES */}
            {activeTab === "calificaciones" &&
              (filteredCalificaciones.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No hay calificaciones registradas todavía.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">PASAJERO</th>
                        <th className="py-3 px-4">CORRIDA / HORARIO</th>
                        <th className="py-3 px-4">CAL. SERVICIO</th>
                        <th className="py-3 px-4">CAL. CHOFER</th>
                        <th className="py-3 px-4">FECHA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCalificaciones.map((c) => (
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
                              {renderStars(c.resolvedCalServicio)}
                            </span>{" "}
                            <span className="text-slate-500 font-semibold">
                              ({c.resolvedCalServicio}/5)
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-emerald-600 font-bold">
                              {renderStars(c.resolvedCalChofer)}
                            </span>{" "}
                            <span className="text-slate-500 font-semibold">
                              ({c.resolvedCalChofer}/5)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {formatFechaLegible(c.resolvedFecha)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* TAB 3: CHEQUEO DE VUELTA */}
            {activeTab === "chequeos" &&
              (filteredChequeos.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No hay registros de chequeo de vuelta con este filtro.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">PARADA</th>
                        <th className="py-3 px-4">OPERADOR / CHOFER</th>
                        <th className="py-3 px-4">HORARIO ASIGNADO</th>
                        <th className="py-3 px-4">FECHA</th>
                        <th className="py-3 px-4">HORA DE CHEQUEO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredChequeos.map((ch) => (
                        <tr key={ch.resolvedId} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 text-slate-400 font-semibold">
                            #{ch.resolvedId}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#123254]">
                            {ch.resolvedParada}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {ch.resolvedChofer}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {ch.resolvedHorario}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {formatFechaLegible(ch.resolvedFecha)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-sky-700">
                            {ch.resolvedHora}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* TAB 4: SUELDOS */}
            {activeTab === "sueldos" &&
              (filteredSueldos.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No hay tabuladores de sueldo registrados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">NOMBRE TABULADOR</th>
                        <th className="py-3 px-4">TIPO DE SUELDO</th>
                        <th className="py-3 px-4">MONTO</th>
                        <th className="py-3 px-4">DESCRIPCIÓN</th>
                        <th className="py-3 px-4 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSueldos.map((s) => (
                        <tr key={s.resolvedId} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 text-slate-400 font-semibold">
                            #{s.resolvedId}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#123254]">
                            {s.resolvedNombre}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {s.resolvedTipo}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                            {formatCurrency(s.resolvedMonto)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {s.resolvedDescripcion}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSueldo(s)}
                              className="text-rose-600 font-semibold hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}