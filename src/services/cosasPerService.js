import API from "./api";

const COSAS_META_KEY = "chapulgo_cosas_meta";

const readMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(COSAS_META_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeMeta = (data) => {
  try {
    localStorage.setItem(COSAS_META_KEY, JSON.stringify(data));
  } catch {
    // Ignorar error de almacenamiento
  }
};

export const saveCosaMeta = (idCosa, meta) => {
  if (!idCosa) return;
  const cache = readMeta();
  cache[String(idCosa)] = {
    ...(cache[String(idCosa)] || {}),
    ...meta,
  };
  writeMeta(cache);
};

const removeCosaMeta = (idCosa) => {
  if (!idCosa) return;
  const cache = readMeta();
  delete cache[String(idCosa)];
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

export const extractCosaId = (c) =>
  c?.idCosasPer ??
  c?.id_Cosas_Per ??
  c?.id_cosas_per ??
  c?.idCosaPer ??
  c?.id_cosa_per ??
  c?.idObjeto ??
  c?.id;

export const getCosaNombre = (c) =>
  c?.nombre ??
  c?.Nombre ??
  c?.objeto ??
  c?.Objeto ??
  c?.nombreObjeto ??
  c?.articulo ??
  c?.titulo ??
  "";

export const getCosaDescripcion = (c) =>
  c?.descripcion ??
  c?.Descripcion ??
  c?.detalle ??
  c?.caracteristicas ??
  c?.observaciones ??
  "";

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

export const isCosaEntregada = (cosa) => {
  if (!cosa || typeof cosa !== "object") return false;
  const id = extractCosaId(cosa);
  const raw =
    cosa.entregado ??
    cosa.Entregado ??
    cosa.estatus ??
    cosa.Estatus ??
    cosa.estado;

  if (raw === null || raw === undefined) {
    const meta = readMeta();
    if (id !== undefined && id !== null && meta[String(id)]?.entregado !== undefined) {
      return Boolean(meta[String(id)].entregado);
    }
    return false;
  }

  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (typeof raw === "object" && raw.type === "Buffer" && Array.isArray(raw.data)) {
    return raw.data[0] === 1;
  }
  const str = String(raw).toLowerCase().trim();
  return str === "entregado" || str === "devuelto" || str === "1" || str === "true";
};

export const getCosasPerdidas = async () => {
  const res = await API.get("/cosas-per");
  const list = extractList(res);
  const metaCache = readMeta();

  return list.map((c) => {
    const id = extractCosaId(c);
    const cached = id !== undefined && id !== null ? metaCache[String(id)] : null;

    const nombre = getCosaNombre(c) || cached?.nombre || "";
    const descripcion = getCosaDescripcion(c) || cached?.descripcion || "";
    const fecha = extractDateYYYYMMDD(
      c.fecha ?? c.Fecha ?? c.fechaReporte ?? c.fecha_reporte ?? cached?.fecha
    );
    const idVehiculo =
      c.idVehiculo ??
      c.id_Vehiculo ??
      c.id_vehiculo ??
      c.vehiculo?.idVehiculo ??
      c.vehiculo?.id ??
      cached?.idVehiculo ??
      "";
    const idRuta =
      c.idRuta ??
      c.id_Ruta ??
      c.id_ruta ??
      c.ruta?.idRuta ??
      c.ruta?.id ??
      cached?.idRuta ??
      "";

    return {
      ...c,
      resolvedId: id,
      resolvedNombre: nombre || descripcion || `Objeto #${id}`,
      resolvedDescripcion: descripcion,
      resolvedFecha: fecha,
      resolvedLugar: c.lugar ?? c.ubicacion ?? cached?.lugar ?? "",
      resolvedIdVehiculo: idVehiculo ? String(idVehiculo) : "",
      resolvedIdRuta: idRuta ? String(idRuta) : "",
      resolvedEntregado: isCosaEntregada(c),
    };
  });
};

export const createCosaPerdida = async ({
  nombre,
  descripcion,
  fecha,
  lugar,
  idVehiculo,
  idRuta,
}) => {
  const payload = {
    nombre: String(nombre).trim(),
    descripcion: String(descripcion || nombre).trim(),
    fecha: extractDateYYYYMMDD(fecha),
    estatus: false,
    ...(lugar ? { lugar: String(lugar).trim() } : {}),
    ...(idVehiculo ? { idVehiculo: Number(idVehiculo) } : {}),
    ...(idRuta ? { idRuta: Number(idRuta) } : {}),
  };

  let currentPayload = { ...payload };
  let createdData = null;

  // Si NestJS rechaza propiedades no declaradas en el DTO, las depura y reintenta
  for (let intento = 0; intento < 5; intento++) {
    try {
      const res = await API.post("/cosas-per", currentPayload);
      createdData = res.data;
      break;
    } catch (error) {
      const messages = error.response?.data?.message;
      if (error.response?.status === 400 && Array.isArray(messages)) {
        let removedAny = false;
        messages.forEach((msg) => {
          const match = String(msg).match(/property (\w+) should not exist/i);
          if (match && match[1] in currentPayload) {
            delete currentPayload[match[1]];
            removedAny = true;
          }
        });

        // Si el backend usa "objeto" en lugar de "nombre"
        if (
          messages.some((m) => /objeto/i.test(String(m))) &&
          !("objeto" in currentPayload)
        ) {
          currentPayload.objeto = String(nombre).trim();
          removedAny = true;
        }

        if (removedAny) continue;
      }
      throw error;
    }
  }

  let newId =
    extractCosaId(createdData?.data) ?? extractCosaId(createdData);

  if (!newId) {
    const allRes = await API.get("/cosas-per");
    const all = extractList(allRes);
    if (all.length > 0) {
      const latest = all.reduce((max, curr) =>
        Number(extractCosaId(curr) || 0) > Number(extractCosaId(max) || 0)
          ? curr
          : max
      );
      newId = extractCosaId(latest);
    }
  }

  if (newId) {
    saveCosaMeta(newId, {
      nombre: String(nombre).trim(),
      descripcion: String(descripcion || "").trim(),
      fecha: extractDateYYYYMMDD(fecha),
      lugar: String(lugar || "").trim(),
      idVehiculo: idVehiculo ? String(idVehiculo) : "",
      idRuta: idRuta ? String(idRuta) : "",
      entregado: false,
    });
  }

  return createdData;
};

export const toggleCosaEntregada = async (cosa, nuevoEntregado) => {
  const id = typeof cosa === "object" ? extractCosaId(cosa) : cosa;
  if (!id) throw new Error("ID de objeto perdido no válido.");

  const boolVal = Boolean(nuevoEntregado);
  const numVal = boolVal ? 1 : 0;

  const intentos = [
    () => API.patch(`/cosas-per/${id}`, { estatus: boolVal }),
    () => API.patch(`/cosas-per/${id}`, { estatus: numVal }),
    () => API.patch(`/cosas-per/${id}`, { entregado: boolVal }),
    () => API.put(`/cosas-per/${id}`, { estatus: boolVal }),
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

  saveCosaMeta(id, { entregado: boolVal });
  return { id, entregado: boolVal };
};

export const deleteCosaPerdida = async (idCosa) => {
  const res = await API.delete(`/cosas-per/${idCosa}`);
  removeCosaMeta(idCosa);
  return res.data;
};