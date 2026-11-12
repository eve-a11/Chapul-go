import API from "./api";

const RUTAS_META_KEY = "chapulgo_rutas_meta";

const readMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(RUTAS_META_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeMeta = (data) => {
  try {
    localStorage.setItem(RUTAS_META_KEY, JSON.stringify(data));
  } catch {
    // Ignorar error de almacenamiento
  }
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

export const extractRutaId = (r) =>
  r?.idRuta ?? r?.id_Ruta ?? r?.id_ruta ?? r?.rutaId ?? r?.id;

export const getRutaNombre = (r) =>
  r?.nombreRuta ??
  r?.Nombre_Ruta ??
  r?.nombre_ruta ??
  r?.Nombre ??
  r?.nombre ??
  "";

export const getRutaDistancia = (r) =>
  r?.distancia ?? r?.Distancia ?? 0;

export const getRutaTiempo = (r) =>
  r?.tiempoEstimado ??
  r?.Tiempo_Estimado ??
  r?.tiempo_estimado ??
  r?.TiempoEstimado ??
  "00:00:00";

export const extractParadaId = (p) =>
  p?.idParada ?? p?.id_Parada ?? p?.id_parada ?? p?.paradaId ?? p?.id;

export const extractTarifaId = (t) =>
  t?.idTarifa ?? t?.id_Tarifa ?? t?.id_tarifa ?? t?.tarifaId ?? t?.id;

export const isRutaActiva = (rutaOrEstatus) => {
  if (
    rutaOrEstatus &&
    typeof rutaOrEstatus === "object" &&
    rutaOrEstatus.type !== "Buffer"
  ) {
    const id = extractRutaId(rutaOrEstatus);
    const raw =
      rutaOrEstatus.Estatus ??
      rutaOrEstatus.estatus ??
      rutaOrEstatus.estado;

    if (raw === null || raw === undefined) {
      const meta = readMeta();
      if (id !== undefined && id !== null && meta.estatus?.[String(id)] !== undefined) {
        return meta.estatus[String(id)];
      }
      return true;
    }
    return isRutaActiva(raw);
  }

  const estatus = rutaOrEstatus;
  if (estatus === null || estatus === undefined) return true;
  if (typeof estatus === "boolean") return estatus;
  if (typeof estatus === "number") return estatus === 1;
  if (
    typeof estatus === "object" &&
    estatus.type === "Buffer" &&
    Array.isArray(estatus.data)
  ) {
    return estatus.data[0] === 1;
  }
  const str = String(estatus).toLowerCase();
  return str === "activo" || str === "activa" || str === "1" || str === "true";
};

// ==================== RUTAS ====================
export const getRutas = async () => {
  const res = await API.get("/rutas");
  return extractList(res);
};

export const createRuta = async ({ nombreRuta, distancia, tiempoEstimado }) => {
  const payload = {
    nombreRuta: String(nombreRuta).trim(),
    distancia: Number(distancia),
    tiempoEstimado: String(tiempoEstimado).trim(),
  };

  const res = await API.post("/rutas", payload);
  return res.data;
};

export const updateRutaEstatus = async (ruta, nuevoEstatus) => {
  const id = typeof ruta === "object" ? extractRutaId(ruta) : ruta;
  if (!id) throw new Error("ID de ruta no válido.");

  const boolVal = Boolean(nuevoEstatus);
  const numVal = boolVal ? 1 : 0;

  const fullBase =
    typeof ruta === "object"
      ? {
          nombreRuta: getRutaNombre(ruta),
          distancia: Number(getRutaDistancia(ruta)),
          tiempoEstimado: String(getRutaTiempo(ruta)),
        }
      : {};

  const intentos = [
    () => API.patch(`/rutas/${id}`, { estatus: boolVal }),
    () => API.patch(`/rutas/${id}`, { estatus: numVal }),
    () => API.patch(`/rutas/${id}`, fullBase),
    () => API.put(`/rutas/${id}`, fullBase),
  ];

  let lastError = null;
  for (const ejecutar of intentos) {
    try {
      const res = await ejecutar();
      const meta = readMeta();
      meta.estatus = { ...(meta.estatus || {}), [String(id)]: boolVal };
      writeMeta(meta);
      return res.data;
    } catch (err) {
      lastError = err;
      const st = err.response?.status;
      if (st === 401 || st === 403 || st >= 500) break;
    }
  }

  // Guardar preferencia local si el DTO del backend no expone el campo estatus
  const meta = readMeta();
  meta.estatus = { ...(meta.estatus || {}), [String(id)]: boolVal };
  writeMeta(meta);
  return { idRuta: id, estatus: boolVal };
};

export const deleteRuta = async (idRuta) => {
  const res = await API.delete(`/rutas/${idRuta}`);
  return res.data;
};

// ==================== PARADAS ====================
export const getParadas = async () => {
  try {
    const res = await API.get("/paradas");
    return extractList(res);
  } catch {
    return [];
  }
};

export const createParada = async (paradaData) => {
  const payload = {
    nombre: paradaData.nombre,
    ...(paradaData.ubicacion ? { ubicacion: paradaData.ubicacion } : {}),
    ...(paradaData.orden ? { orden: Number(paradaData.orden) } : {}),
    ...(paradaData.idRuta ? { idRuta: Number(paradaData.idRuta) } : {}),
  };
  const res = await API.post("/paradas", payload);
  return res.data;
};

export const deleteParada = async (idParada) => {
  const res = await API.delete(`/paradas/${idParada}`);
  return res.data;
};

// ==================== TARIFAS Y R-TARIFA-RUTA ====================
export const getTarifas = async () => {
  try {
    const res = await API.get("/tarifas");
    return extractList(res);
  } catch {
    return [];
  }
};

export const createTarifa = async (tarifaData) => {
  const montoNum = Number(tarifaData.monto);
  const payload = {
    nombre: tarifaData.nombre,
    tipo: tarifaData.nombre,
    monto: montoNum,
    precio: montoNum,
  };

  try {
    const res = await API.post("/tarifas", payload);
    return res.data;
  } catch (error) {
    if (error.response?.status === 400) {
      const res = await API.post("/tarifas", {
        tipo: tarifaData.nombre,
        monto: montoNum,
      });
      return res.data;
    }
    throw error;
  }
};

export const deleteTarifa = async (idTarifa) => {
  const res = await API.delete(`/tarifas/${idTarifa}`);
  return res.data;
};

export const getTarifasRutas = async () => {
  try {
    const res = await API.get("/r-tarifa-ruta");
    return extractList(res);
  } catch {
    return [];
  }
};

export const asignarTarifaRuta = async ({ idRuta, idTarifa }) => {
  const payload = {
    idRuta: Number(idRuta),
    idTarifa: Number(idTarifa),
  };
  const res = await API.post("/r-tarifa-ruta", payload);
  return res.data;
};

export const deleteTarifaRuta = async (idRelacion) => {
  const res = await API.delete(`/r-tarifa-ruta/${idRelacion}`);
  return res.data;
};