import API from "./api";

const META_STORAGE_KEY = "chapulgo_empleados_meta";

const readMetaCache = () => {
  try {
    return JSON.parse(localStorage.getItem(META_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeMetaCache = (cache) => {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignorar si localStorage no está disponible
  }
};

const saveUserMeta = (userId, meta) => {
  if (!userId) return;
  const cache = readMetaCache();
  cache[String(userId)] = {
    ...(cache[String(userId)] || {}),
    ...meta,
  };
  writeMetaCache(cache);
};

const removeUserMeta = (userId) => {
  if (!userId) return;
  const cache = readMetaCache();
  delete cache[String(userId)];
  writeMetaCache(cache);
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

const extractRoleId = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  for (const [key, val] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (
      (k === "idrol" ||
        k === "id_rol" ||
        k === "rolid" ||
        k === "idrole" ||
        k === "id_role" ||
        k === "id") &&
      val !== undefined &&
      val !== null &&
      !isNaN(Number(val))
    ) {
      return Number(val);
    }
  }
  return null;
};

const extractRoleName = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  const direct =
    obj.Nombre ??
    obj.nombre ??
    obj.rol ??
    obj.name ??
    obj.nombreRol ??
    obj.tipo;
  return typeof direct === "string" && direct.trim() ? direct.trim() : null;
};

const extractCredId = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  for (const [key, val] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (
      (k === "idcred" ||
        k === "id_cred" ||
        k === "idcredencial" ||
        k === "id_credencial" ||
        k === "credencialid" ||
        k === "id") &&
      val !== undefined &&
      val !== null &&
      !isNaN(Number(val))
    ) {
      return Number(val);
    }
  }
  return null;
};

const extractUserId = (u) =>
  u?.idUser ?? u?.id_User ?? u?.id_user ?? u?.userId ?? u?.id;

const findRoleInUserObj = (u, roleMap) => {
  if (!u || typeof u !== "object") {
    return { roleId: null, roleName: null };
  }

  for (const [key, val] of Object.entries(u)) {
    const k = key.toLowerCase();
    if (!k.includes("rol") && !k.includes("role")) continue;

    if (val && typeof val === "object") {
      const rId = extractRoleId(val);
      const rName =
        extractRoleName(val) || (rId !== null ? roleMap[String(rId)] : null);
      if (rId !== null || rName) {
        return { roleId: rId, roleName: rName };
      }
    } else if (typeof val === "number" || (typeof val === "string" && val.trim() !== "")) {
      if (!isNaN(Number(val))) {
        const rId = Number(val);
        return {
          roleId: rId,
          roleName: roleMap[String(rId)] || `Rol #${rId}`,
        };
      } else {
        const matchedEntry = Object.entries(roleMap).find(
          ([, name]) => name.toLowerCase() === val.trim().toLowerCase()
        );
        return {
          roleId: matchedEntry ? Number(matchedEntry[0]) : null,
          roleName: val.trim(),
        };
      }
    }
  }

  return { roleId: null, roleName: null };
};

const findEmailInObj = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  for (const val of Object.values(obj)) {
    if (typeof val === "string" && val.includes("@")) return val.trim();
    if (val && typeof val === "object" && !Array.isArray(val)) {
      for (const nested of Object.values(val)) {
        if (typeof nested === "string" && nested.includes("@")) return nested.trim();
      }
    }
  }
  return "";
};

export const getRoles = async () => {
  const res = await API.get("/roles");
  const list = extractList(res);
  const vistos = new Set();

  return list
    .map((r, idx) => ({
      id: extractRoleId(r) ?? idx + 1,
      nombre: extractRoleName(r) || `Rol #${idx + 1}`,
      descripcion: typeof r.Descripcion === "string" ? r.Descripcion : r.descripcion || "",
    }))
    .filter((r) => {
      const key = r.nombre.toLowerCase();
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });
};

export const getLocalidades = async () => {
  try {
    const res = await API.get("/localidades");
    const list = extractList(res);
    return list.map((loc, idx) => ({
      id: loc.idLocalidad ?? loc.id_Localidad ?? loc.id_localidad ?? loc.id ?? idx + 1,
      nombre: loc.Localidad ?? loc.localidad ?? loc.nombre ?? `Localidad #${idx + 1}`,
    }));
  } catch {
    return [];
  }
};

export const getCredenciales = async () => {
  try {
    const res = await API.get("/credenciales");
    return extractList(res);
  } catch {
    return [];
  }
};

export const getEmpleadosConRol = async () => {
  const [usersRes, rolesList, credsList] = await Promise.all([
    API.get("/users"),
    getRoles().catch(() => []),
    getCredenciales(),
  ]);

  let users = extractList(usersRes);
  const metaCache = readMetaCache();

  const roleMap = {};
  rolesList.forEach((r) => {
    roleMap[String(r.id)] = r.nombre;
  });

  // Enriquecer con GET /users/:id si GET /users omite relaciones
  const needsDetail =
    users.length > 0 &&
    users.every((u) => findRoleInUserObj(u, roleMap).roleId === null);

  if (needsDetail) {
    const detailResults = await Promise.allSettled(
      users.map((u) => {
        const uid = extractUserId(u);
        return uid ? API.get(`/users/${uid}`) : Promise.resolve(null);
      })
    );

    users = users.map((u, idx) => {
      const resDetail = detailResults[idx];
      if (resDetail?.status === "fulfilled" && resDetail.value?.data) {
        const detailObj =
          resDetail.value.data?.data && typeof resDetail.value.data.data === "object"
            ? resDetail.value.data.data
            : resDetail.value.data;
        return { ...u, ...detailObj };
      }
      return u;
    });
  }

  const credByIdMap = {};
  const credByUserMap = {};
  credsList.forEach((c) => {
    const cid = extractCredId(c);
    const mail = findEmailInObj(c);
    const rfc = c.RFC ?? c.rfc ?? "";
    const cp = c.CP ?? c.cp ?? "";
    const info = { email: mail, rfc, cp };

    if (cid !== null) credByIdMap[String(cid)] = info;

    const linkedUserId =
      typeof c.user === "object"
        ? extractUserId(c.user)
        : c.idUser ?? c.id_User ?? c.id_user ?? c.userId;
    if (linkedUserId !== undefined && linkedUserId !== null) {
      credByUserMap[String(linkedUserId)] = info;
    }
  });

  return users.map((u) => {
    const uid = extractUserId(u);
    const cached = uid !== undefined && uid !== null ? metaCache[String(uid)] : null;

    let { roleId, roleName } = findRoleInUserObj(u, roleMap);

    // Recuperar rol guardado localmente si el endpoint GET /users no lo incluye
    if (roleId === null && cached?.idRol) {
      roleId = Number(cached.idRol);
      roleName = cached.roleName || roleMap[String(roleId)] || `Rol #${roleId}`;
    }

    const relCred =
      u.credencial ??
      u.credenciales ??
      (typeof u.idCred === "object" ? u.idCred : null) ??
      (typeof u.idCredencial === "object" ? u.idCredencial : null);

    const credId = relCred
      ? extractCredId(relCred)
      : u.idCred ?? u.id_Cred ?? u.id_cred ?? u.idCredencial ?? u.id_credencial;

    const mappedCred =
      (credId !== undefined && credId !== null ? credByIdMap[String(credId)] : null) ||
      (uid !== undefined && uid !== null ? credByUserMap[String(uid)] : null);

    const resolvedEmail =
      findEmailInObj(u) || mappedCred?.email || cached?.email || "";
    const resolvedRfc =
      u.RFC ?? u.rfc ?? relCred?.RFC ?? relCred?.rfc ?? mappedCred?.rfc ?? cached?.rfc ?? "";
    const resolvedCp =
      u.CP ?? u.cp ?? relCred?.CP ?? relCred?.cp ?? mappedCred?.cp ?? cached?.cp ?? "";

    return {
      ...u,
      resolvedRoleId: roleId,
      resolvedRole: roleName || "Usuario",
      resolvedEmail,
      resolvedRfc,
      resolvedCp,
    };
  });
};

export const updateEmpleadoRole = async (userId, newRoleId, roleName = "") => {
  const numericRoleId = Number(newRoleId);
  let resolvedName = roleName;

  if (!resolvedName) {
    const rolesList = await getRoles().catch(() => []);
    const found = rolesList.find((r) => Number(r.id) === numericRoleId);
    if (found) resolvedName = found.nombre;
  }

  try {
    await API.patch(`/users/${userId}`, { idRol: numericRoleId });
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw error;
    }
    if (error.response?.status === 404 || error.response?.status === 405) {
      await API.put(`/users/${userId}`, { idRol: numericRoleId }).catch(() => null);
    }
  }

  saveUserMeta(userId, {
    idRol: numericRoleId,
    ...(resolvedName ? { roleName: resolvedName } : {}),
  });

  return { idUser: userId, idRol: numericRoleId, roleName: resolvedName };
};

export const registerEmpleado = async (empleadoData) => {
  const targetRoleId = Number(empleadoData.idRol);
  const rolesList = await getRoles().catch(() => []);
  const targetRoleObj = rolesList.find((r) => Number(r.id) === targetRoleId);

  const response = await API.post("/auth/registerAdmin", {
    ...empleadoData,
    idRol: targetRoleId,
  });
  const regData = response.data;

  let newUserId =
    extractUserId(regData?.user) ??
    extractUserId(regData?.usuario) ??
    extractUserId(regData?.data) ??
    extractUserId(regData);

  if (!newUserId) {
    const usersRes = await API.get("/users");
    const allUsers = extractList(usersRes);
    const sameNameUsers = allUsers.filter(
      (u) =>
        String(u.Nombre ?? u.nombre ?? "")
          .trim()
          .toLowerCase() === String(empleadoData.nombre).trim().toLowerCase() &&
        String(u.ApellidoP ?? u.apellidoP ?? "")
          .trim()
          .toLowerCase() === String(empleadoData.apellidoP).trim().toLowerCase()
    );

    const candidates = sameNameUsers.length > 0 ? sameNameUsers : allUsers;
    if (candidates.length > 0) {
      const latest = candidates.reduce((max, curr) =>
        Number(extractUserId(curr) || 0) > Number(extractUserId(max) || 0) ? curr : max
      );
      newUserId = extractUserId(latest);
    }
  }

  if (newUserId) {
    saveUserMeta(newUserId, {
      idRol: targetRoleId,
      roleName: targetRoleObj?.nombre || "",
      email: empleadoData.email,
      rfc: empleadoData.rfc || "",
      cp: empleadoData.cp || "",
    });

    if (targetRoleId) {
      await updateEmpleadoRole(
        newUserId,
        targetRoleId,
        targetRoleObj?.nombre || ""
      ).catch(() => null);
    }
  }

  return regData;
};

export const deleteEmpleado = async (userId) => {
  const res = await API.delete(`/users/${userId}`);
  removeUserMeta(userId);
  return res.data;
};

export const getChoferes = async () => {
  const empleados = await getEmpleadosConRol();
  return empleados.filter((u) =>
    String(u.resolvedRole || "")
      .toLowerCase()
      .includes("chofer")
  );
};