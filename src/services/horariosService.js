import API from "./api";

const HORARIOS_META_KEY = "chapulgo_horarios_meta";

const readMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(HORARIOS_META_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeMeta = (data) => {
  try {
    localStorage.setItem(HORARIOS_META_KEY, JSON.stringify(data));
  } catch {
    // Ignorar si localStorage no está disponible
  }
};

export const saveHorarioMeta = (idHorario, meta) => {
  if (!idHorario) return;
  const cache = readMeta();
  cache[String(idHorario)] = {
    ...(cache[String(idHorario)] || {}),
    ...meta,
  };
  writeMeta(cache);
};

const removeHorarioMeta = (idHorario) => {
  if (!idHorario) return;
  const cache = readMeta();
  delete cache[String(idHorario)];
  writeMeta(cache);
};

const extractList = (res) => {
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    const firstArray = Object.values(payload).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  return [];
};

export const extractHorarioId = (h) =>
  h?.idHorarios ??
  h?.id_Horarios ??
  h?.id_horarios ??
  h?.idHorario ??
  h?.id_horario ??
  h?.id;

export const normalizeTimeHHMMSS = (timeStr) => {
  const clean = String(timeStr || "").trim();
  if (/^\d{2}:\d{2}$/.test(clean)) return `${clean}:00`;
  if (/^\d{1}:\d{2}$/.test(clean)) return `0${clean}:00`;
  if (/^\d{1}:\d{2}:\d{2}$/.test(clean)) return `0${clean}`;
  return clean;
};

export const extractDateYYYYMMDD = (rawFecha) => {
  if (!rawFecha) return "";
  const str = String(rawFecha).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : str;
};

export const formatFechaLegible = (rawFecha) => {
  const ymd = extractDateYYYYMMDD(rawFecha);
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || "—";
  const [y, m, d] = ymd.split("-");
  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${d} ${meses[Number(m) - 1] || m} ${y}`;
};

export const getHorarios = async () => {
  const res = await API.get("/horarios");
  const list = extractList(res);
  const metaCache = readMeta();

  return list.map((h) => {
    const id = extractHorarioId(h);
    const cached = id !== undefined && id !== null ? metaCache[String(id)] : null;

    const idRuta =
      h.idRuta ?? h.id_Ruta ?? h.id_ruta ?? h.ruta?.idRuta ?? h.ruta?.id ?? cached?.idRuta ?? "";
    const idVehiculo =
      h.idVehiculo ??
      h.id_Vehiculo ??
      h.id_vehiculo ??
      h.vehiculo?.idVehiculo ??
      h.vehiculo?.id ??
      cached?.idVehiculo ??
      "";

    return {
      ...h,
      resolvedId: id,
      resolvedHoraSalida: h.horaSalida ?? h.hora_salida ?? "00:00:00",
      resolvedHoraLlegada: h.horaLlegada ?? h.hora_llegada ?? "00:00:00",
      resolvedFecha: extractDateYYYYMMDD(h.fecha ?? h.Fecha),
      resolvedIdRuta: idRuta ? String(idRuta) : "",
      resolvedIdVehiculo: idVehiculo ? String(idVehiculo) : "",
    };
  });
};

export const createHorario = async ({
  horaSalida,
  horaLlegada,
  fecha,
  idRuta,
  idVehiculo,
}) => {
  const basePayload = {
    horaSalida: normalizeTimeHHMMSS(horaSalida),
    horaLlegada: normalizeTimeHHMMSS(horaLlegada),
    fecha: extractDateYYYYMMDD(fecha),
  };

  const fullPayload = {
    ...basePayload,
    ...(idRuta ? { idRuta: Number(idRuta) } : {}),
    ...(idVehiculo ? { idVehiculo: Number(idVehiculo) } : {}),
  };

  let createdData = null;

  try {
    const res = await API.post("/horarios", fullPayload);
    createdData = res.data;
  } catch (error) {
    // Si ValidationPipe rechaza campos extra (idRuta/idVehiculo), enviar solo los 3 campos base
    if (error.response?.status === 400 && (idRuta || idVehiculo)) {
      const res = await API.post("/horarios", basePayload);
      createdData = res.data;
    } else {
      throw error;
    }
  }

  // Vincular ruta y unidad al ID recién creado
  let newId =
    extractHorarioId(createdData?.data) ?? extractHorarioId(createdData);

  if (!newId) {
    const allRes = await API.get("/horarios");
    const all = extractList(allRes);
    if (all.length > 0) {
      const latest = all.reduce((max, curr) =>
        Number(extractHorarioId(curr) || 0) > Number(extractHorarioId(max) || 0)
          ? curr
          : max
      );
      newId = extractHorarioId(latest);
    }
  }

  if (newId && (idRuta || idVehiculo)) {
    saveHorarioMeta(newId, {
      ...(idRuta ? { idRuta: String(idRuta) } : {}),
      ...(idVehiculo ? { idVehiculo: String(idVehiculo) } : {}),
    });
  }

  return createdData;
};

export const deleteHorario = async (idHorario) => {
  const res = await API.delete(`/horarios/${idHorario}`);
  removeHorarioMeta(idHorario);
  return res.data;
};