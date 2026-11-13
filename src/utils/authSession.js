const TOKEN_KEYS = ["token", "access_token", "authToken"];
const USER_KEYS = ["user", "usuario", "chapulgo_user"];

export const getStoredToken = () => {
  for (const key of TOKEN_KEYS) {
    const val = localStorage.getItem(key);
    if (val && val !== "undefined" && val !== "null") return val;
  }
  return null;
};

export const decodeJwtPayload = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenValid = (token = getStoredToken()) => {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  // Verificar si el token JWT ya expiró (exp viene en segundos)
  if (payload.exp && typeof payload.exp === "number") {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowInSeconds) {
      return false;
    }
  }
  return true;
};

export const getStoredUser = () => {
  for (const key of USER_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw && raw !== "undefined" && raw !== "null") {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {
      // Continuar con la siguiente llave
    }
  }
  return decodeJwtPayload(getStoredToken());
};

export const getUserRoleName = () => {
  const user = getStoredUser();
  const payload = decodeJwtPayload(getStoredToken());

  const rawRole =
    user?.rol?.nombre ??
    user?.rol?.Nombre ??
    user?.role?.nombre ??
    user?.rol ??
    user?.role ??
    payload?.rol?.nombre ??
    payload?.rol ??
    payload?.role ??
    "";

  if (rawRole) return String(rawRole).trim();

  const idRol = Number(
    user?.idRol ?? user?.Id_Rol ?? user?.rol?.idRol ?? payload?.idRol ?? 0
  );
  if (idRol === 1) return "SuperAdministrador";
  if (idRol === 2) return "Administrador";
  if (idRol === 3 || user?.finalRole === "user") return "Usuario";
  return "";
};

export const isAdminSession = () => {
  if (!isTokenValid()) return false;

  const user = getStoredUser();
  const payload = decodeJwtPayload(getStoredToken());
  const roleStr = getUserRoleName().toLowerCase();
  const idRol = Number(
    user?.idRol ?? user?.Id_Rol ?? user?.rol?.idRol ?? payload?.idRol ?? 0
  );

  // Bloquear explícitamente cuentas de pasajeros / portal público
  if (
    user?.finalRole === "user" ||
    roleStr === "usuario" ||
    roleStr === "pasajero" ||
    roleStr === "cliente" ||
    roleStr === "public" ||
    idRol === 3
  ) {
    return false;
  }

  return true;
};

export const clearAuthSession = () => {
  [...TOKEN_KEYS, ...USER_KEYS].forEach((k) => localStorage.removeItem(k));
  sessionStorage.clear();
};