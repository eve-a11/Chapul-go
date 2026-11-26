// src/components/organisms/public/CalificacionForm.jsx
import { useState, useEffect } from "react";
import { createCalificacionPublic } from "../../../services/calificacionesService";
import {
  getLoggedUserFromSession,
  formatFechaLegible,
} from "../../../services/cosasPerService";
import { getHorarios } from "../../../services/horariosService";
import { getRutas } from "../../../services/rutasService";

function StarSelector({ label, value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col items-center py-2">
      <span className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} estrellas`}
              className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                  active
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-300 fill-slate-200/70"
                }`}
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CalificacionForm() {
  const [user, setUser] = useState({ idUser: "", nombre: "Usuario Chapul-Go" });
  const [corridas, setCorridas] = useState([]);

  const [idHorario, setIdHorario] = useState("");
  const [calServicio, setCalServicio] = useState(0);
  const [calChofer, setCalChofer] = useState(0);
  const [comentario, setComentario] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    const session = getLoggedUserFromSession();
    if (session) {
      setUser(session);
    }

    const cargarRutasYHorarios = async () => {
      try {
        const [resHorarios, resRutas] = await Promise.all([
          getHorarios().catch(() => []),
          getRutas().catch(() => []),
        ]);

        const listaHorarios = Array.isArray(resHorarios)
          ? resHorarios
          : resHorarios?.data || [];
        const listaRutas = Array.isArray(resRutas)
          ? resRutas
          : resRutas?.data || [];

        // Mapa rápido de rutas por ID para cruzar el nombre si el horario solo trae idRuta
        const rutasMap = {};
        listaRutas.forEach((r) => {
          const idR = r.idRuta ?? r.idRutas ?? r.id;
          const origen = r.origen || r.inicio || "";
          const destino = r.destino || r.fin || "";
          const nombre =
            r.nombre ||
            (origen && destino ? `${origen} → ${destino}` : `Ruta #${idR}`);
          if (idR) rutasMap[String(idR)] = nombre;
        });

        const opciones = listaHorarios.map((h) => {
          const idH = h.idHorarios ?? h.idHorario ?? h.id;
          const idRutaRel = h.ruta?.idRuta ?? h.idRuta ?? h.idRutas;
          const nombreRuta =
            h.ruta?.nombre ||
            (idRutaRel && rutasMap[String(idRutaRel)]) ||
            `Corrida #${idH}`;
          const salida = h.horaSalida ? String(h.horaSalida).slice(0, 5) : "";
          const fechaTxt = h.fecha ? formatFechaLegible(h.fecha) : "";
          const unidadTxt =
            h.vehiculo?.numeroEconomico ||
            h.vehiculo?.placa ||
            (h.idVehiculo ? `Unidad #${h.idVehiculo}` : "");

          return {
            id: String(idH),
            label: [
              nombreRuta,
              unidadTxt ? `(${unidadTxt})` : "",
              salida ? `· ${salida} hrs` : "",
              fechaTxt ? `- ${fechaTxt}` : "",
            ]
              .filter(Boolean)
              .join(" "),
          };
        });

        setCorridas(opciones);
      } catch (err) {
        console.error("Error al cargar rutas/horarios:", err);
      }
    };

    cargarRutasYHorarios();
  }, []);

  const iniciales = (user.nombre || "UC")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    if (!idHorario) {
      setFeedback({
        type: "error",
        text: "Por favor selecciona la ruta o corrida que abordaste.",
      });
      return;
    }

    if (calServicio < 1 || calChofer < 1) {
      setFeedback({
        type: "error",
        text: "Selecciona al menos 1 estrella tanto para el servicio como para el chofer.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createCalificacionPublic({
        idHorario,
        calServicio,
        calChofer,
        comentario,
        idUser: user.idUser,
      });

      setFeedback({
        type: "success",
        text: "¡Gracias! Tu calificación y reseña fueron enviadas al panel de control.",
      });

      setIdHorario("");
      setCalServicio(0);
      setCalChofer(0);
      setComentario("");
    } catch (error) {
      const raw = error.response?.data?.message || error.message;
      setFeedback({
        type: "error",
        text: Array.isArray(raw)
          ? raw.join(" • ")
          : raw || "No se pudo enviar tu calificación.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200/70 overflow-hidden">
        {/* Banner superior azul marino */}
        <div className="h-28 bg-[#0b1938] w-full" />

        {/* Avatar e información del pasajero */}
        <div className="flex flex-col items-center -mt-11 px-6 text-center">
          <div className="relative w-22 h-22 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center text-2xl font-extrabold text-[#0b1938]">
            {iniciales}
            <span
              title="Sesión verificada"
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white text-xs flex items-center justify-center"
            >
              ✓
            </span>
          </div>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            {user.nombre}
          </h2>
          <p className="text-xs text-slate-500">
            Pasajero {user.idUser ? `· ID Usuario #${user.idUser}` : ""}
          </p>
        </div>

        {/* Título */}
        <div className="text-center px-6 sm:px-10 pt-5 pb-2">
          <h1 className="text-xl font-extrabold text-slate-900">
            Califica tu viaje
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Tu opinión nos ayuda a mejorar la calidad del transporte y el trato
            de nuestros operadores.
          </p>
        </div>

        {/* Alertas */}
        {feedback.text && (
          <div
            className={`mx-6 sm:mx-10 mt-3 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback({ type: "", text: "" })}
              className="font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="px-6 sm:px-10 pt-4 pb-8 space-y-5"
        >
          {/* Selector de Ruta / Corrida */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              🚌 Ruta o corrida abordada *
            </label>
            <select
              required
              value={idHorario}
              onChange={(e) => setIdHorario(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
            >
              <option value="">Selecciona la ruta / horario de tu viaje...</option>
              {corridas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bloque de Estrellas (Servicio y Chofer) */}
          <div className="py-2 border-y border-slate-100 space-y-3">
            <StarSelector
              label="Calificación del servicio"
              value={calServicio}
              onChange={setCalServicio}
            />

            <StarSelector
              label="Calificación del chofer"
              value={calChofer}
              onChange={setCalChofer}
            />
          </div>

          {/* Reseña detallada (opcional) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Agrega una reseña detallada (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Escribe aquí tus comentarios sobre la unidad o el operador..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#0b1938] hover:bg-[#152c5e] text-white text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Enviando calificación..." : "Enviar calificación"}
          </button>
        </form>
      </div>
    </div>
  );
}