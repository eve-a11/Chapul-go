// src/services/empleadosService.js
import API from "./api";

const META_STORAGE_KEY = "chapulgo_empleados_meta";
const DELETED_USERS_KEY = "chapulgo_deleted_users";

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

const readDeletedIds = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
};

const markUserAsDeleted = (userId) => {
  if (!userId) return;
  try {
    const set = readDeletedIds();
    set.add(String(userId));
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignorar si localStorage no está disponible
  }
};

const extractList = (res) => {
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.rows)) return payload.rows;
    const firstArray = Object.values(payload).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  return [];
};

const normalizeText = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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
    if (k === "id" || k.includes("cred")) {
      if (val !== undefined && val !== null && typeof val !== "object" && !isNaN(Number(val))) {
        return Number(val);
      }
      if (val && typeof val === "object") {
        const nestedId = extractCredId(val);
        if (nestedId !== null) return nestedId;
      }
    }
  }
  return null;
};

const extractUserId = (u) => {
  if (!u || typeof u !== "object") return undefined;
  const direct =
    u.idUser ?? u.Id_User ?? u.id_User ?? u.id_user ?? u.userId ?? u.idUsuario ?? u.id;
  if (direct !== undefined && direct !== null) return direct;

  for (const [key, val] of Object.entries(u)) {
    const k = key.toLowerCase();
    if (k.includes("user") || k.includes("usuario")) {
      if (val && typeof val === "object") {
        const nested = extractUserId(val);
        if (nested !== undefined && nested !== null) return nested;
      } else if (val !== undefined && val !== null && !isNaN(Number(val))) {
        return Number(val);
      }
    }
  }
  return undefined;
};

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

const findCredObjectInUser = (u) => {
  if (!u || typeof u !== "object") return null;
  for (const [key, val] of Object.entries(u)) {
    if (key.toLowerCase().includes("cred") && val && typeof val === "object") {
      return val;
    }
  }
  return null;
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

  const deletedIdsSet = readDeletedIds();
  let users = extractList(usersRes).filter((u) => {
    const uid = extractUserId(u);
    if (uid !== undefined && uid !== null && deletedIdsSet.has(String(uid))) {
      return false;
    }
    if (u.deletedAt !== undefined && u.deletedAt !== null) return false;
    if (u.deleted_at !== undefined && u.deleted_at !== null) return false;
    return true;
  });

  const metaCache = readMetaCache();

  const roleMap = {};
  rolesList.forEach((r) => {
    roleMap[String(r.id)] = r.nombre;
  });

  const credByIdMap = {};
  const credByUserMap = {};
  const parsedCreds = [];

  credsList.forEach((c, idx) => {
    const cid = extractCredId(c) ?? idx + 1;
    const mail = findEmailInObj(c);
    const rfc = c.RFC ?? c.rfc ?? "";
    const cp = c.CP ?? c.cp ?? "";

    let linkedUserId = null;
    for (const [key, val] of Object.entries(c)) {
      const k = key.toLowerCase();
      if (k.includes("user") || k.includes("usuario")) {
        if (val && typeof val === "object") {
          linkedUserId = extractUserId(val);
        } else if (val !== undefined && val !== null && !isNaN(Number(val))) {
          linkedUserId = Number(val);
        }
        if (linkedUserId !== null) break;
      }
    }

    const info = { idCred: cid, email: mail, rfc, cp, linkedUserId };
    parsedCreds.push(info);
    credByIdMap[String(cid)] = info;

    if (linkedUserId !== undefined && linkedUserId !== null) {
      credByUserMap[String(linkedUserId)] = info;
    }
  });

  // Enriquecer con GET /users/:id si falta rol o correo
  const needsDetail = users.some((u) => {
    const uid = extractUserId(u);
    const cached = uid !== undefined && uid !== null ? metaCache[String(uid)] : null;
    const hasRole = findRoleInUserObj(u, roleMap).roleId !== null || Boolean(cached?.idRol);
    const relCred = findCredObjectInUser(u);
    const credId = relCred ? extractCredId(relCred) : extractCredId(u);
    const hasEmail =
      Boolean(findEmailInObj(u)) ||
      Boolean(credId !== null && credByIdMap[String(credId)]?.email) ||
      Boolean(uid !== undefined && uid !== null && credByUserMap[String(uid)]?.email) ||
      Boolean(cached?.email);
    return !hasRole || !hasEmail;
  });

  if (needsDetail && users.length > 0) {
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

  // Primera pasada: resolver los correos que ya tienen vínculo directo o caché
  const usedEmails = new Set();
  const prelim = users.map((u) => {
    const uid = extractUserId(u);
    const cached = uid !== undefined && uid !== null ? metaCache[String(uid)] : null;
    let { roleId, roleName } = findRoleInUserObj(u, roleMap);

    if (roleId === null && cached?.idRol) {
      roleId = Number(cached.idRol);
      roleName = cached.roleName || roleMap[String(roleId)] || `Rol #${roleId}`;
    }

    const relCred = findCredObjectInUser(u);
    const credId = relCred ? extractCredId(relCred) : extractCredId(u);

    const mappedCred =
      (credId !== null ? credByIdMap[String(credId)] : null) ||
      (uid !== undefined && uid !== null ? credByUserMap[String(uid)] : null);

    const resolvedEmail =
      findEmailInObj(u) ||
      findEmailInObj(relCred) ||
      mappedCred?.email ||
      cached?.email ||
      "";

    if (resolvedEmail) usedEmails.add(resolvedEmail.toLowerCase());

    return {
      u,
      uid,
      cached,
      roleId,
      roleName,
      relCred,
      credId,
      mappedCred,
      resolvedEmail,
    };
  });

  // Segunda pasada: recuperar correos existentes desde /credenciales para usuarios que quedaron sin correo
  const availableCreds = parsedCreds.filter(
    (c) => c.email && !usedEmails.has(c.email.toLowerCase())
  );

  // 2a) Emparejar por similitud entre el nombre del usuario y el prefijo del correo (ej. Evelinda <-> evelin@...)
  prelim.forEach((item) => {
    if (item.resolvedEmail || availableCreds.length === 0) return;
    const rawNombre = normalizeText(item.u.Nombre ?? item.u.nombre ?? "");
    const rawApP = normalizeText(item.u.ApellidoP ?? item.u.apellidoP ?? "");
    if (!rawNombre) return;

    const matchIdx = availableCreds.findIndex((c) => {
      const prefix = normalizeText(c.email.split("@")[0]);
      if (!prefix) return false;
      const prefix4 = prefix.slice(0, 4);
      const name4 = rawNombre.slice(0, 4);
      return (
        prefix.includes(rawNombre) ||
        rawNombre.includes(prefix) ||
        (prefix4.length >= 4 && rawNombre.startsWith(prefix4)) ||
        (name4.length >= 4 && prefix.startsWith(name4)) ||
        (rawApP.length >= 4 && prefix.includes(rawApP))
      );
    });

    if (matchIdx !== -1) {
      const [matched] = availableCreds.splice(matchIdx, 1);
      item.resolvedEmail = matched.email;
      item.mappedCred = matched;
      usedEmails.add(matched.email.toLowerCase());
    }
  });

  // 2b) Emparejar los restantes por orden cronológico de ID (idUser ascendente <-> idCred ascendente)
  const stillMissing = prelim
    .filter((item) => !item.resolvedEmail)
    .sort((a, b) => Number(a.uid || 0) - Number(b.uid || 0));

  const sortedRemainingCreds = [...availableCreds].sort(
    (a, b) => Number(a.idCred || 0) - Number(b.idCred || 0)
  );

  stillMissing.forEach((item, idx) => {
    const fallbackCred = sortedRemainingCreds[idx];
    if (fallbackCred) {
      item.resolvedEmail = fallbackCred.email;
      item.mappedCred = fallbackCred;
    }
  });

  return prelim.map((item) => {
    const { u, uid, cached, roleId, roleName, relCred, credId, mappedCred, resolvedEmail } = item;

    const resolvedRfc =
      u.RFC ?? u.rfc ?? relCred?.RFC ?? relCred?.rfc ?? mappedCred?.rfc ?? cached?.rfc ?? "";
    const resolvedCp =
      u.CP ?? u.cp ?? relCred?.CP ?? relCred?.cp ?? mappedCred?.cp ?? cached?.cp ?? "";

    // Persistir en caché para mantener los correos recuperados
    if (uid && resolvedEmail) {
      saveUserMeta(uid, {
        email: resolvedEmail,
        ...(resolvedRfc ? { rfc: resolvedRfc } : {}),
        ...(resolvedCp ? { cp: resolvedCp } : {}),
      });
    }

    return {
      ...u,
      resolvedCredId: credId ?? mappedCred?.idCred ?? null,
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

  // Buscar el usuario y la credencial recién creados en la API
  const [usersRes, credsList] = await Promise.all([
    API.get("/users").catch(() => ({ data: [] })),
    getCredenciales(),
  ]);

  let newUserId =
    extractUserId(regData?.user) ??
    extractUserId(regData?.usuario) ??
    extractUserId(regData?.data?.user) ??
    extractUserId(regData?.data) ??
    extractUserId(regData);

  if (!newUserId) {
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

  // Localizar la credencial creada con ese correo para sellar el vínculo en BD
  const createdCred = credsList.find(
    (c) => findEmailInObj(c).toLowerCase() === String(empleadoData.email).trim().toLowerCase()
  );
  const newCredId = createdCred ? extractCredId(createdCred) : null;

  if (newUserId) {
    saveUserMeta(newUserId, {
      idRol: targetRoleId,
      roleName: targetRoleObj?.nombre || "",
      email: empleadoData.email,
      rfc: empleadoData.rfc || "",
      cp: empleadoData.cp || "",
    });

    // Sellar en la BD el rol y la referencia a credenciales si el endpoint lo permite
    const patchPayload = { idRol: targetRoleId };
    if (newCredId) {
      patchPayload.idCredencial = Number(newCredId);
      patchPayload.idCred = Number(newCredId);
    }

    await API.patch(`/users/${newUserId}`, patchPayload).catch(() =>
      updateEmpleadoRole(newUserId, targetRoleId, targetRoleObj?.nombre || "").catch(() => null)
    );
  }

  return regData;
};

export const deleteEmpleado = async (userId, credId = null) => {
  const res = await API.delete(`/users/${userId}`);
  if (credId) {
    await API.delete(`/credenciales/${credId}`).catch(() => null);
  }
  removeUserMeta(userId);
  markUserAsDeleted(userId);
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