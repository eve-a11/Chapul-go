// src/services/calificacionesService.js
import API from "./api";
import { getLoggedUserFromSession } from "./cosasPerService";

const RESENAS_CACHE_KEY = "chapulgo_calif_comentarios";

const readComentariosCache = () => {
  try {
    return JSON.parse(localStorage.getItem(RESENAS_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeComentariosCache = (data) => {
  try {
    localStorage.setItem(RESENAS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignorar error de almacenamiento
  }
};

export const getCalificacionesServicio = async () => {
  const res = await API.get("/calif-servicio");
  const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
  const cache = readComentariosCache();

  return list.map((item) => {
    const id = item.idCalServ ?? item.id;
    const u = item.user || {};
    const h = item.horario || {};
    const nombreCompleto = [u.nombre, u.apellidoP, u.apellidoM]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...item,
      resolvedId: id,
      resolvedUserNombre: nombreCompleto || (u.idUser ? `Usuario #${u.idUser}` : "Pasajero"),
      resolvedHorarioId: h.idHorarios ?? h.idHorario ?? "",
      resolvedFecha: h.fecha ?? "",
      resolvedHoraSalida: h.horaSalida ?? "",
      resolvedCalServicio: Number(item.calServicio || 0),
      resolvedCalChofer: Number(item.calChofer || 0),
      resolvedComentario:
        item.comentario || item.resena || cache[String(id)] || "",
    };
  });
};

export const createCalificacionPublic = async ({
  idHorario,
  calServicio,
  calChofer,
  comentario,
  idUser,
}) => {
  const sessionUser = getLoggedUserFromSession();
  const finalUserId = Number(idUser || sessionUser?.idUser);

  if (!finalUserId || finalUserId <= 0) {
    throw new Error("Debes iniciar sesión para calificar el servicio.");
  }

  // El backend exige calServicio y calChofer como números enteros del 1 al 5
  const basePayload = {
    idUser: finalUserId,
    idHorario: String(idHorario),
    calServicio: Math.round(Number(calServicio)),
    calChofer: Math.round(Number(calChofer)),
  };

  const trimmedComment = String(comentario || "").trim();

  // Intentamos enviar con comentario si existe; si NestJS rechaza la propiedad extra, reintentamos con el payload exacto
  const intentos = trimmedComment
    ? [
        { ...basePayload, comentario: trimmedComment },
        { ...basePayload, resena: trimmedComment },
        basePayload,
      ]
    : [basePayload];

  let lastError;
  for (const payload of intentos) {
    try {
      const res = await API.post("/calif-servicio", payload);
      const createdId = res.data?.idCalServ ?? res.data?.id;
      if (createdId && trimmedComment) {
        const cache = readComentariosCache();
        cache[String(createdId)] = trimmedComment;
        writeComentariosCache(cache);
      }
      return res.data;
    } catch (err) {
      lastError = err;
      const msg = JSON.stringify(err.response?.data?.message || "");
      if (!msg.includes("should not exist")) {
        throw err;
      }
    }
  }

  throw lastError;
};