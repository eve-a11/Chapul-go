import API from "./api";

const extractList = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

// Convierte Buffers de MySQL ({ type: "Buffer", data: [0|1] }) u objetos a texto seguro para React
const toSafeText = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "Activo" : "Inactivo";
  if (typeof val === "object") {
    if (val.type === "Buffer" && Array.isArray(val.data)) {
      return val.data[0] === 1 ? "Entregado" : "En revisión";
    }
    return String(val.nombre || val.descripcion || val.titulo || val.placa || fallback);
  }
  return fallback;
};

const isBufferTrue = (val) => {
  if (val && typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) {
    return val.data[0] === 1;
  }
  return val === true || val === 1 || String(val).toLowerCase() === "entregado";
};

export const getDashboardSummary = async () => {
  const [rutasRes, vehiculosRes, objetosRes, opinionesRes] = await Promise.allSettled([
    API.get("/rutas"),
    API.get("/vehiculos"),
    API.get("/cosas-per"),
    API.get("/calif-servicio"),
  ]);

  const rutas = rutasRes.status === "fulfilled" ? extractList(rutasRes.value) : [];
  const vehiculos = vehiculosRes.status === "fulfilled" ? extractList(vehiculosRes.value) : [];
  const objetos = objetosRes.status === "fulfilled" ? extractList(objetosRes.value) : [];
  const opiniones = opinionesRes.status === "fulfilled" ? extractList(opinionesRes.value) : [];

  const enMantenimiento = vehiculos.filter((v) =>
    toSafeText(v.estado ?? v.estatus).toLowerCase().includes("mantenimiento")
  ).length;
  const vehiculosActivos = vehiculos.length - enMantenimiento;

  const objetosEntregados = objetos.filter(
    (item) => isBufferTrue(item.estado) || isBufferTrue(item.entregado)
  ).length;
  const objetosPendientes = objetos.length - objetosEntregados;

  let calificacionPromedio = "0.0";
  if (opiniones.length > 0) {
    const suma = opiniones.reduce((acc, op) => {
      const val = Number(op.calificacion || op.puntuacion || op.estrellas || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    calificacionPromedio = suma > 0 ? `${(suma / opiniones.length).toFixed(1)} ★` : "0.0";
  }

  const pctRutasOperando = rutas.length > 0 ? 100 : 0;
  const pctFlotaActiva =
    vehiculos.length > 0 ? Math.round((vehiculosActivos / vehiculos.length) * 100) : 0;
  const pctReportesResueltos =
    objetos.length > 0 ? Math.round((objetosEntregados / objetos.length) * 100) : 0;

  const recentUnits = vehiculos.slice(0, 5).map((v, idx) => {
    const num = toSafeText(v.numeroVehiculo || v.numVehiculo || v.numero_vehiculo, `VEH-${idx + 1}`);
    const marca = toSafeText(v.marca, "");
    const placa = toSafeText(v.placa, "Sin placa");
    const rawEstado = v.estado ?? v.estatus ?? "Activo";
    const estadoText =
      rawEstado && typeof rawEstado === "object" && rawEstado.type === "Buffer"
        ? rawEstado.data?.[0] === 1
          ? "Activo"
          : "Inactivo"
        : toSafeText(rawEstado, "Activo");

    return {
      id: typeof v.idVehiculo === "number" || typeof v.id === "number" ? (v.idVehiculo ?? v.id) : idx + 1,
      unidad: marca ? `${num} (${marca})` : num,
      placa,
      estado: estadoText,
    };
  });

  const recentObjects = objetos.slice(0, 4).map((obj, idx) => {
    const entregado = isBufferTrue(obj.estado) || isBufferTrue(obj.entregado);
    const estadoTexto =
      typeof obj.estado === "string" && obj.estado.trim()
        ? obj.estado
        : entregado
        ? "Entregado"
        : "En revisión";

    return {
      id: typeof obj.idCosaPer === "number" || typeof obj.id === "number" ? (obj.idCosaPer ?? obj.id) : idx + 1,
      descripcion: toSafeText(obj.descripcion || obj.nombre || obj.objeto, "Objeto reportado"),
      lugar: toSafeText(obj.lugar || obj.ubicacion || obj.ruta, "Sin ubicación registrada"),
      estado: estadoTexto,
    };
  });

  return {
    rutasActivas: rutas.length,
    vehiculosTotal: vehiculos.length,
    vehiculosServicio: vehiculosActivos,
    objetosTotal: objetos.length,
    objetosPendientes,
    objetosEntregados,
    calificacionPromedio,
    totalOpiniones: opiniones.length,
    indicadores: {
      pctRutasOperando,
      pctFlotaActiva,
      pctReportesResueltos,
    },
    alertas: {
      reportesRevision: objetosPendientes,
      combisMantenimiento: enMantenimiento,
      comentariosRecibidos: opiniones.length,
    },
    recentUnits,
    recentObjects,
  };
};