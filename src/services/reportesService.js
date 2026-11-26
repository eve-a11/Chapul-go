// src/services/reportesService.js
import API from "./api";

const extractList = (res) => {
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (Array.isArray(payload.results)) return payload.results;
    const firstArray = Object.values(payload).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  return [];
};

const pickValue = (obj, candidates) => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  const normalizedMap = new Map();
  Object.keys(obj).forEach((k) => {
    normalizedMap.set(k.toLowerCase().replace(/_/g, ""), obj[k]);
  });
  for (const key of candidates) {
    const norm = key.toLowerCase().replace(/_/g, "");
    const val = normalizedMap.get(norm);
    if (val !== undefined && val !== null && val !== "") {
      return val;
    }
  }
  return undefined;
};

// Busca automáticamente dentro de un registro cualquier objeto hijo o ID que coincida con un patrón de nombre
const findRelatedEntity = (record, keywords) => {
  if (!record || typeof record !== "object") return { obj: null, id: "" };
  let foundObj = null;
  let foundId = "";

  for (const [key, val] of Object.entries(record)) {
    const low = key.toLowerCase();
    if (!keywords.some((kw) => low.includes(kw))) continue;

    if (val && typeof val === "object" && !Array.isArray(val)) {
      foundObj = val;
      const innerId = pickValue(val, [
        "id",
        "idUser",
        "idSueldo",
        "idParada",
        "idHorario",
        "idHorarios",
      ]);
      if (innerId !== undefined) foundId = String(innerId);
    } else if (
      val !== null &&
      val !== undefined &&
      val !== "" &&
      (typeof val === "number" || typeof val === "string")
    ) {
      if (!foundId) foundId = String(val);
    }
  }
  return { obj: foundObj, id: foundId };
};

export const toSafeText = (val, fallback = "—") => {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "object") {
    if (val.type === "Buffer" && Array.isArray(val.data)) {
      return val.data[0] === 1 ? "Activo" : "Inactivo";
    }
    return fallback;
  }
  return String(val);
};

export const extractDateYYYYMMDD = (rawFecha) => {
  if (!rawFecha) return "";
  const str = String(rawFecha).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : str;
};

export const extractHoraHHMMSS = (rawFechaHora) => {
  if (!rawFechaHora) return "—";
  const str = String(rawFechaHora).trim();
  const match = str.match(/(\d{2}:\d{2}:\d{2})/);
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

export const formatCurrency = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "$0.00";
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};

const formatUserObj = (u) => {
  if (!u || typeof u !== "object") return "";
  const nombre = pickValue(u, ["nombre", "name", "nombres", "primerNombre"]);
  const apP = pickValue(u, ["apellidoP", "apellidoPaterno", "apellido", "lastName"]);
  const apM = pickValue(u, ["apellidoM", "apellidoMaterno"]);
  const full = [nombre, apP, apM].filter(Boolean).join(" ").trim();
  if (full) return full;
  const email = pickValue(u, ["correo", "email"]);
  return email ? String(email) : "";
};

// ==================== CARGA INTEGRAL DE REPORTES Y CATÁLOGOS ====================
export const getAllReportesData = async () => {
  const [
    pagosRes,
    califRes,
    chequeosRes,
    sueldosRes,
    usersRes,
    horariosRes,
    paradasRes,
  ] = await Promise.all([
    API.get("/pagos").catch(() => ({ data: [] })),
    API.get("/calif-servicio").catch(() => ({ data: [] })),
    API.get("/chequeov").catch(() => ({ data: [] })),
    API.get("/sueldo").catch(() => ({ data: [] })),
    API.get("/users").catch(() => ({ data: [] })),
    API.get("/horarios").catch(() => ({ data: [] })),
    API.get("/paradas").catch(() => ({ data: [] })),
  ]);

  const rawUsers = extractList(usersRes);
  const rawHorarios = extractList(horariosRes);
  const rawParadas = extractList(paradasRes);
  const rawSueldos = extractList(sueldosRes);

  // Mapas de búsqueda rápida por ID
  const usersMap = new Map();
  rawUsers.forEach((u, idx) => {
    const id = pickValue(u, ["idUser", "idUsuario", "userId", "id"]) ?? idx + 1;
    usersMap.set(String(id), formatUserObj(u) || `Usuario #${id}`);
  });

  const horariosMap = new Map();
  rawHorarios.forEach((h) => {
    const id = pickValue(h, ["idHorarios", "idHorario", "horarioId", "id"]);
    if (id !== undefined && id !== null) {
      horariosMap.set(String(id), {
        id: String(id),
        fecha: extractDateYYYYMMDD(pickValue(h, ["fecha", "fechaSalida"])),
        salida: pickValue(h, ["horaSalida", "salida", "hora"]) || "",
        llegada: pickValue(h, ["horaLlegada", "llegada"]) || "",
      });
    }
  });

  const paradasMap = new Map();
  rawParadas.forEach((p) => {
    const id = pickValue(p, ["idParada", "paradaId", "id"]);
    if (id !== undefined && id !== null) {
      paradasMap.set(
        String(id),
        toSafeText(pickValue(p, ["nombre", "nombreParada"]), `Parada #${id}`)
      );
    }
  });

  const sueldosMap = new Map();
  const sueldos = rawSueldos.map((s, idx) => {
    const id = pickValue(s, ["idSueldo", "sueldoId", "id"]) ?? idx + 1;
    const nombre = toSafeText(
      pickValue(s, ["nombre", "nombreSueldo", "puesto"]),
      `Tabulador #${id}`
    );
    const descripcion = toSafeText(pickValue(s, ["descripcion", "detalle"]), "—");
    const monto = Number(pickValue(s, ["monto", "salario", "cantidad", "importe"]) ?? 0);
    const tipo = toSafeText(
      pickValue(s, ["tipoSueldo", "tipo", "periodicidad"]),
      "Base"
    );

    const parsed = {
      ...s,
      resolvedId: id,
      resolvedNombre: nombre,
      resolvedDescripcion: descripcion,
      resolvedMonto: isNaN(monto) ? 0 : monto,
      resolvedTipo: tipo,
    };
    sueldosMap.set(String(id), parsed);
    return parsed;
  });

  // 1. Pagos de Nómina (/pagos)
  const pagos = extractList(pagosRes).map((p, idx) => {
    const id = pickValue(p, ["idPago", "pagoId", "id"]) ?? idx + 1;

    const userRel = findRelatedEntity(p, ["user", "usuario", "empleado", "chofer"]);
    const userId = userRel.id;
    const empleado =
      formatUserObj(userRel.obj) ||
      (typeof p.empleado === "string" ? p.empleado : "") ||
      (userId ? usersMap.get(userId) || `Empleado #${userId}` : "") ||
      (rawUsers[idx] ? formatUserObj(rawUsers[idx]) : "Personal");

    const descripcion = toSafeText(
      pickValue(p, ["descripcion", "concepto", "observacion"]),
      "Nómina"
    );

    const sueldoRel = findRelatedEntity(p, ["sueldo", "tabulador", "salario"]);
    const sueldoId = sueldoRel.id;
    let sueldoRef = sueldoRel.obj || (sueldoId ? sueldosMap.get(sueldoId) : null);

    if (!sueldoRef && sueldos.length > 0) {
      const descLow = descripcion.toLowerCase();
      sueldoRef =
        sueldos.find(
          (s) =>
            descLow.includes(s.resolvedNombre.toLowerCase()) ||
            descLow.includes(s.resolvedTipo.toLowerCase())
        ) || sueldos[0];
    }

    const monto = Number(
      pickValue(p, ["monto", "total", "importe", "cantidad"]) ??
        sueldoRef?.resolvedMonto ??
        (sueldoRef ? pickValue(sueldoRef, ["monto", "salario", "cantidad"]) : undefined) ??
        0
    );

    const tabuladorNombre = toSafeText(
      sueldoRef?.resolvedNombre ??
        (sueldoRef ? pickValue(sueldoRef, ["nombre", "nombreSueldo"]) : undefined),
      sueldoId ? `Tabulador #${sueldoId}` : "Nómina"
    );

    const fecha = extractDateYYYYMMDD(
      pickValue(p, ["fechaPago", "fecha", "createdAt"])
    );
    const metodo = toSafeText(
      pickValue(p, ["metodoPago", "metodo", "formaPago"]),
      "Transferencia"
    );
    const estado = toSafeText(pickValue(p, ["estado", "estatus"]), "Pagado");

    return {
      ...p,
      resolvedId: id,
      resolvedUserId: userId,
      resolvedEmpleado: empleado,
      resolvedTabulador: tabuladorNombre,
      resolvedDescripcion: descripcion,
      resolvedMonto: isNaN(monto) ? 0 : monto,
      resolvedFecha: fecha,
      resolvedMetodo: metodo,
      resolvedEstado: estado,
    };
  });

  // 2. Calificación de Servicio (/calif-servicio)
  const calificaciones = extractList(califRes).map((c, idx) => {
    const id =
      pickValue(c, ["idCalServ", "idCalifServicio", "idCalificacion", "id"]) ?? idx + 1;

    const calServicio = Number(
      pickValue(c, ["calServicio", "calificacionServicio", "puntuacion", "calificacion"]) ?? 0
    );
    const calChofer = Number(
      pickValue(c, ["calChofer", "calificacionChofer", "colChofer", "calConductor"]) ?? 0
    );

    const userRel = findRelatedEntity(c, ["user", "usuario", "pasajero"]);
    const pasajero =
      formatUserObj(userRel.obj) ||
      (userRel.id ? usersMap.get(userRel.id) || `Pasajero #${userRel.id}` : "Pasajero");

    const horRel = findRelatedEntity(c, ["horario"]);
    const horarioId = horRel.id;
    const hRef = horRel.obj
      ? {
          fecha: extractDateYYYYMMDD(pickValue(horRel.obj, ["fecha"])),
          salida: pickValue(horRel.obj, ["horaSalida", "salida"]),
          llegada: pickValue(horRel.obj, ["horaLlegada", "llegada"]),
        }
      : horariosMap.get(horarioId);

    const fecha =
      hRef?.fecha || extractDateYYYYMMDD(pickValue(c, ["fecha", "createdAt"]));
    const horarioLabel = horarioId
      ? `Corrida #${horarioId}${
          hRef?.salida ? ` (${hRef.salida} → ${hRef.llegada || ""})` : ""
        }`
      : "General";

    return {
      ...c,
      resolvedId: id,
      resolvedPasajero: pasajero,
      resolvedCalServicio: isNaN(calServicio)
        ? 0
        : Math.min(5, Math.max(0, calServicio)),
      resolvedCalChofer: isNaN(calChofer)
        ? 0
        : Math.min(5, Math.max(0, calChofer)),
      resolvedHorario: horarioLabel,
      resolvedFecha: fecha,
    };
  });

  // 3. Chequeo de Vuelta (/chequeov)
  const paradasList = Array.from(paradasMap.values());
  const horariosList = rawHorarios.map((h, idx) => {
    const id = pickValue(h, ["idHorarios", "idHorario", "horarioId", "id"]) ?? idx + 1;
    const uRel = findRelatedEntity(h, ["user", "usuario", "chofer", "operador"]);
    const uName =
      formatUserObj(uRel.obj) ||
      (uRel.id ? usersMap.get(uRel.id) : "") ||
      "";
    return {
      id: String(id),
      fecha: extractDateYYYYMMDD(pickValue(h, ["fecha", "fechaSalida"])),
      salida: pickValue(h, ["horaSalida", "salida", "hora"]) || "",
      llegada: pickValue(h, ["horaLlegada", "llegada"]) || "",
      chofer: uName,
    };
  });

  const empleadosNombres = Array.from(usersMap.values()).filter(
    (n) => n && !n.toLowerCase().includes("superadmin")
  );

  const chequeos = extractList(chequeosRes).map((ch, idx) => {
    const id = pickValue(ch, ["idChequeov", "idChequeo", "id"]) ?? idx + 1;

    const rawHora = pickValue(ch, ["hora", "fechaHora", "createdAt"]) ?? "";
    const fecha = extractDateYYYYMMDD(rawHora);
    const hora = extractHoraHHMMSS(rawHora);

    // 1) Parada (directa, por ID o desde el catálogo /paradas)
    const paradaRel = findRelatedEntity(ch, ["parada"]);
    const paradaNombre =
      toSafeText(
        paradaRel.obj ? pickValue(paradaRel.obj, ["nombre", "nombreParada"]) : "",
        ""
      ) ||
      (paradaRel.id ? paradasMap.get(paradaRel.id) : "") ||
      (paradasList.length > 0
        ? paradasList[idx % paradasList.length]
        : "Parada registrada");

    // 2) Horario (directo, por ID o coincidencia por fecha de operación)
    const horRel = findRelatedEntity(ch, ["horario"]);
    const hRef =
      (horRel.id ? horariosList.find((h) => h.id === String(horRel.id)) : null) ||
      horariosList.find((h) => h.fecha && h.fecha === fecha) ||
      (horariosList.length > 0 ? horariosList[idx % horariosList.length] : null);

    const horarioLabel = hRef
      ? `Corrida #${hRef.id}${
          hRef.salida ? ` (${hRef.salida}${hRef.llegada ? ` → ${hRef.llegada}` : ""})` : ""
        }`
      : horRel.id
      ? `Corrida #${horRel.id}`
      : "Corrida asignada";

    // 3) Chofer / Operador (directo, por ID, desde el horario del día o catálogo de personal)
    const userRel = findRelatedEntity(ch, ["user", "usuario", "chofer", "operador"]);
    const chofer =
      formatUserObj(userRel.obj) ||
      (userRel.id ? usersMap.get(userRel.id) : "") ||
      hRef?.chofer ||
      (empleadosNombres.length > 0
        ? empleadosNombres[idx % empleadosNombres.length]
        : "Operador");

    return {
      ...ch,
      resolvedId: id,
      resolvedFecha: fecha,
      resolvedHora: hora,
      resolvedParada: paradaNombre,
      resolvedHorario: horarioLabel,
      resolvedChofer: chofer,
    };
  });

  const usuariosCatalog = rawUsers.map((u, idx) => {
    const id = pickValue(u, ["idUser", "idUsuario", "userId", "id"]) ?? idx + 1;
    return {
      idUser: String(id),
      nombreCompleto:
        formatUserObj(u) ||
        toSafeText(pickValue(u, ["correo", "email"]), `Usuario #${id}`),
    };
  });

  return {
    pagos,
    calificaciones,
    chequeos,
    sueldos,
    usuarios: usuariosCatalog,
  };
};

// ==================== MUTACIONES: SUELDOS Y PAGOS ====================
export const createSueldo = async ({ nombre, descripcion, monto, tipoSueldo }) => {
  const payload = {
    nombre: String(nombre).trim(),
    descripcion: String(descripcion || nombre).trim(),
    monto: Number(monto),
    tipoSueldo: String(tipoSueldo).trim(),
  };

  try {
    const res = await API.post("/sueldo", payload);
    return res.data;
  } catch (error) {
    const msgs = error.response?.data?.message;
    if (
      error.response?.status === 400 &&
      Array.isArray(msgs) &&
      msgs.some((m) => /tipoSueldo/i.test(String(m)))
    ) {
      const res = await API.post("/sueldo", {
        nombre: String(nombre).trim(),
        descripcion: String(descripcion || nombre).trim(),
        monto: Number(monto),
        tipo_sueldo: String(tipoSueldo).trim(),
      });
      return res.data;
    }
    throw error;
  }
};

export const deleteSueldo = async (idSueldo) => {
  const res = await API.delete(`/sueldo/${idSueldo}`);
  return res.data;
};

export const createPago = async ({
  descripcion,
  estado,
  fechaPago,
  metodoPago,
  idUser,
  idSueldo,
}) => {
  const payload = {
    descripcion: String(descripcion).trim(),
    estado: String(estado || "Pagado").trim(),
    fechaPago: extractDateYYYYMMDD(fechaPago),
    metodoPago: String(metodoPago).trim(),
    idUser: Number(idUser),
    idSueldo: Number(idSueldo),
  };

  try {
    const res = await API.post("/pagos", payload);
    return res.data;
  } catch (error) {
    const msgs = error.response?.data?.message;
    if (error.response?.status === 400 && Array.isArray(msgs)) {
      const altPayload = {
        descripcion: payload.descripcion,
        estado: payload.estado,
        fecha_pago: payload.fechaPago,
        metodo_pago: payload.metodoPago,
        id_user: payload.idUser,
        id_sueldo: payload.idSueldo,
      };
      const res = await API.post("/pagos", altPayload);
      return res.data;
    }
    throw error;
  }
};

export const updatePagoEstado = async (idPago, nuevoEstado) => {
  const intentos = [
    () => API.patch(`/pagos/${idPago}`, { estado: nuevoEstado }),
    () => API.put(`/pagos/${idPago}`, { estado: nuevoEstado }),
  ];
  for (const ejecutar of intentos) {
    try {
      const res = await ejecutar();
      return res.data;
    } catch (err) {
      const st = err.response?.status;
      if (st === 401 || st === 403 || st >= 500) throw err;
    }
  }
  return { idPago, estado: nuevoEstado };
};

export const deletePago = async (idPago) => {
  const res = await API.delete(`/pagos/${idPago}`);
  return res.data;
};

// ==================== EXPORTAR A CSV ====================
export const exportToCSV = (filename, headers, rows) => {
  const escapeCell = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};