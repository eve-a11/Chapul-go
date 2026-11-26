// src/components/organisms/public/TarifaModal.jsx
import { useState, useEffect, useMemo } from "react";
import API from "../../../services/api";

const PUNTOS_DEFAULT = [
  { id: "1", nombre: "Chapulhuacán", orden: 1 },
  { id: "2", nombre: "UTTT", orden: 2 },
  { id: "3", nombre: "Puerto Obscuro", orden: 3 },
  { id: "4", nombre: "Santa Ana de Allende", orden: 4 },
  { id: "5", nombre: "El Rayo", orden: 5 },
];

export default function TarifaModal({ isOpen, onClose }) {
  const [puntos, setPuntos] = useState(PUNTOS_DEFAULT);
  const [tarifasApi, setTarifasApi] = useState([]);
  const [origen, setOrigen] = useState("Puerto Obscuro");
  const [destino, setDestino] = useState("Chapulhuacán");
  const [pasajeros, setPasajeros] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const cargarDatosTarifas = async () => {
      try {
        const [resParadas, resTarifas, resRel] = await Promise.all([
          API.get("/paradas").catch(() => ({ data: [] })),
          API.get("/tarifas").catch(() => ({ data: [] })),
          API.get("/r-tarifa-ruta").catch(() => ({ data: [] })),
        ]);

        const listaParadas = Array.isArray(resParadas?.data)
          ? resParadas.data
          : resParadas?.data?.data || [];
        if (listaParadas.length > 0) {
          setPuntos(
            listaParadas.map((p, idx) => ({
              id: String(p.idParada ?? p.id ?? idx + 1),
              nombre: String(p.nombre || p.parada || `Parada ${idx + 1}`).trim(),
              orden: idx + 1,
            }))
          );
        }

        const listaTarifas = Array.isArray(resTarifas?.data)
          ? resTarifas.data
          : resTarifas?.data?.data || [];
        const listaRel = Array.isArray(resRel?.data)
          ? resRel.data
          : resRel?.data?.data || [];

        setTarifasApi([...listaRel, ...listaTarifas]);
      } catch {
        // Mantiene respaldo local
      }
    };

    cargarDatosTarifas();
  }, [isOpen]);

  const handleInvertir = () => {
    setOrigen(destino);
    setDestino(origen);
  };

  // Cálculo dinámico de tarifa y tiempo según origen/destino y API
  const { precioUnitario, tiempoEstimado } = useMemo(() => {
    if (origen === destino) {
      return { precioUnitario: 0, tiempoEstimado: 0 };
    }

    // Buscar si existe tarifa exacta registrada en la API
    const matchApi = tarifasApi.find((t) => {
      const texto = JSON.stringify(t).toLowerCase();
      return (
        texto.includes(origen.toLowerCase()) &&
        texto.includes(destino.toLowerCase())
      );
    });

    if (matchApi) {
      const monto = Number(
        matchApi.precio ?? matchApi.monto ?? matchApi.tarifa?.precio ?? 14
      );
      if (monto > 0) {
        return {
          precioUnitario: monto,
          tiempoEstimado: Math.max(10, Math.round(monto * 2.5)),
        };
      }
    }

    // Cálculo proporcional por distancia entre paradas (base $10 mínimo, $35 completa)
    const idxO = puntos.findIndex(
      (p) => p.nombre.toLowerCase() === origen.toLowerCase()
    );
    const idxD = puntos.findIndex(
      (p) => p.nombre.toLowerCase() === destino.toLowerCase()
    );

    if (idxO !== -1 && idxD !== -1 && puntos.length > 1) {
      const saltos = Math.abs(idxD - idxO);
      const maxSaltos = puntos.length - 1;
      const proporcion = saltos / maxSaltos;
      const precioCalc = Math.max(10, Math.round(10 + proporcion * 25));
      const tiempoCalc = Math.max(8, Math.round(8 + proporcion * 52));
      return { precioUnitario: precioCalc, tiempoEstimado: tiempoCalc };
    }

    return { precioUnitario: 14, tiempoEstimado: 35 };
  }, [origen, destino, puntos, tarifasApi]);

  if (!isOpen) return null;

  const totalFinal = (precioUnitario * pasajeros).toFixed(2);
  const [entero, decimales] = totalFinal.split(".");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center md:justify-end md:items-start md:pt-20 md:pr-12 lg:pr-24 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-[fadeIn_0.2s_ease-out]"
      >
        {/* Cabecera Azul Marino */}
        <div className="bg-[#0b1938] text-white px-6 pt-5 pb-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar tarifas"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="px-3.5 py-1 rounded-full bg-white text-[#0b1938] text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
              TARIFA DE VIAJE
            </span>
            <h2 className="mt-2.5 text-lg font-extrabold tracking-tight">
              Detalles del traslado
            </h2>
          </div>

          {/* Resumen visual Salida <-> Llegada */}
          <div className="mt-5 flex items-center justify-between gap-2 px-1">
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-extrabold truncate">{origen}</p>
              <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                SALIDA
              </span>
            </div>

            <button
              type="button"
              onClick={handleInvertir}
              title="Invertir origen y destino"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white shrink-0 transition cursor-pointer"
            >
              ⇄
            </button>

            <div className="flex-1 text-right min-w-0">
              <p className="text-sm font-extrabold truncate">{destino}</p>
              <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                LLEGADA
              </span>
            </div>
          </div>
        </div>

        {/* Cuerpo de controles */}
        <div className="px-6 py-4 divide-y divide-slate-100 text-xs sm:text-sm">
          {/* Origen */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-500 font-medium">
              <span className="text-slate-400">📍</span> Origen:
            </span>
            <select
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              className="max-w-[185px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-[#0b1938] font-bold text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#0b1938] cursor-pointer"
            >
              {puntos.map((p) => (
                <option key={`orig-${p.id}`} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Destino */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-500 font-medium">
              <span className="text-slate-400">⚑</span> Destino:
            </span>
            <select
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="max-w-[185px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-[#0b1938] font-bold text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#0b1938] cursor-pointer"
            >
              {puntos.map((p) => (
                <option key={`dest-${p.id}`} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Pasajeros */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-500 font-medium">
              <span className="text-slate-400">👥</span> Pasajeros:
            </span>
            <select
              value={pasajeros}
              onChange={(e) => setPasajeros(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-[#0b1938] font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#0b1938] cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "pasajero" : "pasajeros"}
                </option>
              ))}
            </select>
          </div>

          {/* Tiempo estimado */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-500 font-medium">
              <span className="text-slate-400">🕒</span> Tiempo est.:
            </span>
            <span className="font-bold text-slate-700 text-xs">
              {tiempoEstimado} min
            </span>
          </div>
        </div>

        {/* Pie con Total */}
        <div className="bg-slate-50/90 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-700">Total</span>
          <div className="text-[#0b1938] font-black flex items-start leading-none">
            <span className="text-sm mt-0.5 mr-0.5">$</span>
            <span className="text-2xl tracking-tight">{entero}</span>
            <span className="text-xs mt-0.5">.{decimales}</span>
          </div>
        </div>
      </div>
    </div>
  );
}