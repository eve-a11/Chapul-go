import { useState, useEffect } from "react";
import {
  getHorarios,
  createHorario,
  deleteHorario,
  saveHorarioMeta,
  formatFechaLegible,
} from "../../services/horariosService";
import { getRutas, extractRutaId, getRutaNombre } from "../../services/rutasService";
import API from "../../services/api";

const extractVehiculoId = (v) =>
  v?.idVehiculo ?? v?.id_Vehiculo ?? v?.id_vehiculo ?? v?.idvehiculo ?? v?.id;

const isVehiculoActivo = (v) => {
  const id = extractVehiculoId(v);
  const raw = v?.Estatus ?? v?.estatus ?? v?.estado;
  if (raw === null || raw === undefined) {
    try {
      const cache = JSON.parse(localStorage.getItem("chapulgo_vehiculos_estatus") || "{}");
      if (id !== undefined && id !== null && String(id) in cache) {
        return cache[String(id)];
      }
    } catch {
      // Ignorar error de lectura
    }
    return true;
  }
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (typeof raw === "object" && raw.type === "Buffer" && Array.isArray(raw.data)) {
    return raw.data[0] === 1;
  }
  const str = String(raw).toLowerCase();
  return str === "activo" || str === "1" || str === "true";
};
const toSafeString = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return fallback;
  return String(val);
};

const getTodayYYYYMMDD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const calcularDuracion = (salida, llegada) => {
  const [h1 = 0, m1 = 0] = String(salida || "").split(":").map(Number);
  const [h2 = 0, m2 = 0] = String(llegada || "").split(":").map(Number);
  const diffMin = h2 * 60 + m2 - (h1 * 60 + m1);
  if (isNaN(diffMin) || diffMin <= 0) return null;
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
};

export default function HorariosAdmin() {
  const [horarios, setHorarios] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filterFecha, setFilterFecha] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Campos del formulario
  const [fecha, setFecha] = useState(getTodayYYYYMMDD());
  const [horaSalida, setHoraSalida] = useState("08:00");
  const [horaLlegada, setHoraLlegada] = useState("09:00");
  const [idRuta, setIdRuta] = useState("");
  const [idVehiculo, setIdVehiculo] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [horariosData, rutasData, vehiculosRes] = await Promise.all([
        getHorarios(),
        getRutas().catch(() => []),
        API.get("/vehiculos").catch(() => ({ data: [] })),
      ]);

      const rawVehiculos = Array.isArray(vehiculosRes.data)
        ? vehiculosRes.data
        : Array.isArray(vehiculosRes.data?.data)
        ? vehiculosRes.data.data
        : [];

      setHorarios(horariosData);
      setRutas(rutasData);
      setVehiculos(rawVehiculos);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      setErrorMsg(`Error al conectar con /horarios (${error.response?.status || "Red"})`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fecha || !horaSalida || !horaLlegada) {
      setErrorMsg("Completa Fecha, Hora de Salida y Hora de Llegada.");
      return;
    }

    if (horaLlegada <= horaSalida) {
      setErrorMsg("La hora de llegada debe ser posterior a la hora de salida.");
      return;
    }

    setIsSaving(true);
    try {
      await createHorario({
        fecha,
        horaSalida,
        horaLlegada,
        idRuta,
        idVehiculo,
      });
      setSuccessMsg(`Horario ${horaSalida} - ${horaLlegada} registrado correctamente.`);
      await loadData();
    } catch (error) {
      console.error("Error al registrar horario:", error);
      const raw = error.response?.data?.message || error.response?.data?.error;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo registrar el horario."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignMeta = async (horarioId, field, value) => {
    saveHorarioMeta(horarioId, { [field]: value });
    setSuccessMsg("Asignación operativa actualizada.");
    await loadData();
  };

  const handleDelete = async (h) => {
    const id = h.resolvedId;
    if (!window.confirm(`¿Eliminar el horario #${id} (${h.resolvedHoraSalida})?`)) return;

    try {
      await deleteHorario(id);
      setSuccessMsg(`Horario #${id} eliminado.`);
      await loadData();
    } catch (error) {
      const raw = error.response?.data?.message;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo eliminar el horario."
      );
    }
  };

  const vehiculosActivos = vehiculos.filter((v) => isVehiculoActivo(v));

  const getRutaLabel = (rId) => {
    if (!rId) return "";
    const found = rutas.find((r) => String(extractRutaId(r)) === String(rId));
    return found ? getRutaNombre(found) || `Ruta #${rId}` : `Ruta #${rId}`;
  };

  const getVehiculoLabel = (vId) => {
    if (!vId) return "";
    const found = vehiculos.find((v) => String(extractVehiculoId(v)) === String(vId));
    if (!found) return `Unidad #${vId}`;
    const num = toSafeString(found.Num_Vehic ?? found.numVehic ?? found.num_vehic);
    const placa = toSafeString(found.Placa ?? found.placa);
    return `Unidad ${num || `#${vId}`} (${placa || "Sin placa"})`;
  };

  const filteredHorarios = horarios.filter((h) => {
    if (filterFecha && h.resolvedFecha !== filterFecha) return false;

    const q = searchTerm.toLowerCase();
    if (!q) return true;

    const searchable = `#${h.resolvedId} ${h.resolvedFecha} ${h.resolvedHoraSalida} ${
      h.resolvedHoraLlegada
    } ${getRutaLabel(h.resolvedIdRuta)} ${getVehiculoLabel(h.resolvedIdVehiculo)}`.toLowerCase();

    return searchable.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
          GESTIÓN DE HORARIOS Y SALIDAS
        </h1>
        <p className="text-xs text-slate-500">
          Programación de corridas, horas de salida/llegada y asignación de rutas y unidades
        </p>
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

      {/* Formulario de Registro de Horario */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#123254] mb-4">
          Programar Nuevo Horario
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Operación *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora de Salida *
              </label>
              <input
                type="time"
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora de Llegada *
              </label>
              <input
                type="time"
                value={horaLlegada}
                onChange={(e) => setHoraLlegada(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ruta (Opcional)
              </label>
              <select
                value={idRuta}
                onChange={(e) => setIdRuta(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
              >
                <option value="">Sin ruta específica</option>
                {rutas.map((r) => {
                  const rid = extractRutaId(r);
                  return (
                    <option key={rid} value={rid}>
                      #{rid} - {getRutaNombre(r)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidad (Opcional)
              </label>
              <select
                value={idVehiculo}
                onChange={(e) => setIdVehiculo(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
              >
                <option value="">Sin unidad asignada</option>
                {vehiculosActivos.map((v) => {
                  const vid = extractVehiculoId(v);
                  const num = toSafeString(v.Num_Vehic ?? v.numVehic ?? v.num_vehic);
                  const placa = toSafeString(v.Placa ?? v.placa);
                  return (
                    <option key={vid} value={vid}>
                      Unidad {num || `#${vid}`} ({placa})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar Horario"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Horarios */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#123254]">
              Horarios Programados ({filteredHorarios.length})
            </h2>
            <p className="text-[11px] text-slate-400">
              Filtra por fecha de operación o asigna una ruta y unidad a cada corrida
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
              placeholder="Buscar hora, ruta o unidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
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
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Cargando horarios...
          </div>
        ) : filteredHorarios.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No hay horarios registrados con este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">FECHA</th>
                  <th className="py-3 px-4">SALIDA → LLEGADA</th>
                  <th className="py-3 px-4">RUTA ASIGNADA</th>
                  <th className="py-3 px-4">UNIDAD ASIGNADA</th>
                  <th className="py-3 px-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredHorarios.map((h, idx) => {
                  const id = h.resolvedId ?? idx + 1;
                  const duracion = calcularDuracion(
                    h.resolvedHoraSalida,
                    h.resolvedHoraLlegada
                  );

                  return (
                    <tr key={id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 text-slate-400 font-semibold">
                        #{id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#123254]">
                        {formatFechaLegible(h.resolvedFecha)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-800">
                            {h.resolvedHoraSalida}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {h.resolvedHoraLlegada}
                          </span>
                          {duracion && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-semibold">
                              {duracion}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={h.resolvedIdRuta}
                          onChange={(e) =>
                            handleAssignMeta(id, "idRuta", e.target.value)
                          }
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                        >
                          <option value="">Sin asignar</option>
                          {rutas.map((r) => {
                            const rid = extractRutaId(r);
                            return (
                              <option key={rid} value={rid}>
                                {getRutaNombre(r)}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={h.resolvedIdVehiculo}
                          onChange={(e) =>
                            handleAssignMeta(id, "idVehiculo", e.target.value)
                          }
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                        >
                          <option value="">Sin asignar</option>
                          {vehiculosActivos.map((v) => {
                            const vid = extractVehiculoId(v);
                            const num = toSafeString(
                              v.Num_Vehic ?? v.numVehic ?? v.num_vehic
                            );
                            const placa = toSafeString(v.Placa ?? v.placa);
                            return (
                              <option key={vid} value={vid}>
                                Unidad {num || `#${vid}`} ({placa})
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
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
    </div>
  );
}