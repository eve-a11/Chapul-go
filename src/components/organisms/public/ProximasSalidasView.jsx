// src/components/organisms/public/ProximasSalidasView.jsx
import { useState, useEffect, useCallback } from "react";
import API from "../../../services/api";

const SALIDAS_RESPALDO = [
  {
    id: 1,
    origen: "El Rayo",
    destino: "Chapulhuacán",
    hora: "08:35",
    tiempoRestante: "Sale en 05 min",
    unidad: "Unidad A1",
    estatus: "En ruta",
    progreso: 65,
  },
  {
    id: 2,
    origen: "Chapulhuacán",
    destino: "El Rayo",
    hora: "09:05",
    tiempoRestante: "Sale en 35 min",
    unidad: "Combi #04",
    estatus: "En base",
    progreso: 15,
  },
  {
    id: 3,
    origen: "El Rayo",
    destino: "Chapulhuacán",
    hora: "09:35",
    tiempoRestante: "Sale en 1 h 05 min",
    unidad: "Combi #11",
    estatus: "Programada",
    progreso: 0,
  },
];

function calcularMinutosFaltantes(horaStr) {
  if (!horaStr || !horaStr.includes(":")) return "Próxima salida";
  const [hh, mm] = horaStr.split(":").map(Number);
  const ahora = new Date();
  const salida = new Date();
  salida.setHours(hh, mm, 0, 0);

  let diffMin = Math.round((salida - ahora) / 60000);
  if (diffMin < -30) diffMin += 1440; // Si ya pasó hace mucho, es de mañana
  if (diffMin <= 0) return "Saliendo ahora";
  if (diffMin < 60) return `Sale en ${String(diffMin).padStart(2, "0")} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `Sale en ${h} h ${m > 0 ? `${m} min` : ""}`.trim();
}

export default function ProximasSalidasView({ onBack }) {
  const [salidas, setSalidas] = useState(SALIDAS_RESPALDO);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ultimaAct, setUltimaAct] = useState("Actualizado ahora");

  const cargarSalidas = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [resHorarios, resRutas] = await Promise.all([
        API.get("/horarios").catch(() => ({ data: [] })),
        API.get("/rutas").catch(() => ({ data: [] })),
      ]);

      const listaHorarios = Array.isArray(resHorarios?.data)
        ? resHorarios.data
        : resHorarios?.data?.data || [];
      const listaRutas = Array.isArray(resRutas?.data)
        ? resRutas.data
        : resRutas?.data?.data || [];

      if (listaHorarios.length > 0) {
        const rutasMap = {};
        listaRutas.forEach((r) => {
          const idR = r.idRuta ?? r.idRutas ?? r.id;
          if (idR) rutasMap[String(idR)] = r;
        });

        const mapeadas = listaHorarios.map((h, idx) => {
          const idH = h.idHorarios ?? h.idHorario ?? h.id ?? idx + 1;
          const rutaObj =
            h.ruta || rutasMap[String(h.idRuta ?? h.idRutas)] || {};
          const origen =
            rutaObj.origen ||
            (idx % 2 === 0 ? "El Rayo" : "Chapulhuacán");
          const destino =
            rutaObj.destino ||
            (idx % 2 === 0 ? "Chapulhuacán" : "El Rayo");
          const horaCorta = h.horaSalida
            ? String(h.horaSalida).slice(0, 5)
            : "08:35";
          const unidad =
            h.vehiculo?.numeroEconomico ||
            h.vehiculo?.placa ||
            (h.idVehiculo ? `Unidad #${h.idVehiculo}` : `Unidad A${idx + 1}`);

          return {
            id: idH,
            origen,
            destino,
            hora: horaCorta,
            tiempoRestante: calcularMinutosFaltantes(horaCorta),
            unidad,
            estatus: idx === 0 ? "En ruta" : "En base",
            progreso: idx === 0 ? 68 : 10,
          };
        });

        setSalidas(mapeadas);
      }
      setUltimaAct("Actualizado ahora");
    } catch {
      // Mantiene respaldo
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarSalidas();
  }, [cargarSalidas]);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-100/80 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Botón regresar */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-base font-extrabold text-[#0b1938] hover:opacity-80 transition cursor-pointer"
        >
          <span className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-sm">
            ←
          </span>
          <span>Próximas salidas</span>
        </button>

        {/* Lista de tarjetas de salida */}
        <div className="space-y-4">
          {salidas.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5"
            >
              {/* Fila superior: Ruta y botón actualizar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-extrabold text-[#0b1938] flex items-center gap-2.5">
                  <span>{s.origen}</span>
                  <span className="text-slate-400 font-normal">→</span>
                  <span>{s.destino}</span>
                </h2>

                <button
                  type="button"
                  onClick={cargarSalidas}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-semibold transition cursor-pointer"
                >
                  <span className={isRefreshing ? "animate-spin" : ""}>↻</span>
                  <span>{isRefreshing ? "Actualizando..." : ultimaAct}</span>
                </button>
              </div>

              {/* Fila central: Hora programada + Badges */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-1">
                    Hora programada
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-[#0b1938] tracking-tight">
                    {s.hora}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0b1938] text-white text-xs font-bold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {s.tiempoRestante}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-[#0b1938] border border-slate-200/80 text-xs font-bold">
                    🚌 {s.unidad}
                  </span>
                </div>
              </div>

              {/* Caja inferior: Progreso del recorrido */}
              <div className="bg-slate-50/90 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    Progreso del recorrido
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {s.estatus}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0b1938] rounded-full transition-all duration-700"
                    style={{ width: `${s.progreso}%` }}
                  />
                </div>

                {/* Extremos de la barra */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0b1938]" />
                    {s.origen}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    {s.destino}
                    <span className="w-2 h-2 rounded-full border-2 border-slate-400" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}