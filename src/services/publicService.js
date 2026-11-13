import api from "./api";

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const safeGet = async (url) => {
  try {
    const res = await api.get(url);
    return extractArray(res.data);
  } catch {
    return [];
  }
};

export const getPublicHomeData = async (userIdLocalidad = null) => {
  const [
    rawRutas,
    rawParadas,
    rawTarifas,
    rawTarifaRuta,
    rawHorarios,
    rawCosasPer,
    rawLocalidades,
    rawCalificaciones,
  ] = await Promise.all([
    safeGet("/rutas"),
    safeGet("/paradas"),
    safeGet("/tarifas"),
    safeGet("/r-tarifa-ruta"),
    safeGet("/horarios"),
    safeGet("/cosas-per"),
    safeGet("/localidades"),
    safeGet("/calif-servicio"),
  ]);

  // 1. Mapa de tarifas por idTarifa
  const tarifasMap = new Map();
  rawTarifas.forEach((t) => {
    const id = String(t?.idTarifa ?? t?.Id_Tarifa ?? t?.id ?? "");
    const monto = t?.monto ?? t?.precio ?? t?.tarifa ?? t?.costo ?? t?.Monto ?? null;
    if (id) {
      tarifasMap.set(id, {
        id,
        monto,
        concepto: t?.tipo ?? t?.nombre ?? t?.descripcion ?? "Tarifa general",
      });
    }
  });

  // 2. Relación ruta <-> tarifa desde /r-tarifa-ruta
  const rutaTarifaMap = new Map();
  rawTarifaRuta.forEach((rel) => {
    const rId = String(rel?.idRuta ?? rel?.Id_Ruta ?? rel?.ruta?.idRuta ?? "");
    const tId = String(rel?.idTarifa ?? rel?.Id_Tarifa ?? rel?.tarifa?.idTarifa ?? "");
    const directMonto =
      rel?.tarifa?.monto ?? rel?.tarifa?.precio ?? rel?.monto ?? tarifasMap.get(tId)?.monto ?? null;
    if (rId && directMonto !== null) {
      rutaTarifaMap.set(rId, directMonto);
    }
  });

  // 3. Normalizar rutas y vincular sus paradas y tarifas
  const rutas = rawRutas.map((item, idx) => {
    const id = String(item?.idRuta ?? item?.Id_Ruta ?? item?.id ?? idx + 1);
    const embeddedParadas = Array.isArray(item?.paradas) ? item.paradas : [];

    const paradasDeRuta = rawParadas
      .filter((p) => String(p?.idRuta ?? p?.Id_Ruta ?? p?.ruta?.idRuta ?? "") === id)
      .map((p, i) => ({
        id: p?.idParada ?? p?.id ?? i + 1,
        nombre: p?.nombreParada ?? p?.nombre ?? p?.Nombre ?? `Parada ${i + 1}`,
        referencia: p?.referencia ?? p?.ubicacion ?? p?.direccion ?? "",
      }));

    const paradasFinales =
      paradasDeRuta.length > 0
        ? paradasDeRuta
        : embeddedParadas.map((p, i) =>
            typeof p === "string"
              ? { id: i + 1, nombre: p, referencia: "" }
              : {
                  id: p?.idParada ?? p?.id ?? i + 1,
                  nombre: p?.nombreParada ?? p?.nombre ?? `Parada ${i + 1}`,
                  referencia: p?.referencia ?? "",
                }
          );

    const tarifa =
      rutaTarifaMap.get(id) ??
      item?.tarifa ??
      item?.costo ??
      item?.precio ??
      null;

    return {
      id,
      nombre: item?.nombreRuta ?? item?.nombre ?? item?.Nombre ?? `Ruta ${id}`,
      origen: item?.origen ?? item?.Origen ?? item?.inicio ?? "Origen",
      destino: item?.destino ?? item?.Destino ?? item?.fin ?? "Destino",
      tarifa,
      frecuencia: item?.frecuencia ?? item?.intervalo ?? "Cada 15 - 20 min",
      paradas: paradasFinales,
    };
  });

  // 4. Horarios (/horarios)
  const horarios = rawHorarios.map((h, idx) => {
    const rId = String(h?.idRuta ?? h?.Id_Ruta ?? h?.ruta?.idRuta ?? "");
    const rutaMatch = rutas.find((r) => r.id === rId);
    return {
      id: String(h?.idHorario ?? h?.Id_Horario ?? h?.id ?? idx + 1),
      rutaId: rId,
      rutaNombre:
        h?.ruta?.nombreRuta ??
        h?.ruta?.nombre ??
        h?.nombreRuta ??
        rutaMatch?.nombre ??
        "Ruta General",
      horaSalida: String(h?.horaSalida ?? h?.Hora_Salida ?? h?.salida ?? "06:00").slice(0, 5),
      horaLlegada: String(h?.horaLlegada ?? h?.Hora_Llegada ?? h?.llegada ?? "22:00").slice(0, 5),
      dias: h?.dias ?? h?.diaSemana ?? h?.diasOperacion ?? "Lunes a Domingo",
    };
  });

  // 5. Objetos perdidos (/cosas-per)
  const objetosPerdidos = rawCosasPer.map((o, idx) => ({
    id: String(o?.idCosaPer ?? o?.idObjeto ?? o?.id ?? idx + 1),
    nombre: o?.nombreObjeto ?? o?.objeto ?? o?.nombre ?? o?.Nombre ?? "Objeto reportado",
    descripcion: o?.descripcion ?? o?.Descripcion ?? o?.detalles ?? "Sin descripción.",
    ruta: o?.ruta?.nombreRuta ?? o?.ruta?.nombre ?? o?.nombreRuta ?? "Unidad Chapul-Go",
    fecha: o?.fecha ?? o?.fechaReporte ?? o?.createdAt ?? "",
    estado: o?.estado ?? o?.estatus ?? "En resguardo",
  }));

  // 6. Localidad del pasajero (/localidades)
  let localidadActual = "Chapulhuacán";
  if (userIdLocalidad && rawLocalidades.length > 0) {
    const foundLoc = rawLocalidades.find(
      (l) => Number(l?.idLocalidad ?? l?.Id_Localidad ?? l?.id) === Number(userIdLocalidad)
    );
    if (foundLoc) {
      localidadActual =
        foundLoc?.nombreLocalidad ?? foundLoc?.nombre ?? foundLoc?.Nombre ?? localidadActual;
    }
  }

  return {
    rutas,
    horarios,
    objetosPerdidos,
    tarifas: Array.from(tarifasMap.values()),
    calificaciones: rawCalificaciones,
    localidadActual,
  };
};

export const sendCalificacionServicio = async (payload) => {
  const res = await api.post("/calif-servicio", payload);
  return res.data;
};