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
  return [
    u.nombre ?? u.Nombre,
    u.apellidoP ?? u.ApellidoP ?? u.apellidoPaterno,
    u.apellidoM ?? u.ApellidoM ?? u.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
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

  // Mapas de búsqueda rápida por ID para resolver llaves foráneas
  const usersMap = new Map();
  rawUsers.forEach((u) => {
    const id = u.idUser ?? u.Id_User ?? u.id_user ?? u.id;
    if (id !== undefined && id !== null) {
      usersMap.set(String(id), formatUserObj(u) || `Usuario #${id}`);
    }
  });

  const horariosMap = new Map();
  rawHorarios.forEach((h) => {
    const id = h.idHorarios ?? h.Id_Horarios ?? h.idHorario ?? h.id;
    if (id !== undefined && id !== null) {
      horariosMap.set(String(id), {
        id: String(id),
        fecha: extractDateYYYYMMDD(h.fecha ?? h.Fecha),
        salida: h.horaSalida ?? h.Hora_Salida ?? "",
        llegada: h.horaLlegada ?? h.Hora_Llegada ?? "",
      });
    }
  });

  const paradasMap = new Map();
  rawParadas.forEach((p) => {
    const id = p.idParada ?? p.Id_Parada ?? p.id_parada ?? p.id;
    if (id !== undefined && id !== null) {
      paradasMap.set(String(id), toSafeText(p.nombre ?? p.Nombre, `Parada #${id}`));
    }
  });

  const sueldosMap = new Map();
  const sueldos = rawSueldos.map((s, idx) => {
    const id = s.idSueldo ?? s.Id_Sueldo ?? s.id_sueldo ?? s.id ?? idx + 1;
    const nombre = toSafeText(s.nombre ?? s.Nombre, `Tabulador #${id}`);
    const descripcion = toSafeText(s.descripcion ?? s.Descripcion, "—");
    const monto = Number(s.monto ?? s.Monto ?? 0);
    const tipo = toSafeText(
      s.tipoSueldo ?? s.Tipo_Sueldo ?? s.tipo_sueldo,
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
    const id = p.idPago ?? p.Id_Pago ?? p.id_pago ?? p.id ?? idx + 1;
    const userId = String(p.idUser ?? p.Id_User ?? p.user?.idUser ?? "");
    const sueldoId = String(p.idSueldo ?? p.Id_Sueldo ?? p.sueldo?.idSueldo ?? "");

    const nestedUser = formatUserObj(p.user);
    const empleado =
      nestedUser ||
      (userId ? usersMap.get(userId) || `Empleado #${userId}` : "Personal");

    const sueldoRef =
      (p.sueldo && typeof p.sueldo === "object" ? p.sueldo : null) ||
      sueldosMap.get(sueldoId);

    const monto = Number(
      sueldoRef?.resolvedMonto ?? sueldoRef?.monto ?? sueldoRef?.Monto ?? p.monto ?? 0
    );
    const tabuladorNombre = toSafeText(
      sueldoRef?.resolvedNombre ?? sueldoRef?.nombre ?? sueldoRef?.Nombre,
      sueldoId ? `Tabulador #${sueldoId}` : "Nómina"
    );

    const descripcion = toSafeText(
      p.descripcion ?? p.Descripcion,
      tabuladorNombre
    );
    const fecha = extractDateYYYYMMDD(
      p.fechaPago ?? p.Fecha_Pago ?? p.fecha_pago ?? p.fecha
    );
    const metodo = toSafeText(
      p.metodoPago ?? p.Metodo_Pago ?? p.metodo_pago,
      "Transferencia"
    );
    const estado = toSafeText(p.estado ?? p.Estado, "Pagado");

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
      c.idCalServ ??
      c.Id_Cal_Serv ??
      c.id_cal_serv ??
      c.idCalifServicio ??
      c.id ??
      idx + 1;

    const calServicio = Number(
      c.calServicio ?? c.Cal_Servicio ?? c.cal_servicio ?? 0
    );
    const calChofer = Number(
      c.calChofer ?? c.Cal_Chofer ?? c.cal_chofer ?? c.Col_Chofer ?? 0
    );

    const userId = String(c.idUser ?? c.Id_User ?? c.user?.idUser ?? "");
    const nestedUser = formatUserObj(c.user);
    const pasajero =
      nestedUser ||
      (userId ? usersMap.get(userId) || `Pasajero #${userId}` : "Pasajero");

    const horarioId = String(
      c.idHorario ?? c.Id_Horario ?? c.idHorarios ?? c.horario?.idHorarios ?? ""
    );
    const hRef =
      (c.horario && typeof c.horario === "object"
        ? {
            fecha: extractDateYYYYMMDD(c.horario.fecha),
            salida: c.horario.horaSalida,
            llegada: c.horario.horaLlegada,
          }
        : null) || horariosMap.get(horarioId);

    const fecha = hRef?.fecha || extractDateYYYYMMDD(c.fecha);
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
  const chequeos = extractList(chequeosRes).map((ch, idx) => {
    const id =
      ch.idChequeov ??
      ch.Id_Chequeov ??
      ch.id_chequeov ??
      ch.id ??
      idx + 1;

    const rawHora = ch.hora ?? ch.Hora ?? "";
    const fecha = extractDateYYYYMMDD(rawHora);
    const hora = extractHoraHHMMSS(rawHora);

    const paradaId = String(
      ch.idParada ?? ch.Id_Parada ?? ch.parada?.idParada ?? ""
    );
    const paradaNombre =
      toSafeText(ch.parada?.nombre ?? ch.parada?.Nombre, "") ||
      (paradaId ? paradasMap.get(paradaId) || `Parada #${paradaId}` : "Parada registrada");

    const horarioId = String(
      ch.idHorario ?? ch.Id_Horario ?? ch.horario?.idHorarios ?? ""
    );
    const hRef = horariosMap.get(horarioId);
    const horarioLabel = horarioId
      ? `Corrida #${horarioId}${hRef?.salida ? ` (${hRef.salida})` : ""}`
      : "—";

    const userId = String(ch.idUser ?? ch.Id_User ?? ch.user?.idUser ?? "");
    const nestedUser = formatUserObj(ch.user);
    const chofer =
      nestedUser ||
      (userId ? usersMap.get(userId) || `Operador #${userId}` : "Operador");

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

  const usuariosCatalog = rawUsers.map((u) => {
    const id = u.idUser ?? u.Id_User ?? u.id_user ?? u.id;
    return {
      idUser: String(id),
      nombreCompleto: formatUserObj(u) || u.correo || `Usuario #${id}`,
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