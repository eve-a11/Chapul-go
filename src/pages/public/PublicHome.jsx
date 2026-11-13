import { useState, useEffect, useMemo } from "react";
import PublicLayout from "../../components/templates/public/PublicLayout";
import PublicHeroBanner from "../../components/organisms/public/PublicHeroBanner";
import PublicQuickCard from "../../components/molecules/public/PublicQuickCard";
import { PUBLIC_NAV_ITEMS } from "../../components/organisms/public/PublicNavbar";
import {
  getPublicHomeData,
  sendCalificacionServicio,
} from "../../services/publicService";
import {
  getStoredUser,
  isTokenValid,
  clearAuthSession,
} from "../../utils/authSession";

const FAVORITES_KEY = "chapulgo_favorite_routes";

export default function PublicHome() {
  const loggedIn = isTokenValid();
  const user = getStoredUser() || {};
  const userName =
    user?.nombre ||
    user?.Nombre ||
    (user?.email ? user.email.split("@")[0] : "Pasajero");

  const [activeTab, setActiveTab] = useState("inicio");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [rutas, setRutas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [objetosPerdidos, setObjetosPerdidos] = useState([]);
  const [locationName, setLocationName] = useState("Chapulhuacán");

  // Calificación y comentarios (/calif-servicio)
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      const data = await getPublicHomeData(user?.idLocalidad);
      if (active) {
        setRutas(data.rutas);
        setHorarios(data.horarios);
        setObjetosPerdidos(data.objetosPerdidos);
        setLocationName(data.localidadActual);
        setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [user?.idLocalidad]);

  const toggleFavorite = (rutaId) => {
    setFavoriteIds((prev) => {
      const updated = prev.includes(rutaId)
        ? prev.filter((id) => id !== rutaId)
        : [rutaId, ...prev];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = () => {
    clearAuthSession();
    window.location.replace("/");
  };

  const filteredRutas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rutas;
    return rutas.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.origen.toLowerCase().includes(q) ||
        r.destino.toLowerCase().includes(q) ||
        r.paradas.some((p) => p.nombre.toLowerCase().includes(q))
    );
  }, [rutas, searchQuery]);

  const favoriteRutas = useMemo(
    () => rutas.filter((r) => favoriteIds.includes(r.id)),
    [rutas, favoriteIds]
  );

  const quickCardsData = [
    {
      id: "tarifas",
      title: "Tarifas",
      description: "Consulta precios vigentes por ruta y destino.",
      badge: `${rutas.length} rutas`,
      icon: PUBLIC_NAV_ITEMS.find((i) => i.id === "tarifas")?.icon,
    },
    {
      id: "rutas",
      title: "Rutas",
      description: "Explora paradas y guarda tu ruta preferida.",
      badge: `${favoriteRutas.length} favs`,
      icon: PUBLIC_NAV_ITEMS.find((i) => i.id === "rutas")?.icon,
    },
    {
      id: "horarios",
      title: "Horarios",
      description: "Revisa horas de salida, llegada y frecuencias.",
      badge: `${horarios.length} turnos`,
      icon: PUBLIC_NAV_ITEMS.find((i) => i.id === "horarios")?.icon,
    },
    {
      id: "ayuda",
      title: "Ayuda",
      description: "Guía rápida de uso y atención al pasajero.",
      badge: "Guía",
      icon: PUBLIC_NAV_ITEMS.find((i) => i.id === "ayuda")?.icon,
    },
  ];

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSendingFeedback(true);
    setFeedbackMessage("");
    try {
      await sendCalificacionServicio({
        calificacion: Number(rating),
        comentario: commentText.trim(),
        ...(user?.idUsuario || user?.id
          ? { idUsuario: Number(user.idUsuario ?? user.id) }
          : {}),
      });
      setCommentText("");
      setFeedbackMessage("¡Gracias! Tu opinión se registró correctamente.");
    } catch {
      setCommentText("");
      setFeedbackMessage("¡Gracias por compartir tu comentario con Chapul-Go!");
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <PublicLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      locationName={locationName}
      loggedIn={loggedIn}
      userName={userName}
      onLogout={handleLogout}
    >
      {/* VISTA PRINCIPAL: INICIO */}
      {activeTab === "inicio" && (
        <>
          <PublicHeroBanner
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => setActiveTab("rutas")}
          />

          {/* Resultados instantáneos si el usuario empieza a escribir en Inicio */}
          {searchQuery.trim() !== "" && (
            <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#081633]">
                  Coincidencias para "{searchQuery}" ({filteredRutas.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold text-slate-500 hover:text-[#081633]"
                >
                  Limpiar búsqueda ✕
                </button>
              </div>
              {filteredRutas.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No encontramos rutas o paradas con ese nombre.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredRutas.slice(0, 4).map((ruta) => (
                    <div
                      key={ruta.id}
                      className="flex items-center justify-between rounded-xl bg-white p-3.5 shadow-2xs"
                    >
                      <div>
                        <p className="text-sm font-extrabold text-[#081633]">
                          {ruta.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ruta.origen} → {ruta.destino}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("rutas")}
                        className="rounded-lg bg-[#dce8f8] px-3 py-1.5 text-xs font-bold text-[#081633]"
                      >
                        Ver paradas
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Fila de 4 tarjetas azul hielo */}
          <section className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickCardsData.map((card) => (
                <PublicQuickCard
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  badge={card.badge}
                  onClick={() => setActiveTab(card.id)}
                />
              ))}
            </div>
          </section>

          {/* Bloque de Ruta Preferida del Pasajero */}
          <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#081633]">
                  ★ Tu Ruta Preferida ({userName})
                </h2>
                <p className="text-xs text-slate-500">
                  Guarda las rutas que usas diario para consultar sus horarios y paradas al instante.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("rutas")}
                className="rounded-xl bg-[#081633] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#102757]"
              >
                {favoriteRutas.length > 0 ? "Administrar preferidas" : "Elegir ruta preferida"}
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500">Cargando información de rutas...</p>
            ) : favoriteRutas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  Aún no has marcado ninguna ruta como preferida.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("rutas")}
                  className="mt-2 text-xs font-extrabold text-[#081633] hover:underline"
                >
                  Ir a Rutas y marcar con ☆ →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {favoriteRutas.map((ruta) => (
                  <div
                    key={ruta.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-extrabold text-[#081633]">
                          {ruta.nombre}
                        </span>
                        <p className="text-xs text-slate-500">
                          {ruta.origen} → {ruta.destino}
                        </p>
                      </div>
                      {ruta.tarifa !== null && (
                        <span className="rounded-lg bg-[#dce8f8] px-2.5 py-1 text-xs font-extrabold text-[#081633]">
                          ${ruta.tarifa}
                        </span>
                      )}
                    </div>
                    {ruta.paradas.length > 0 && (
                      <p className="mt-2.5 truncate text-[11px] text-slate-500">
                        📍 {ruta.paradas.map((p) => p.nombre).join(" • ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* PESTAÑA: RUTAS */}
      {activeTab === "rutas" && (
        <section className="mx-auto max-w-5xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#081633]">
                Rutas y Paradas
              </h2>
              <p className="text-xs text-slate-500">
                Haz clic en Guardar para fijar tu ruta preferida en Inicio.
              </p>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ruta, origen o parada..."
              className="w-full sm:w-72 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-[#081633] focus:bg-white"
            />
          </div>

          {filteredRutas.length === 0 ? (
            <div className="rounded-2xl bg-[#edf3fb] p-8 text-center text-sm font-bold text-[#081633]">
              No hay rutas disponibles con ese criterio.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRutas.map((ruta) => {
                const isFav = favoriteIds.includes(ruta.id);
                return (
                  <div
                    key={ruta.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-[#081633]">
                          {ruta.nombre}
                        </h3>
                        <p className="text-xs font-medium text-slate-600">
                          {ruta.origen} → {ruta.destino}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(ruta.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          isFav
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#edf3fb] text-[#081633] hover:bg-[#dce8f8]"
                        }`}
                      >
                        {isFav ? "★ Preferida" : "☆ Guardar"}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {ruta.tarifa !== null && (
                        <span className="rounded-lg bg-[#dce8f8] px-2.5 py-1 font-bold text-[#081633]">
                          Tarifa: ${ruta.tarifa}
                        </span>
                      )}
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                        {ruta.frecuencia}
                      </span>
                    </div>

                    {ruta.paradas.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-bold uppercase text-slate-400">
                          Paradas del recorrido ({ruta.paradas.length})
                        </p>
                        <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                          {ruta.paradas.map((p, i) => (
                            <li key={p.id}>
                              <strong>{i + 1}.</strong> {p.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* PESTAÑA: TARIFAS */}
      {activeTab === "tarifas" && (
        <section className="mx-auto max-w-5xl space-y-4">
          <h2 className="text-xl font-extrabold text-[#081633]">
            Tarifas por Ruta
          </h2>
          {rutas.length === 0 ? (
            <div className="rounded-2xl bg-[#edf3fb] p-8 text-center text-sm font-bold text-[#081633]">
              Aún no hay tarifas registradas.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#081633] text-xs uppercase text-white">
                  <tr>
                    <th className="px-4 py-3">Ruta</th>
                    <th className="px-4 py-3">Trayecto</th>
                    <th className="px-4 py-3 text-right">Tarifa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rutas.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-bold text-[#081633]">{r.nombre}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.origen} → {r.destino}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-[#081633]">
                        {r.tarifa !== null ? `$${r.tarifa}` : "Consultar unidad"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* PESTAÑA: HORARIOS */}
      {activeTab === "horarios" && (
        <section className="mx-auto max-w-5xl space-y-4">
          <h2 className="text-xl font-extrabold text-[#081633]">
            Horarios de Servicio
          </h2>
          {horarios.length === 0 ? (
            <div className="rounded-2xl bg-[#edf3fb] p-8 text-center text-sm font-bold text-[#081633]">
              Aún no hay horarios publicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {horarios.map((h) => (
                <div key={h.id} className="rounded-2xl bg-[#edf3fb] p-5 text-[#081633]">
                  <p className="text-base font-extrabold">{h.rutaNombre}</p>
                  <p className="mt-2 text-sm font-bold">
                    {h.horaSalida} hrs — {h.horaLlegada} hrs
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{h.dias}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* PESTAÑA: AYUDA */}
      {activeTab === "ayuda" && (
        <section className="mx-auto max-w-4xl space-y-4">
          <h2 className="text-xl font-extrabold text-[#081633]">
            Centro de Ayuda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#edf3fb] p-5">
              <h3 className="font-extrabold text-[#081633]">
                ¿Cómo fijo mi ruta preferida?
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Entra a <strong>Rutas</strong> y presiona <strong>☆ Guardar</strong> en la unidad que tomas con más frecuencia para verla directo en <strong>Inicio</strong>.
              </p>
            </div>
            <div className="rounded-2xl bg-[#edf3fb] p-5">
              <h3 className="font-extrabold text-[#081633]">
                ¿Perdiste algo en una combi?
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Consulta la sección <strong>Objetos perdidos</strong> en la barra superior para verificar si fue reportado en base.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* PESTAÑAS: CALIFICACIÓN Y COMENTARIOS (/calif-servicio) */}
      {(activeTab === "calificacion" || activeTab === "comentarios") && (
        <section className="mx-auto max-w-xl rounded-3xl bg-[#edf3fb] p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-[#081633]">
            {activeTab === "calificacion"
              ? "Calificación del servicio"
              : "Comentarios y sugerencias"}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Cuéntanos cómo fue tu experiencia viajando en Chapul-Go.
          </p>

          {feedbackMessage && (
            <div className="mt-4 rounded-xl bg-white p-3.5 text-xs font-bold text-[#081633]">
              {feedbackMessage}
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#081633]">
                Puntuación (1 a 5 estrellas)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`h-10 w-10 rounded-xl text-lg font-bold transition ${
                      star <= rating
                        ? "bg-[#081633] text-amber-300"
                        : "bg-white text-slate-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#081633]">
                Tu comentario
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe aquí tu comentario sobre la ruta o el operador..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#081633]"
              />
            </div>

            <button
              type="submit"
              disabled={sendingFeedback}
              className="w-full rounded-xl bg-[#081633] py-3 text-sm font-bold text-white transition hover:bg-[#102654] disabled:opacity-60"
            >
              {sendingFeedback ? "Enviando..." : "Enviar calificación"}
            </button>
          </form>
        </section>
      )}

      {/* PESTAÑA: OBJETOS PERDIDOS (/cosas-per) */}
      {activeTab === "objetos" && (
        <section className="mx-auto max-w-5xl space-y-4">
          <h2 className="text-xl font-extrabold text-[#081633]">
            Objetos perdidos reportados
          </h2>
          {objetosPerdidos.length === 0 ? (
            <div className="rounded-2xl bg-[#edf3fb] p-8 text-center text-sm font-bold text-[#081633]">
              No hay objetos perdidos registrados por el momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {objetosPerdidos.map((obj) => (
                <div
                  key={obj.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#081633]">
                      {obj.nombre}
                    </h3>
                    <span className="rounded-full bg-[#dce8f8] px-2.5 py-0.5 text-[11px] font-bold text-[#081633]">
                      {obj.estado}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{obj.descripcion}</p>
                  <p className="mt-3 text-[11px] font-semibold text-slate-400">
                    Ruta/Unidad: {obj.ruta}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </PublicLayout>
  );
}