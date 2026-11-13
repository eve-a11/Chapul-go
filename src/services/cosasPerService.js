import API from "./api";

const COSAS_SEGUIMIENTO_KEY = "chapulgo_cosas_seguimiento";

const readSeguimientoCache = () => {
  try {
    return JSON.parse(localStorage.getItem(COSAS_SEGUIMIENTO_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeSeguimientoCache = (data) => {
  try {
    localStorage.setItem(COSAS_SEGUIMIENTO_KEY, JSON.stringify(data));
  } catch {
    // Ignorar error de almacenamiento
  }
};

const removeSeguimientoCache = (idCosa) => {
  if (!idCosa) return;
  const cache = readSeguimientoCache();
  delete cache[String(idCosa)];
  writeSeguimientoCache(cache);
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

export const extractCosaId = (c) =>
  c?.idCosasPerd ??
  c?.idCosasPer ??
  c?.id_Cosas_Per ??
  c?.id_cosas_per ??
  c?.id;

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

// Detecta automáticamente el usuario logueado desde localStorage / JWT (listo para la vista Public)
export const getLoggedUserFromSession = () => {
  try {
    const rawUser = localStorage.getItem("user") || localStorage.getItem("usuario");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const id = parsed.idUser ?? parsed.id_User ?? parsed.id_user ?? parsed.id;
      if (id && Number(id) > 0) {
        return {
          idUser: Number(id),
          nombre: [parsed.nombre, parsed.apellidoP, parsed.apellidoM]
            .filter(Boolean)
            .join(" "),
        };
      }
    }

    const token = localStorage.getItem("token");
    if (token && token.split(".").length === 3) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = payload.idUser ?? payload.id ?? payload.sub;
      if (id && Number(id) > 0) {
        return {
          idUser: Number(id),
          nombre: payload.nombre || payload.correo || `Usuario #${id}`,
        };
      }
    }
  } catch {
    // Ignorar error de lectura
  }
  return null;
};

const normalizeEstado = (rawEstado, cachedEstado) => {
  if (cachedEstado) return cachedEstado; // "pendiente" | "seguimiento" | "entregado"
  if (rawEstado === true || rawEstado === 1 || rawEstado === "entregado") {
    return "entregado";
  }
  return "pendiente";
};

export const getCosasPerdidas = async () => {
  const res = await API.get("/cosas-per");
  const list = extractList(res);
  const segCache = readSeguimientoCache();

  return list.map((c) => {
    const id = extractCosaId(c);
    const cached = id !== undefined && id !== null ? segCache[String(id)] : null;

    // Extraer datos del objeto anidado user
    const u = c.user && typeof c.user === "object" ? c.user : {};
    const userId = u.idUser ?? c.idUser ?? "";
    const userFullName = [u.nombre, u.apellidoP, u.apellidoM]
      .filter(Boolean)
      .join(" ")
      .trim();

    // Extraer datos del objeto anidado horario
    const h = c.horario && typeof c.horario === "object" ? c.horario : {};
    const horarioId = h.idHorarios ?? c.idHorarios ?? "";
    const horarioFecha = extractDateYYYYMMDD(h.fecha ?? c.fecha);
    const horaSalida = h.horaSalida ?? "";
    const horaLlegada = h.horaLlegada ?? "";

    const rawEstado = c.estatus ?? c.Estatus ?? c.entregado ?? c.estado;
    const estado = normalizeEstado(rawEstado, cached?.estado);

    return {
      ...c,
      resolvedId: id,
      resolvedDescripcion: String(c.descripcion ?? c.Descripcion ?? "Sin descripción"),
      resolvedUserId: userId ? String(userId) : "",
      resolvedUserNombre: userFullName || (userId ? `Usuario #${userId}` : "Anónimo"),
      resolvedHorarioId: horarioId ? String(horarioId) : "",
      resolvedFecha: horarioFecha,
      resolvedHoraSalida: horaSalida,
      resolvedHoraLlegada: horaLlegada,
      resolvedEstado: estado, // "pendiente" | "seguimiento" | "entregado"
      resolvedNota: cached?.nota || "",
      resolvedUpdatedAt: cached?.updatedAt || "",
    };
  });
};

// Función exclusiva para usar más adelante en el portal Public cuando un usuario inicie sesión
export const createCosaPerdidaPublic = async ({ descripcion, idHorarios, idUser }) => {
  const sessionUser = getLoggedUserFromSession();
  const finalUserId = Number(idUser || sessionUser?.idUser);

  if (!finalUserId || finalUserId <= 0) {
    throw new Error("Debes iniciar sesión para reportar un objeto perdido.");
  }

  const payload = {
    descripcion: String(descripcion).trim(),
    idUser: finalUserId,
    idHorarios: String(idHorarios),
  };

  const res = await API.post("/cosas-per", payload);
  return res.data;
};

export const updateSeguimientoCosa = async (idCosa, { estado, nota }) => {
  if (!idCosa) throw new Error("ID de reporte no válido.");

  const boolEntregado = estado === "entregado";
  const intentos = [
    () => API.patch(`/cosas-per/${idCosa}`, { estatus: boolEntregado }),
    () => API.patch(`/cosas-per/${idCosa}`, { estatus: boolEntregado ? 1 : 0 }),
  ];

  for (const ejecutar of intentos) {
    try {
      await ejecutar();
      break;
    } catch (err) {
      const st = err.response?.status;
      if (st === 401 || st === 403 || st >= 500) throw err;
    }
  }

  const cache = readSeguimientoCache();
  cache[String(idCosa)] = {
    estado,
    nota: String(nota || "").trim(),
    updatedAt: new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
  writeSeguimientoCache(cache);
  return cache[String(idCosa)];
};

export const deleteCosaPerdida = async (idCosa) => {
  const res = await API.delete(`/cosas-per/${idCosa}`);
  removeSeguimientoCache(idCosa);
  return res.data;
};