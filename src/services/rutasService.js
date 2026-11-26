import API from "./api";

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
  r?.idRuta ?? r?.Id_Ruta ?? r?.id_ruta ?? r?.id ?? "";

export const getRutaNombre = (r) =>
  r?.nombreRuta ?? r?.Nombre_Ruta ?? r?.nombre_ruta ?? r?.nombre ?? "";

export const isRutaActiva = (r) => {
  const val = r?.estatus ?? r?.Estatus;
  if (val === null || val === undefined) return true;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) {
    return val.data[0] === 1;
  }
  return String(val).toLowerCase() === "true" || String(val) === "1";
};

const formatTiempoEstimado = (raw) => {
  const str = String(raw || "00:30:00").trim();
  if (/^\d{2}:\d{2}$/.test(str)) return `${str}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(str)) return str;
  return "00:30:00";
};

// ==================== RUTAS (/rutas) ====================
export const getRutas = async () => {
  const res = await API.get("/rutas");
  return extractList(res).map((r, idx) => ({
    ...r,
    resolvedId: extractRutaId(r) || idx + 1,
    resolvedNombre: getRutaNombre(r) || `Ruta #${idx + 1}`,
    resolvedDistancia: Number(r.distancia ?? r.Distancia ?? 0),
    resolvedTiempo: r.tiempoEstimado ?? r.Tiempo_Estimado ?? "—",
  }));
};

export const createRuta = async ({ nombreRuta, distancia, tiempoEstimado }) => {
  const payload = {
    nombreRuta: String(nombreRuta).trim(),
    distancia: Number(distancia),
    tiempoEstimado: formatTiempoEstimado(tiempoEstimado),
  };

  try {
    const res = await API.post("/rutas", payload);
    return res.data;
  } catch (error) {
    const msgs = error.response?.data?.message;
    if (error.response?.status === 400 && Array.isArray(msgs)) {
      const res = await API.post("/rutas", {
        nombre_ruta: payload.nombreRuta,
        distancia: payload.distancia,
        tiempo_estimado: payload.tiempoEstimado,
      });
      return res.data;
    }
    throw error;
  }
};

export const deleteRuta = async (idRuta) => {
  const res = await API.delete(`/rutas/${idRuta}`);
  return res.data;
};

// ==================== PARADAS (/paradas) ====================
export const getParadas = async () => {
  const res = await API.get("/paradas");
  return extractList(res).map((p, idx) => ({
    ...p,
    resolvedId: p.idParada ?? p.Id_Parada ?? p.id_parada ?? p.id ?? idx + 1,
    resolvedNombre: p.nombre ?? p.Nombre ?? "Sin nombre",
    resolvedValor: Number(p.valor ?? p.Valor ?? 1),
    resolvedIdRuta: p.idRuta ?? p.Id_Ruta ?? p.ruta?.idRuta ?? "",
  }));
};

export const createParada = async ({ nombre, valor, idRuta }) => {
  const valorEntero = parseInt(valor, 10);
  const payload = {
    nombre: String(nombre).trim(),
    valor: Number.isInteger(valorEntero) && valorEntero > 0 ? valorEntero : 1,
    estatus: true,
    idRuta: Number(idRuta),
  };

  try {
    const res = await API.post("/paradas", payload);
    return res.data;
  } catch (error) {
    const msgs = error.response?.data?.message;
    if (error.response?.status === 400 && Array.isArray(msgs)) {
      if (msgs.some((m) => /estatus/i.test(String(m)))) {
        const res = await API.post("/paradas", { ...payload, estatus: 1 });
        return res.data;
      }
      if (msgs.some((m) => /idRuta/i.test(String(m)))) {
        const res = await API.post("/paradas", {
          nombre: payload.nombre,
          valor: payload.valor,
          estatus: payload.estatus,
          id_ruta: payload.idRuta,
        });
        return res.data;
      }
    }
    throw error;
  }
};

export const deleteParada = async (idParada) => {
  const res = await API.delete(`/paradas/${idParada}`);
  return res.data;
};

// ==================== TARIFAS (/tarifas y /r-tarifa-ruta) ====================
export const getTarifas = async () => {
  const res = await API.get("/tarifas");
  return extractList(res).map((t, idx) => ({
    ...t,
    resolvedId: t.idTarifa ?? t.Id_Tarifa ?? t.id_tarifa ?? t.id ?? idx + 1,
    resolvedNombre: t.nombre ?? t.Nombre ?? `Tarifa #${idx + 1}`,
    resolvedCosto: Number(t.costo ?? t.Costo ?? 0),
    resolvedDescripcion: t.descripcion ?? t.Descripcion ?? "—",
  }));
};

export const createTarifa = async ({ nombre, costo, descripcion }) => {
  const payload = {
    nombre: String(nombre).trim(),
    costo: Number(costo),
    descripcion: String(descripcion || nombre).trim(),
    estatus: true,
  };

  try {
    const res = await API.post("/tarifas", payload);
    return res.data;
  } catch (error) {
    const msgs = error.response?.data?.message;
    if (
      error.response?.status === 400 &&
      Array.isArray(msgs) &&
      msgs.some((m) => /estatus/i.test(String(m)))
    ) {
      const res = await API.post("/tarifas", { ...payload, estatus: 1 });
      return res.data;
    }
    throw error;
  }
};

export const deleteTarifa = async (idTarifa) => {
  const res = await API.delete(`/tarifas/${idTarifa}`);
  return res.data;
};

export const getTarifaRutas = async () => {
  try {
    const res = await API.get("/r-tarifa-ruta");
    return extractList(res).map((item, idx) => ({
      ...item,
      resolvedId: item.idRTR ?? item.Id_RTR ?? item.id ?? idx + 1,
      resolvedIdTarifa: item.idTarifa ?? item.Id_Tarifa ?? item.tarifa?.idTarifa ?? "",
      resolvedIdRuta: item.idRuta ?? item.Id_Ruta ?? item.ruta?.idRuta ?? "",
    }));
  } catch {
    return [];
  }
};

export const assignTarifaRuta = async ({ idTarifa, idRuta }) => {
  const res = await API.post("/r-tarifa-ruta", {
    idTarifa: Number(idTarifa),
    idRuta: Number(idRuta),
  });
  return res.data;
};

export const removeTarifaRuta = async (idRTR) => {
  const res = await API.delete(`/r-tarifa-ruta/${idRTR}`);
  return res.data;
};