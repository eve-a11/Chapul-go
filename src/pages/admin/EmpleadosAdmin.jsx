import { useState, useEffect } from "react";
import {
  getRoles,
  getLocalidades,
  getEmpleadosConRol,
  registerEmpleado,
  updateEmpleadoRole,
  deleteEmpleado,
} from "../../services/empleadosService";
import { getStoredUser } from "../../utils/authSession";

const ROLES_EMPLEADOS = ["chofer", "checador", "admin", "superadmin"];

const normalizeRole = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const isAllowedRole = (name) => ROLES_EMPLEADOS.includes(normalizeRole(name));

const toSafeString = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") {
    if (val.type === "Buffer" && Array.isArray(val.data)) {
      return val.data[0] === 1 ? "Activo" : "Inactivo";
    }
    return fallback;
  }
  return String(val);
};

export default function EmpleadosAdmin() {
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedRoleFilter, setSelectedRoleFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal de confirmación personalizado
  const [userToDelete, setUserToDelete] = useState(null);

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [apellidoP, setApellidoP] = useState("");
  const [apellidoM, setApellidoM] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("1995-01-01");
  const [idLocalidad, setIdLocalidad] = useState("1");
  const [idRol, setIdRol] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rfc, setRfc] = useState("");
  const [cp, setCp] = useState("");

  const currentUser = getStoredUser();
  const currentSessionEmail = String(
    currentUser?.correo || currentUser?.email || ""
  )
    .toLowerCase()
    .trim();
  const currentSessionId = String(
    currentUser?.idUser ?? currentUser?.Id_User ?? currentUser?.id ?? ""
  );

  const getUserId = (u) => u?.idUser ?? u?.Id_User ?? u?.id_User ?? u?.id_user ?? u?.id;

  const isCurrentAccount = (u) => {
    const uid = String(getUserId(u) ?? "");
    const uEmail = toSafeString(u.resolvedEmail).toLowerCase().trim();
    return (
      (currentSessionId && uid === currentSessionId) ||
      (currentSessionEmail && uEmail && uEmail === currentSessionEmail)
    );
  };

  // Solo Chofer, Checador, Admin y SuperAdmin
  const allowedRoles = roles.filter((r) => isAllowedRole(r.nombre));

  const getDefaultEmpleadoRoleId = (rolesList) => {
    const valid = rolesList.filter((r) => isAllowedRole(r.nombre));
    const chofer = valid.find((r) => normalizeRole(r.nombre) === "chofer");
    return chofer ? String(chofer.id) : valid[0] ? String(valid[0].id) : "";
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [empData, rolesData, locData] = await Promise.all([
        getEmpleadosConRol(),
        getRoles(),
        getLocalidades(),
      ]);

      setEmpleados(empData);
      setRoles(rolesData);
      setLocalidades(locData);

      setIdRol((prev) => prev || getDefaultEmpleadoRoleId(rolesData));

      if (locData.length > 0) {
        setIdLocalidad((prev) => prev || String(locData[0].id));
      }
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      setErrorMsg(`Error al obtener datos (${error.response?.status || "Red"})`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setNombre("");
    setApellidoP("");
    setApellidoM("");
    setFechaNacimiento("1995-01-01");
    setIdRol(getDefaultEmpleadoRoleId(roles));
    setEmail("");
    setPassword("");
    setRfc("");
    setCp("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanNombre = toSafeString(nombre).trim();
    const cleanApellidoP = toSafeString(apellidoP).trim();
    const cleanApellidoM = toSafeString(apellidoM).trim();
    const cleanEmail = toSafeString(email).trim().toLowerCase();
    const cleanRfc = toSafeString(rfc).trim().toUpperCase();
    const cleanCp = toSafeString(cp).trim();

    if (!cleanNombre || !cleanApellidoP || !cleanEmail || !password || !idRol) {
      setErrorMsg(
        "Completa los campos obligatorios: Nombre, Apellido Paterno, Rol, Correo y Contraseña."
      );
      return;
    }

    setIsSaving(true);
    const payload = {
      nombre: cleanNombre,
      apellidoP: cleanApellidoP,
      apellidoM: cleanApellidoM || "N/A",
      fechaNacimiento,
      idLocalidad: Number(idLocalidad) || 1,
      idRol: Number(idRol),
      email: cleanEmail,
      password,
    };

    if (cleanRfc) payload.rfc = cleanRfc;
    if (cleanCp) payload.cp = cleanCp;

    try {
      await registerEmpleado(payload);
      const roleSelected = allowedRoles.find((r) => String(r.id) === String(idRol));
      setSuccessMsg(
        `Empleado ${cleanNombre} ${cleanApellidoP} registrado con el rol ${
          roleSelected?.nombre || ""
        }.`
      );
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error en registerAdmin:", error);
      const raw = error.response?.data?.message || error.response?.data?.error;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo registrar el empleado."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    if (!newRoleId) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await updateEmpleadoRole(userId, newRoleId);
      setSuccessMsg("Rol actualizado correctamente.");
      await loadData();
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      const raw = error.response?.data?.message || error.response?.data?.error;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo cambiar el rol."
      );
    }
  };

  const openDeleteModal = (u) => {
    if (isCurrentAccount(u)) {
      setErrorMsg("No puedes eliminar tu propia cuenta activa de SuperAdmin.");
      return;
    }
    const id = getUserId(u);
    const fullName =
      `${toSafeString(u.Nombre ?? u.nombre)} ${toSafeString(
        u.ApellidoP ?? u.apellidoP
      )}`.trim() || `#${id}`;

    setUserToDelete({
      id,
      credId: u.resolvedCredId,
      fullName,
      email: toSafeString(u.resolvedEmail),
      role: toSafeString(u.resolvedRole, "Usuario"),
    });
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await deleteEmpleado(userToDelete.id, userToDelete.credId);
      setSuccessMsg(`Registro "${userToDelete.fullName}" eliminado correctamente.`);
      setUserToDelete(null);
      await loadData();
    } catch (error) {
      console.error("Error al eliminar:", error);
      const raw = error.response?.data?.message;
      setErrorMsg(
        Array.isArray(raw)
          ? raw.join(" • ")
          : raw || "No se pudo eliminar (puede tener vehículos u horarios asignados)."
      );
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const countByRole = (roleObj) =>
    empleados.filter(
      (u) =>
        String(u.resolvedRoleId) === String(roleObj.id) ||
        normalizeRole(u.resolvedRole) === normalizeRole(roleObj.nombre)
    ).length;

  const otrosCount = empleados.filter((u) => !isAllowedRole(u.resolvedRole)).length;

  const filteredEmpleados = empleados.filter((u) => {
    if (selectedRoleFilter === "otros") {
      if (isAllowedRole(u.resolvedRole)) return false;
    } else if (selectedRoleFilter !== "todos") {
      const targetRole = allowedRoles.find(
        (r) => String(r.id) === String(selectedRoleFilter)
      );
      const matchesId = String(u.resolvedRoleId) === String(selectedRoleFilter);
      const matchesName =
        targetRole &&
        normalizeRole(u.resolvedRole) === normalizeRole(targetRole.nombre);
      if (!matchesId && !matchesName) return false;
    }

    const q = toSafeString(searchTerm).toLowerCase();
    const searchable = `${toSafeString(u.Nombre ?? u.nombre)} ${toSafeString(
      u.ApellidoP ?? u.apellidoP
    )} ${toSafeString(u.ApellidoM ?? u.apellidoM)} ${toSafeString(
      u.resolvedEmail
    )} ${toSafeString(u.resolvedRole).toLowerCase()} ${toSafeString(
      u.resolvedRfc
    ).toLowerCase()}`;

    return searchable.includes(q);
  });

  const getBadgeStyle = (roleName) => {
    const key = normalizeRole(roleName);
    if (key === "superadmin") {
      return "bg-amber-50 text-amber-800 border border-amber-200";
    }
    if (key === "admin") {
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    }
    if (key === "chofer") {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }
    if (key === "checador") {
      return "bg-sky-50 text-sky-700 border border-sky-200";
    }
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
          REGISTRO DE EMPLEADOS
        </h1>
        <p className="text-xs text-slate-500">
          Alta de Choferes, Checadores y Administradores mediante /auth/registerAdmin y /roles
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium flex justify-between items-center">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg("")} className="font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-medium flex justify-between items-center">
          <span>✓ {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg("")} className="font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Formulario de Registro de Empleados */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#123254] mb-4">
          Nuevo Empleado (Chofer / Checador / Admin)
        </h2>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre(s) *
              </label>
              <input
                type="text"
                placeholder="Ej. Carlos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Apellido Paterno *
              </label>
              <input
                type="text"
                placeholder="Ej. Ramírez"
                value={apellidoP}
                onChange={(e) => setApellidoP(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Apellido Materno
              </label>
              <input
                type="text"
                placeholder="Ej. López"
                value={apellidoM}
                onChange={(e) => setApellidoM(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rol del Empleado *
              </label>
              <select
                value={idRol}
                onChange={(e) => setIdRol(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#123254]"
              >
                {allowedRoles.length === 0 && <option value="">Cargando roles...</option>}
                {allowedRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Localidad *
              </label>
              {localidades.length > 0 ? (
                <select
                  value={idLocalidad}
                  onChange={(e) => setIdLocalidad(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
                >
                  {localidades.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={1}
                  value={idLocalidad}
                  onChange={(e) => setIdLocalidad(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="empleado_correo"
                autoComplete="off"
                placeholder="empleado@chapulgo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                name="empleado_password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RFC (Opcional)
              </label>
              <input
                type="text"
                maxLength={13}
                placeholder="Ej. RALC950101ABC"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código Postal (Opcional)
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="Ej. 42280"
                value={cp}
                onChange={(e) => setCp(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div className="flex sm:justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isSaving ? "Registrando..." : "Registrar Empleado"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tabla con Filtro Desplegable por Rol */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#123254]">
              Empleados Registrados ({filteredEmpleados.length})
            </h2>
            <p className="text-[11px] text-slate-400">
              Filtra por puesto o busca por nombre, correo o RFC
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
            >
              <option value="todos">Todos los roles ({empleados.length})</option>
              {allowedRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} ({countByRole(r)})
                </option>
              ))}
              {otrosCount > 0 && (
                <option value="otros">Otros / Prueba ({otrosCount})</option>
              )}
            </select>

            <input
              type="text"
              placeholder="Buscar por nombre, correo o RFC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cargando empleados...
          </div>
        ) : filteredEmpleados.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay empleados registrados con este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">NOMBRE COMPLETO</th>
                  <th className="py-3 px-3">CORREO</th>
                  <th className="py-3 px-3">ROL ACTUAL</th>
                  <th className="py-3 px-3">CAMBIAR ROL</th>
                  <th className="py-3 px-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmpleados.map((u, idx) => {
                  const id = getUserId(u) ?? idx + 1;
                  const fullName = [
                    toSafeString(u.Nombre ?? u.nombre),
                    toSafeString(u.ApellidoP ?? u.apellidoP),
                    toSafeString(u.ApellidoM ?? u.apellidoM),
                  ]
                    .filter((s) => s && s !== "N/A")
                    .join(" ");

                  const isCurrent = isCurrentAccount(u);

                  return (
                    <tr key={id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-400 font-medium"># {id}</td>
                      <td className="py-3 px-3 font-bold text-[#123254]">
                        {fullName || "Sin nombre"}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {toSafeString(u.resolvedEmail) || (
                          <span className="text-slate-400 italic">Sin correo</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getBadgeStyle(
                            u.resolvedRole
                          )}`}
                        >
                          {toSafeString(u.resolvedRole, "Usuario")}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={
                            allowedRoles.some(
                              (r) => String(r.id) === String(u.resolvedRoleId)
                            )
                              ? String(u.resolvedRoleId)
                              : ""
                          }
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(id, e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254] disabled:opacity-40"
                        >
                          <option value="" disabled>
                            Seleccionar rol
                          </option>
                          {allowedRoles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-semibold">
                            Sesión actual
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(u)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/70 text-rose-600 hover:bg-rose-600 hover:text-white text-[11px] font-semibold transition"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Personalizado de Confirmación */}
      {userToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isDeleting && setUserToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 text-lg font-extrabold">
                !
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#123254]">
                  ¿Eliminar este registro?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Vas a eliminar a{" "}
                  <strong className="text-slate-800">{userToDelete.fullName}</strong>{" "}
                  (#{userToDelete.id} • {userToDelete.role})
                  {userToDelete.email ? ` (${userToDelete.email})` : ""}. Esta acción
                  no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}