import API from "./api";

const extractList = (res) => {
  let list = [];
  if (Array.isArray(res?.data)) list = res.data;
  else if (Array.isArray(res?.data?.data)) list = res.data.data;
  else if (Array.isArray(res?.data?.vehiculos)) list = res.data.vehiculos;
  else if (Array.isArray(res?.data?.users)) list = res.data.users;

  // Normalizamos el estatus de Buffer a booleano de forma segura
  return list.map((vehiculo) => {
    let activo = true;
    if (vehiculo.estatus && vehiculo.estatus.type === "Buffer" && Array.isArray(vehiculo.estatus.data)) {
      activo = vehiculo.estatus.data[0] === 1;
    } else if (typeof vehiculo.estatus === "boolean") {
      activo = vehiculo.estatus;
    } else if (typeof vehiculo.estatus === "number") {
      activo = vehiculo.estatus === 1;
    }

    return {
      ...vehiculo,
      estatus: activo, // Sobrescribimos el estatus para que la interfaz lo lea directamente sin errores
    };
  });
};

export const getVehiculos = async () => {
  const response = await API.get("/vehiculos");
  return extractList(response);
};

export const getUsuariosDisponibles = async () => {
  try {
    const response = await API.get("/users");
    return extractList(response);
  } catch {
    return [];
  }
};

export const createVehiculo = async (vehiculoData) => {
  const response = await API.post("/vehiculos", vehiculoData);
  return response.data;
};

export const updateVehiculo = async (id, vehiculoData) => {
  try {
    const response = await API.patch(`/vehiculos/${id}`, vehiculoData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 405) {
      const response = await API.put(`/vehiculos/${id}`, vehiculoData);
      return response.data;
    }
    throw error;
  }
};

export const deleteVehiculo = async (id) => {
  const response = await API.delete(`/vehiculos/${id}`);
  return response.data;
};

export const isVehiculoActivo = (estatus) => {
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
  return str === "activo" || str === "1" || str === "true";
};

export const updateVehiculoEstatus = async (idVehiculo, nuevoEstatus) => {
  const payload = { estatus: Boolean(nuevoEstatus) };
  try {
    const res = await API.patch(`/vehiculos/${idVehiculo}`, payload);
    return res.data;
  } catch (error) {
    // Si el DTO del backend pide 1 o 0 en lugar de true/false
    if (error.response?.status === 400) {
      const res = await API.patch(`/vehiculos/${idVehiculo}`, {
        estatus: nuevoEstatus ? 1 : 0,
      });
      return res.data;
    }
    if (error.response?.status === 404 || error.response?.status === 405) {
      const res = await API.put(`/vehiculos/${idVehiculo}`, payload);
      return res.data;
    }
    throw error;
  }
};