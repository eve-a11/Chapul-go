// src/components/organisms/public/ObjetosPerdidosForm.jsx
import { useState, useEffect } from "react";
import {
  createCosaPerdidaPublic,
  getLoggedUserFromSession,
  formatFechaLegible,
} from "../../../services/cosasPerService";
import { getHorarios } from "../../../services/horariosService";

export default function ObjetosPerdidosForm() {
  const [user, setUser] = useState({ idUser: "", nombre: "Usuario Chapul-Go" });
  const [horarios, setHorarios] = useState([]);

  const [objeto, setObjeto] = useState("");
  const [idHorarios, setIdHorarios] = useState("");
  const [lugar, setLugar] = useState("");
  const [fechaViaje, setFechaViaje] = useState("");
  const [horaAprox, setHoraAprox] = useState("");
  const [detalleExtra, setDetalleExtra] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    const session = getLoggedUserFromSession();
    if (session) {
      setUser(session);
    }

    const cargarHorarios = async () => {
      try {
        const res = await getHorarios();
        const lista = Array.isArray(res) ? res : res?.data || [];
        setHorarios(lista);
      } catch (err) {
        console.error("Error al cargar corridas/horarios:", err);
      }
    };

    cargarHorarios();
  }, []);

  const iniciales = (user.nombre || "UC")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSelectHorario = (e) => {
    const selectedId = e.target.value;
    setIdHorarios(selectedId);

    const encontrado = horarios.find(
      (h) => String(h.idHorarios ?? h.id) === String(selectedId)
    );
    if (encontrado) {
      if (encontrado.fecha) {
        setFechaViaje(String(encontrado.fecha).split("T")[0]);
      }
      if (encontrado.horaSalida) {
        setHoraAprox(encontrado.horaSalida.substring(0, 5));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback({ type: "", text: "" });

    try {
      const descripcionCompleta = [
        objeto.trim(),
        lugar.trim() ? `(Lugar: ${lugar.trim()})` : "",
        detalleExtra.trim() ? `- ${detalleExtra.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      await createCosaPerdidaPublic({
        descripcion: descripcionCompleta,
        idHorarios: idHorarios,
        idUser: user.idUser,
      });

      setFeedback({
        type: "success",
        text: "¡Reporte enviado con éxito! Nuestro equipo en base ya puede visualizarlo.",
      });

      setObjeto("");
      setIdHorarios("");
      setLugar("");
      setFechaViaje("");
      setHoraAprox("");
      setDetalleExtra("");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "No se pudo registrar el reporte.";
      setFeedback({
        type: "error",
        text: Array.isArray(msg) ? msg.join(" • ") : msg,
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

        {/* Avatar e información del usuario */}
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

        {/* Título y subtítulo */}
        <div className="text-center px-6 sm:px-10 pt-5 pb-3">
          <h1 className="text-xl font-extrabold text-slate-900">
            Reporta un objeto extraviado
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto leading-relaxed">
            ¿Olvidaste alguna pertenencia durante tu viaje? Completa los
            siguientes datos con la mayor precisión posible para registrar tu
            reporte.
          </p>
        </div>

        {feedback.text && (
          <div
            className={`mx-6 sm:mx-10 mt-2 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between ${
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
          className="px-6 sm:px-10 pt-4 pb-8 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                ○ ¿Qué objeto perdiste? *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Mochila, Celular..."
                value={objeto}
                onChange={(e) => setObjeto(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                ☷ Ruta o unidad *
              </label>
              <select
                required
                value={idHorarios}
                onChange={handleSelectHorario}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
              >
                <option value="">Ej. El Rayo → Chapulhuacán, Unidad A1</option>
                {horarios.map((h) => {
                  const idH = h.idHorarios ?? h.id;
                  const rutaNombre =
                    h.ruta?.nombre || h.nombreRuta || `Corrida #${idH}`;
                  const salida = h.horaSalida ? h.horaSalida.slice(0, 5) : "";
                  const fechaTxt = h.fecha ? formatFechaLegible(h.fecha) : "";
                  return (
                    <option key={idH} value={idH}>
                      {rutaNombre} {salida ? `(${salida})` : ""}{" "}
                      {fechaTxt ? `- ${fechaTxt}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                📍 Lugar donde lo perdiste
              </label>
              <input
                type="text"
                placeholder="Ej. Asiento trasero, Base Chapulhuacán"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                📅 Fecha del viaje
              </label>
              <input
                type="date"
                value={fechaViaje}
                onChange={(e) => setFechaViaje(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              🕒 Hora aproximada
            </label>
            <input
              type="time"
              value={horaAprox}
              onChange={(e) => setHoraAprox(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              📄 Describe el objeto *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Incluye color, marca, tamaño o características únicas..."
              value={detalleExtra}
              onChange={(e) => setDetalleExtra(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1938]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#0b1938] hover:bg-[#152c5e] text-white text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Enviando reporte..." : "Enviar reporte"}
          </button>
        </form>
      </div>
    </div>
  );
}