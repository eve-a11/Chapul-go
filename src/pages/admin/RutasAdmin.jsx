import { useState, useEffect } from "react";
import {
  getRutas,
  createRuta,
  deleteRuta,
  getParadas,
  createParada,
  deleteParada,
  getTarifas,
  createTarifa,
  deleteTarifa,
  getTarifaRutas,
  assignTarifaRuta,
  removeTarifaRuta,
} from "../../services/rutasService";

export default function RutasAdmin() {
  const [activeTab, setActiveTab] = useState("paradas");
  const [rutas, setRutas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [tarifaRutas, setTarifaRutas] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filtros de Paradas
  const [filterRutaId, setFilterRutaId] = useState("");
  const [searchParada, setSearchParada] = useState("");

  // Formulario Rutas
  const [nombreRuta, setNombreRuta] = useState("");
  const [distanciaRuta, setDistanciaRuta] = useState("");
  const [tiempoRuta, setTiempoRuta] = useState("00:35:00");

  // Formulario Paradas (campos exactos de tabla PARADAS: idRuta, nombre, valor)
  const [paradaRutaId, setParadaRutaId] = useState("");
  const [paradaNombre, setParadaNombre] = useState("");
  const [paradaValor, setParadaValor] = useState("1");

  // Formulario Tarifas
  const [tarifaNombre, setTarifaNombre] = useState("");
  const [tarifaCosto, setTarifaCosto] = useState("");
  const [tarifaDescripcion, setTarifaDescripcion] = useState("");
  const [asignarTarifaId, setAsignarTarifaId] = useState("");
  const [asignarRutaId, setAsignarRutaId] = useState("");

  const loadAll = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [rutasData, paradasData, tarifasData, rtrData] = await Promise.all([
        getRutas(),
        getParadas(),
        getTarifas(),
        getTarifaRutas(),
      ]);

      setRutas(rutasData);
      setParadas(paradasData);
      setTarifas(tarifasData);
      setTarifaRutas(rtrData);

      if (rutasData.length > 0) {
        const firstId = String(rutasData[0].resolvedId);
        setParadaRutaId((prev) => prev || firstId);
        setAsignarRutaId((prev) => prev || firstId);
      }
      if (tarifasData.length > 0) {
        setAsignarTarifaId((prev) => prev || String(tarifasData[0].resolvedId));
      }
    } catch (error) {
      console.error("Error cargando rutas y tarifas:", error);
      setErrorMsg("No se pudieron cargar los datos de rutas desde la API.");
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

  // ==================== HANDLERS RUTAS ====================
  const handleCreateRuta = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!nombreRuta.trim() || !distanciaRuta) {
      setErrorMsg("Completa el nombre y la distancia de la ruta.");
      return;
    }

    setIsSaving(true);
    try {
      await createRuta({
        nombreRuta,
        distancia: distanciaRuta,
        tiempoEstimado: tiempoRuta,
      });
      setSuccessMsg(`Ruta "${nombreRuta.trim()}" registrada correctamente.`);
      setNombreRuta("");
      setDistanciaRuta("");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo registrar la ruta."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRuta = async (r) => {
    if (!window.confirm(`¿Eliminar la ruta "${r.resolvedNombre}"?`)) return;
    try {
      await deleteRuta(r.resolvedId);
      setSuccessMsg("Ruta eliminada.");
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

    if (!paradaRutaId || !paradaNombre.trim()) {
      setErrorMsg("Selecciona una ruta e ingresa el nombre de la parada.");
      return;
    }

    const valorNum = parseInt(paradaValor, 10);
    if (!Number.isInteger(valorNum) || valorNum < 1) {
      setErrorMsg("El orden (valor) de la parada debe ser un número entero mayor a 0.");
      return;
    }

    setIsSaving(true);
    try {
      await createParada({
        nombre: paradaNombre,
        valor: valorNum,
        idRuta: paradaRutaId,
      });
      setSuccessMsg(`Parada "${paradaNombre.trim()}" registrada correctamente.`);
      setParadaNombre("");
      setParadaValor(String(valorNum + 1));
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo registrar la parada."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParada = async (p) => {
    if (!window.confirm(`¿Eliminar la parada "${p.resolvedNombre}"?`)) return;
    try {
      await deleteParada(p.resolvedId);
      setSuccessMsg("Parada eliminada.");
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

    if (!tarifaNombre.trim() || !tarifaCosto) {
      setErrorMsg("Ingresa el nombre y el costo de la tarifa.");
      return;
    }

    setIsSaving(true);
    try {
      await createTarifa({
        nombre: tarifaNombre,
        costo: tarifaCosto,
        descripcion: tarifaDescripcion,
      });
      setSuccessMsg(`Tarifa "${tarifaNombre.trim()}" creada correctamente.`);
      setTarifaNombre("");
      setTarifaCosto("");
      setTarifaDescripcion("");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo crear la tarifa."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignTarifa = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!asignarTarifaId || !asignarRutaId) return;

    setIsSaving(true);
    try {
      await assignTarifaRuta({
        idTarifa: asignarTarifaId,
        idRuta: asignarRutaId,
      });
      setSuccessMsg("Tarifa vinculada a la ruta.");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo vincular la tarifa a la ruta."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTarifa = async (t) => {
    if (!window.confirm(`¿Eliminar la tarifa "${t.resolvedNombre}"?`)) return;
    try {
      await deleteTarifa(t.resolvedId);
      setSuccessMsg("Tarifa eliminada.");
      await loadAll();
    } catch (error) {
      setErrorMsg(formatApiError(error, "No se pudo eliminar la tarifa."));
    }
  };

  const getRutaNameById = (id) => {
    const found = rutas.find((r) => String(r.resolvedId) === String(id));
    return found ? found.resolvedNombre : id ? `Ruta #${id}` : "Sin ruta";
  };

  const getTarifaNameById = (id) => {
    const found = tarifas.find((t) => String(t.resolvedId) === String(id));
    return found
      ? `${found.resolvedNombre} ($${found.resolvedCosto.toFixed(2)})`
      : `Tarifa #${id}`;
  };

  const filteredParadas = paradas
    .filter((p) => {
      if (filterRutaId && String(p.resolvedIdRuta) !== String(filterRutaId)) {
        return false;
      }
      const q = searchParada.toLowerCase().trim();
      if (!q) return true;
      return `${p.resolvedNombre} ${getRutaNameById(p.resolvedIdRuta)}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.resolvedValor - b.resolvedValor);

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

        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/70">
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
                setErrorMsg("");
                setSuccessMsg("");
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
            <h2 className="text-sm font-bold text-[#123254] mb-4">
              Registrar Nueva Ruta
            </h2>
            <form
              onSubmit={handleCreateRuta}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Ruta *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Chapulhuacán - Pisaflores"
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
                  min="0.1"
                  placeholder="Ej. 18.5"
                  value={distanciaRuta}
                  onChange={(e) => setDistanciaRuta(e.target.value)}
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
                  value={tiempoRuta}
                  onChange={(e) => setTiempoRuta(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full px-5 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Registrar Ruta"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#123254]">
                Rutas Registradas ({rutas.length})
              </h2>
            </div>
            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-400">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">NOMBRE DE RUTA</th>
                      <th className="py-3 px-4">DISTANCIA</th>
                      <th className="py-3 px-4">TIEMPO ESTIMADO</th>
                      <th className="py-3 px-4 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {rutas.map((r) => (
                      <tr key={r.resolvedId} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 text-slate-400 font-semibold">
                          #{r.resolvedId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#123254]">
                          {r.resolvedNombre}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {r.resolvedDistancia} km
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {r.resolvedTiempo}
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
                    ))}
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
            <h2 className="text-sm font-bold text-[#123254] mb-4">
              Agregar Parada a una Ruta
            </h2>
            <form
              onSubmit={handleCreateParada}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ruta Asignada *
                </label>
                <select
                  value={paradaRutaId}
                  onChange={(e) => setParadaRutaId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  {rutas.map((r) => (
                    <option key={r.resolvedId} value={r.resolvedId}>
                      #{r.resolvedId} - {r.resolvedNombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Parada *
                </label>
                <input
                  type="text"
                  placeholder="Ej. El texocote"
                  value={paradaNombre}
                  onChange={(e) => setParadaNombre(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Orden / Valor en Ruta (Entero) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="127"
                  step="1"
                  placeholder="Ej. 1"
                  value={paradaValor}
                  onChange={(e) => setParadaValor(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full px-5 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Registrando..." : "Registrar Parada"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#123254]">
                Paradas Registradas ({filteredParadas.length})
              </h2>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <select
                  value={filterRutaId}
                  onChange={(e) => setFilterRutaId(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  <option value="">Todas las rutas</option>
                  {rutas.map((r) => (
                    <option key={r.resolvedId} value={r.resolvedId}>
                      {r.resolvedNombre}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Buscar parada..."
                  value={searchParada}
                  onChange={(e) => setSearchParada(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-400">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">PARADA</th>
                      <th className="py-3 px-4">ORDEN (VALOR)</th>
                      <th className="py-3 px-4">RUTA</th>
                      <th className="py-3 px-4 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredParadas.map((p) => (
                      <tr key={p.resolvedId} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 text-slate-400 font-semibold">
                          #{p.resolvedId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#123254]">
                          {p.resolvedNombre}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[11px]">
                            Parada #{p.resolvedValor}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {getRutaNameById(p.resolvedIdRuta)}
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== PESTAÑA 3: TARIFAS ==================== */}
      {activeTab === "tarifas" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#123254] mb-4">
                Registrar Nueva Tarifa
              </h2>
              <form onSubmit={handleCreateTarifa} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre de Tarifa *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Pasaje General"
                      value={tarifaNombre}
                      onChange={(e) => setTarifaNombre(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Costo ($ MXN) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      placeholder="Ej. 15.00"
                      value={tarifaCosto}
                      onChange={(e) => setTarifaCosto(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tarifa estándar adulto"
                      value={tarifaDescripcion}
                      onChange={(e) => setTarifaDescripcion(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold"
                  >
                    Guardar Tarifa
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#123254] mb-4">
                Asignar Tarifa a una Ruta
              </h2>
              <form onSubmit={handleAssignTarifa} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tarifa *
                  </label>
                  <select
                    value={asignarTarifaId}
                    onChange={(e) => setAsignarTarifaId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    {tarifas.map((t) => (
                      <option key={t.resolvedId} value={t.resolvedId}>
                        {t.resolvedNombre} (${t.resolvedCosto.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ruta *
                    </label>
                    <select
                      value={asignarRutaId}
                      onChange={(e) => setAsignarRutaId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                    >
                      {rutas.map((r) => (
                        <option key={r.resolvedId} value={r.resolvedId}>
                          {r.resolvedNombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                  >
                    Vincular
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#123254]">
                Tarifas y Rutas Vinculadas
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">NOMBRE</th>
                    <th className="py-3 px-4">COSTO</th>
                    <th className="py-3 px-4">DESCRIPCIÓN</th>
                    <th className="py-3 px-4 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {tarifas.map((t) => (
                    <tr key={t.resolvedId} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 text-slate-400">#{t.resolvedId}</td>
                      <td className="py-3.5 px-4 font-bold text-[#123254]">
                        {t.resolvedNombre}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                        ${t.resolvedCosto.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {t.resolvedDescripcion}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTarifa(t)}
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

            {tarifaRutas.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
                {tarifaRutas.map((tr) => (
                  <span
                    key={tr.resolvedId}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700"
                  >
                    {getRutaNameById(tr.resolvedIdRuta)} →{" "}
                    {getTarifaNameById(tr.resolvedIdTarifa)}
                    <button
                      type="button"
                      onClick={() => removeTarifaRuta(tr.resolvedId).then(loadAll)}
                      className="text-rose-600 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}