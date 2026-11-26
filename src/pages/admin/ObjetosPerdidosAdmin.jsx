import { useState, useEffect } from "react";
import {
  getCosasPerdidas,
  updateSeguimientoCosa,
  deleteCosaPerdida,
  formatFechaLegible,
} from "../../services/cosasPerService";

const ESTADO_CONFIG = {
  pendiente: {
    label: "Pendiente",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  seguimiento: {
    label: "En seguimiento",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    dot: "bg-sky-500",
  },
  entregado: {
    label: "Entregado",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
};

export default function ObjetosPerdidosAdmin() {
  const [cosas, setCosas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal de Seguimiento
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalEstado, setModalEstado] = useState("pendiente");
  const [modalNota, setModalNota] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await getCosasPerdidas();
      setCosas(data);
    } catch (error) {
      console.error("Error al cargar objetos perdidos:", error);
      setErrorMsg(`Error al conectar con /cosas-per (${error.response?.status || "Red"})`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSeguimientoModal = (item) => {
    setSelectedItem(item);
    setModalEstado(item.resolvedEstado || "pendiente");
    setModalNota(item.resolvedNota || "");
  };

  const handleSaveSeguimiento = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await updateSeguimientoCosa(selectedItem.resolvedId, {
        estado: modalEstado,
        nota: modalNota,
      });
      setSuccessMsg(`Seguimiento del reporte #${selectedItem.resolvedId} actualizado.`);
      setSelectedItem(null);
      await loadData();
    } catch (error) {
      const raw = error.response?.data?.message;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo actualizar el seguimiento."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.resolvedId;
    if (!window.confirm(`¿Eliminar definitivamente el reporte #${id}?`)) return;

    try {
      await deleteCosaPerdida(id);
      setSuccessMsg(`Reporte #${id} eliminado.`);
      await loadData();
    } catch (error) {
      const raw = error.response?.data?.message;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo eliminar el reporte."
      );
    }
  };

  const totalPendientes = cosas.filter((c) => c.resolvedEstado === "pendiente").length;
  const totalSeguimiento = cosas.filter((c) => c.resolvedEstado === "seguimiento").length;
  const totalEntregados = cosas.filter((c) => c.resolvedEstado === "entregado").length;

  const filteredCosas = cosas.filter((c) => {
    if (statusFilter !== "todos" && c.resolvedEstado !== statusFilter) return false;

    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    const searchable = `#${c.resolvedId} ${c.resolvedDescripcion} ${c.resolvedUserNombre} ${
      c.resolvedFecha
    } ${c.resolvedHoraSalida} ${c.resolvedNota}`.toLowerCase();

    return searchable.includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Encabezado y Contadores */}
      <div className="pb-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
            OBJETOS PERDIDOS
          </h1>
          <p className="text-xs text-slate-500">
            Visualización y seguimiento de reportes enviados por los pasajeros desde el portal público
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-bold">
            Pendientes: {totalPendientes}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/70 text-xs font-bold">
            En seguimiento: {totalSeguimiento}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-bold">
            Entregados: {totalEntregados}
          </span>
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

      {/* Tabla de Visualización y Seguimiento */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#123254]">
              Reportes Recibidos ({filteredCosas.length})
            </h2>
            <p className="text-[11px] text-slate-400">
              Solo lectura de reportes ciudadanos • Usa &ldquo;Seguimiento&rdquo; para actualizar el estado de entrega
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
            >
              <option value="todos">Todos ({cosas.length})</option>
              <option value="pendiente">Pendientes ({totalPendientes})</option>
              <option value="seguimiento">En seguimiento ({totalSeguimiento})</option>
              <option value="entregado">Entregados ({totalEntregados})</option>
            </select>

            <input
              type="text"
              placeholder="Buscar objeto, pasajero o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
            />

            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#123254] transition"
            >
              Actualizar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Cargando reportes desde la base de datos...
          </div>
        ) : filteredCosas.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No hay reportes de objetos perdidos con este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">OBJETO REPORTADO</th>
                  <th className="py-3 px-4">PASAJERO</th>
                  <th className="py-3 px-4">HORARIO / FECHA</th>
                  <th className="py-3 px-4">ESTATUS</th>
                  <th className="py-3 px-4">NOTA DE SEGUIMIENTO</th>
                  <th className="py-3 px-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCosas.map((c, idx) => {
                  const id = c.resolvedId ?? idx + 1;
                  const est = ESTADO_CONFIG[c.resolvedEstado] || ESTADO_CONFIG.pendiente;

                  return (
                    <tr key={id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 text-slate-400 font-semibold">#{id}</td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-[#123254]">{c.resolvedDescripcion}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{c.resolvedUserNombre}</p>
                        {c.resolvedUserId && (
                          <p className="text-[11px] text-slate-400">
                            ID Usuario #{c.resolvedUserId}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="font-semibold text-slate-700">
                          {formatFechaLegible(c.resolvedFecha)}
                        </p>
                        {(c.resolvedHoraSalida || c.resolvedHoraLlegada) && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            Corrida #{c.resolvedHorarioId} ({c.resolvedHoraSalida} →{" "}
                            {c.resolvedHoraLlegada})
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${est.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                          {est.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {c.resolvedNota ? (
                          <div>
                            <p className="text-slate-700 text-[11px]">{c.resolvedNota}</p>
                            {c.resolvedUpdatedAt && (
                              <p className="text-[10px] text-slate-400">
                                Act. {c.resolvedUpdatedAt}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Sin observaciones
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openSeguimientoModal(c)}
                          className="px-3 py-1 rounded-lg bg-[#123254] hover:bg-[#1a4573] text-white text-[11px] font-semibold transition"
                        >
                          Seguimiento
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
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

      {/* Modal de Seguimiento Administrativo */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#123254]">
                  Seguimiento de Reporte #{selectedItem.resolvedId}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pasajero: <span className="font-semibold">{selectedItem.resolvedUserNombre}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                Descripción reportada
              </p>
              <p className="font-medium">{selectedItem.resolvedDescripcion}</p>
            </div>

            <form onSubmit={handleSaveSeguimiento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado del Objeto *
                </label>
                <select
                  value={modalEstado}
                  onChange={(e) => setModalEstado(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  <option value="pendiente">Pendiente (Por localizar)</option>
                  <option value="seguimiento">En seguimiento (Resguardado / Contactando)</option>
                  <option value="entregado">Entregado al propietario</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones de Seguimiento
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Localizado en unidad, resguardado en base Chapulhuacán en espera de entrega..."
                  value={modalNota}
                  onChange={(e) => setModalNota(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isUpdating ? "Guardando..." : "Guardar Seguimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}