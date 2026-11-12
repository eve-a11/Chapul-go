import { useState, useEffect } from "react";
import {
  getRutas,
  createRuta,
  updateRutaEstatus,
  deleteRuta,
  extractRutaId,
  getRutaNombre,
  getRutaDistancia,
  getRutaTiempo,
  isRutaActiva,
  getParadas,
  createParada,
  deleteParada,
  extractParadaId,
  getTarifas,
  createTarifa,
  deleteTarifa,
  extractTarifaId,
  getTarifasRutas,
  asignarTarifaRuta,
  deleteTarifaRuta,
} from "../../services/rutasService";

const toSafeString = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") {
    if (val.type === "Buffer" && Array.isArray(val.data)) {
      return val.data[0] === 1 ? "Activo" : "Inactivo";
    }
    return fallback;
  }
  return String(val);
};

export default function RutasAdmin() {
  const [activeTab, setActiveTab] = useState("rutas");
  const [rutas, setRutas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [tarifasRutas, setTarifasRutas] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRutaFilter, setSelectedRutaFilter] = useState("todas");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Formulario Ruta (campos exactos del DTO)
  const [nombreRuta, setNombreRuta] = useState("");
  const [distancia, setDistancia] = useState("");
  const [tiempoEstimado, setTiempoEstimado] = useState("00:30:00");

  // Formulario Parada
  const [nombreParada, setNombreParada] = useState("");
  const [ubicacionParada, setUbicacionParada] = useState("");
  const [ordenParada, setOrdenParada] = useState("1");
  const [idRutaParada, setIdRutaParada] = useState("");

  // Formulario Tarifa y Asignación
  const [nombreTarifa, setNombreTarifa] = useState("");
  const [montoTarifa, setMontoTarifa] = useState("");
  const [relIdRuta, setRelIdRuta] = useState("");
  const [relIdTarifa, setRelIdTarifa] = useState("");

  const loadAll = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [rutasData, paradasData, tarifasData, relData] = await Promise.all([
        getRutas(),
        getParadas(),
        getTarifas(),
        getTarifasRutas(),
      ]);

      setRutas(rutasData);
      setParadas(paradasData);
      setTarifas(tarifasData);
      setTarifasRutas(relData);

      if (rutasData.length > 0) {
        const firstRutaId = String(extractRutaId(rutasData[0]));
        setIdRutaParada((prev) => prev || firstRutaId);
        setRelIdRuta((prev) => prev || firstRutaId);
      }
      if (tarifasData.length > 0) {
        const firstTarifaId = String(extractTarifaId(tarifasData[0]));
        setRelIdTarifa((prev) => prev || firstTarifaId);
      }
    } catch (error) {
      console.error("Error cargando módulo de rutas:", error);
      setErrorMsg(`Error al conectar con la API (${error.response?.status || "Red"})`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const formatApiError = (error, fallback) => {
    const raw = error.response?.data?.message || error.response?.data?.error;
    return Array.isArray(raw) ? raw.join(" • ") : raw || fallback;
  };

  const normalizeTiempoHHMMSS = (val) => {
    const clean = String(val || "").trim();
    if (/^\d{2}:\d{2}$/.test(clean)) return `${clean}:00`;
    if (/^\d{1}:\d{2}:\d{2}$/.test(clean)) return `0${clean}`;
    return clean;
  };

  // ==================== HANDLERS RUTAS ====================
  const handleCreateRuta = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanNombre = nombreRuta.trim();
    const numDistancia = Number(distancia);
    const cleanTiempo = normalizeTiempoHHMMSS(tiempoEstimado);

    if (cleanNombre.length < 3 || cleanNombre.length > 150) {
      setErrorMsg("El nombre de la ruta debe tener entre 3 y 150 caracteres.");
      return;
    }
    if (distancia === "" || isNaN(numDistancia) || numDistancia < 0) {
      setErrorMsg("Ingresa una distancia válida mayor o igual a 0 km.");
      return;
    }
    if (!/^\d{2}:\d{2}:\d{2}$/.test(cleanTiempo)) {
      setErrorMsg("El tiempo estimado debe tener el formato HH:MM:SS (ej. 00:45:00).");
      return;
    }

    setIsSaving(true);
    try {
      await createRuta({
        nombreRuta: cleanNombre,
        distancia: numDistancia,
        tiempoEstimado: cleanTiempo,
      });
      setSuccessMsg(`Ruta "${cleanNombre}" registrada correctamente.`);
      setNombreRuta("");
      setDistancia("");
      setTiempoEstimado("00:30:00");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo registrar la ruta."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRutaEstatus = async (r) => {
    setErrorMsg("");
    setSuccessMsg("");
    const activa = isRutaActiva(r);
    try {
      await updateRutaEstatus(r, !activa);
      setSuccessMsg(`Estatus de ruta actualizado a ${!activa ? "Activa" : "Inactiva"}.`);
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo cambiar el estatus de la ruta."));
    }
  };

  const handleDeleteRuta = async (r) => {
    const id = extractRutaId(r);
    const label = getRutaNombre(r) || `#${id}`;
    if (!window.confirm(`¿Eliminar la ruta ${label}?`)) return;

    try {
      await deleteRuta(id);
      setSuccessMsg(`Ruta ${label} eliminada.`);
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo eliminar la ruta."));
    }
  };

  // ==================== HANDLERS PARADAS ====================
  const handleCreateParada = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!nombreParada.trim()) {
      setErrorMsg("Escribe el nombre de la parada.");
      return;
    }

    setIsSaving(true);
    try {
      await createParada({
        nombre: nombreParada.trim(),
        ubicacion: ubicacionParada.trim(),
        orden: ordenParada,
        idRuta: idRutaParada,
      });
      setSuccessMsg(`Parada "${nombreParada.trim()}" agregada.`);
      setNombreParada("");
      setUbicacionParada("");
      setOrdenParada((prev) => String(Number(prev || 0) + 1));
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo registrar la parada."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParada = async (p) => {
    const id = extractParadaId(p);
    const label = toSafeString(p.Nombre ?? p.nombre, `#${id}`);
    if (!window.confirm(`¿Eliminar la parada ${label}?`)) return;

    try {
      await deleteParada(id);
      setSuccessMsg(`Parada ${label} eliminada.`);
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo eliminar la parada."));
    }
  };

  // ==================== HANDLERS TARIFAS ====================
  const handleCreateTarifa = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!nombreTarifa.trim() || !montoTarifa) {
      setErrorMsg("Ingresa el concepto y el monto de la tarifa.");
      return;
    }

    setIsSaving(true);
    try {
      await createTarifa({
        nombre: nombreTarifa.trim(),
        monto: montoTarifa,
      });
      setSuccessMsg(`Tarifa "${nombreTarifa.trim()}" creada.`);
      setNombreTarifa("");
      setMontoTarifa("");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo crear la tarifa."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAsignarTarifa = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!relIdRuta || !relIdTarifa) {
      setErrorMsg("Selecciona una ruta y una tarifa para vincular.");
      return;
    }

    setIsSaving(true);
    try {
      await asignarTarifaRuta({ idRuta: relIdRuta, idTarifa: relIdTarifa });
      setSuccessMsg("Tarifa vinculada a la ruta correctamente.");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo vincular la tarifa con la ruta."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTarifa = async (t) => {
    const id = extractTarifaId(t);
    if (!window.confirm("¿Eliminar esta tarifa?")) return;
    try {
      await deleteTarifa(id);
      setSuccessMsg("Tarifa eliminada.");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo eliminar la tarifa."));
    }
  };

  const handleDeleteRelacion = async (rel) => {
    const id = rel.idRTarifaRuta ?? rel.id_r_tarifa_ruta ?? rel.id;
    if (!window.confirm("¿Quitar tarifa de esta ruta?")) return;
    try {
      await deleteTarifaRuta(id);
      setSuccessMsg("Asignación eliminada.");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo eliminar la asignación."));
    }
  };

  const getRutaNameById = (id) => {
    const found = rutas.find((r) => String(extractRutaId(r)) === String(id));
    return found ? getRutaNombre(found) || `Ruta #${id}` : `Ruta #${id}`;
  };

  const getTarifaInfoById = (id) => {
    const found = tarifas.find((t) => String(extractTarifaId(t)) === String(id));
    if (!found) return `Tarifa #${id}`;
    const name = toSafeString(found.Tipo ?? found.tipo ?? found.Nombre ?? found.nombre, "Tarifa");
    const price = found.Monto ?? found.monto ?? found.Precio ?? found.precio ?? 0;
    return `${name} ($${Number(price).toFixed(2)})`;
  };

  const filteredRutas = rutas.filter((r) => {
    const q = searchTerm.toLowerCase();
    const text = `${getRutaNombre(r)} ${getRutaDistancia(r)} ${getRutaTiempo(r)}`.toLowerCase();
    return text.includes(q);
  });

  const filteredParadas = paradas.filter((p) => {
    const pRutaId = p.idRuta ?? p.id_Ruta ?? p.id_ruta ?? extractRutaId(p.ruta);
    if (selectedRutaFilter !== "todas" && String(pRutaId) !== String(selectedRutaFilter)) {
      return false;
    }
    const q = searchTerm.toLowerCase();
    return `${toSafeString(p.Nombre ?? p.nombre)} ${toSafeString(
      p.Ubicacion ?? p.ubicacion ?? p.direccion
    )}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Encabezado y Pestañas */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
            GESTIÓN DE RUTAS Y TARIFAS
          </h1>
          <p className="text-xs text-slate-500">
            Administración de recorridos, paradas intermedias y tarifas de pasaje
          </p>
        </div>

        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/70 self-start">
          {[
            { id: "rutas", label: `Rutas (${rutas.length})` },
            { id: "paradas", label: `Paradas (${paradas.length})` },
            { id: "tarifas", label: `Tarifas (${tarifas.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[#123254] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#123254]"
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* ==================== PESTAÑA 1: RUTAS ==================== */}
      {activeTab === "rutas" && (
        <>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#123254] mb-4">Registrar Nueva Ruta</h2>
            <form
              onSubmit={handleCreateRuta}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de Ruta *
                </label>
                <input
                  type="text"
                  minLength={3}
                  maxLength={150}
                  placeholder="Ej. Verdes - Chapulhuacán a El Rayo"
                  value={nombreRuta}
                  onChange={(e) => setNombreRuta(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Distancia (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej. 14.5"
                  value={distancia}
                  onChange={(e) => setDistancia(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiempo Estimado (HH:MM:SS) *
                </label>
                <input
                  type="text"
                  placeholder="00:45:00"
                  value={tiempoEstimado}
                  onChange={(e) => setTiempoEstimado(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full px-5 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Guardar Ruta"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#123254]">
                  Rutas Registradas ({filteredRutas.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Recorridos registrados con su distancia y tiempo aproximado
                </p>
              </div>
              <input
                type="text"
                placeholder="Buscar ruta por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-400">Cargando rutas...</div>
            ) : filteredRutas.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No hay rutas registradas todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">NOMBRE DE RUTA</th>
                      <th className="py-3 px-4">DISTANCIA</th>
                      <th className="py-3 px-4">TIEMPO ESTIMADO</th>
                      <th className="py-3 px-4">ESTATUS</th>
                      <th className="py-3 px-4 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRutas.map((r, idx) => {
                      const id = extractRutaId(r) ?? idx + 1;
                      const activa = isRutaActiva(r);
                      const dist = getRutaDistancia(r);
                      const tiempo = getRutaTiempo(r);

                      return (
                        <tr key={id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 text-slate-400 font-semibold">#{id}</td>
                          <td className="py-3.5 px-4 font-bold text-[#123254]">
                            {getRutaNombre(r) || "Sin nombre"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {Number(dist)} km
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono">
                            {toSafeString(tiempo, "00:00:00")}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleRutaEstatus(r)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                activa
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/20"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-600/20"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  activa ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {activa ? "Activa" : "Inactiva"}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRuta(r)}
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
            )}
          </div>
        </>
      )}

      {/* ==================== PESTAÑA 2: PARADAS ==================== */}
      {activeTab === "paradas" && (
        <>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#123254] mb-4">Agregar Parada a una Ruta</h2>
            <form
              onSubmit={handleCreateParada}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ruta Asignada *
                </label>
                <select
                  value={idRutaParada}
                  onChange={(e) => setIdRutaParada(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  {rutas.length === 0 && <option value="">Registra primero una ruta</option>}
                  {rutas.map((r) => {
                    const rid = extractRutaId(r);
                    return (
                      <option key={rid} value={rid}>
                        #{rid} - {getRutaNombre(r) || `Ruta #${rid}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Parada *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Crucero El Barrio"
                  value={nombreParada}
                  onChange={(e) => setNombreParada(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referencia / Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Frente a la plaza principal"
                  value={ubicacionParada}
                  onChange={(e) => setUbicacionParada(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSaving || rutas.length === 0}
                  className="w-full px-5 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Agregando..." : "Registrar Parada"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#123254]">
                Paradas Registradas ({filteredParadas.length})
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedRutaFilter}
                  onChange={(e) => setSelectedRutaFilter(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  <option value="todas">Todas las rutas</option>
                  {rutas.map((r) => {
                    const rid = extractRutaId(r);
                    return (
                      <option key={rid} value={rid}>
                        {getRutaNombre(r) || `Ruta #${rid}`}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  placeholder="Buscar parada..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-56 px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>
            </div>

            {filteredParadas.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No hay paradas registradas con este filtro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">PARADA</th>
                      <th className="py-3 px-4">UBICACIÓN / REFERENCIA</th>
                      <th className="py-3 px-4">RUTA</th>
                      <th className="py-3 px-4 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredParadas.map((p, idx) => {
                      const id = extractParadaId(p) ?? idx + 1;
                      const rId = p.idRuta ?? p.id_Ruta ?? p.id_ruta ?? extractRutaId(p.ruta);
                      return (
                        <tr key={id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 text-slate-400 font-semibold">#{id}</td>
                          <td className="py-3.5 px-4 font-bold text-[#123254]">
                            {toSafeString(p.Nombre ?? p.nombre)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {toSafeString(p.Ubicacion ?? p.ubicacion ?? p.direccion, "—")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {rId ? getRutaNameById(rId) : "General"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteParada(p)}
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
            )}
          </div>
        </>
      )}

      {/* ==================== PESTAÑA 3: TARIFAS ==================== */}
      {activeTab === "tarifas" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#123254] mb-4">1. Crear Nueva Tarifa</h2>
              <form onSubmit={handleCreateTarifa} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Concepto / Tipo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Pasaje General"
                      value={nombreTarifa}
                      onChange={(e) => setNombreTarifa(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monto ($ MXN) *
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      placeholder="Ej. 15.00"
                      value={montoTarifa}
                      onChange={(e) => setMontoTarifa(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  Guardar Tarifa
                </button>
              </form>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#123254] mb-4">
                2. Asignar Tarifa a una Ruta
              </h2>
              <form onSubmit={handleAsignarTarifa} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ruta *
                    </label>
                    <select
                      value={relIdRuta}
                      onChange={(e) => setRelIdRuta(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                    >
                      {rutas.map((r) => {
                        const rid = extractRutaId(r);
                        return (
                          <option key={rid} value={rid}>
                            #{rid} - {getRutaNombre(r) || `Ruta #${rid}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tarifa *
                    </label>
                    <select
                      value={relIdTarifa}
                      onChange={(e) => setRelIdTarifa(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                    >
                      {tarifas.map((t) => {
                        const tid = extractTarifaId(t);
                        const label = toSafeString(t.Tipo ?? t.tipo ?? t.Nombre ?? t.nombre);
                        const precio = t.Monto ?? t.monto ?? t.Precio ?? t.precio ?? 0;
                        return (
                          <option key={tid} value={tid}>
                            {label} - ${Number(precio).toFixed(2)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSaving || rutas.length === 0 || tarifas.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  Vincular Tarifa con Ruta
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#123254] mb-3">
                Catálogo de Tarifas ({tarifas.length})
              </h3>
              {tarifas.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Sin tarifas registradas.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-2 px-2">CONCEPTO</th>
                      <th className="py-2 px-2">MONTO</th>
                      <th className="py-2 px-2 text-right">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tarifas.map((t, idx) => {
                      const tid = extractTarifaId(t) ?? idx + 1;
                      const monto = t.Monto ?? t.monto ?? t.Precio ?? t.precio ?? 0;
                      return (
                        <tr key={tid}>
                          <td className="py-2.5 px-2 font-semibold text-[#123254]">
                            {toSafeString(t.Tipo ?? t.tipo ?? t.Nombre ?? t.nombre)}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-emerald-700">
                            ${Number(monto).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteTarifa(t)}
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
              )}
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#123254] mb-3">
                Tarifas Asignadas por Ruta ({tarifasRutas.length})
              </h3>
              {tarifasRutas.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Aún no hay tarifas vinculadas a rutas.
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-2 px-2">RUTA</th>
                      <th className="py-2 px-2">TARIFA</th>
                      <th className="py-2 px-2 text-right">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tarifasRutas.map((rel, idx) => {
                      const rId =
                        rel.idRuta ?? rel.id_Ruta ?? rel.id_ruta ?? extractRutaId(rel.ruta);
                      const tId =
                        rel.idTarifa ??
                        rel.id_Tarifa ??
                        rel.id_tarifa ??
                        extractTarifaId(rel.tarifa);
                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-2 font-semibold text-[#123254]">
                            {getRutaNameById(rId)}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600">
                            {getTarifaInfoById(tId)}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRelacion(rel)}
                              className="text-rose-600 font-semibold hover:underline"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}