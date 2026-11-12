import { useState, useEffect } from "react";
import {
  getRoles,
  getLocalidades,
  getEmpleadosConRol,
  registerEmpleado,
  updateEmpleadoRole,
  deleteEmpleado,
} from "../../services/empleadosService";

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

  const [selectedRoleFilter, setSelectedRoleFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const getUserId = (u) => u?.idUser ?? u?.id_User ?? u?.id_user ?? u?.id;

  const getDefaultEmpleadoRoleId = (rolesList) => {
    const chofer = rolesList.find((r) =>
      String(r.nombre).toLowerCase().includes("chofer")
    );
    return chofer ? String(chofer.id) : rolesList[0] ? String(rolesList[0].id) : "";
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
      const roleSelected = roles.find((r) => String(r.id) === String(idRol));
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

  const handleDelete = async (u) => {
    const id = getUserId(u);
    const fullName =
      `${toSafeString(u.Nombre ?? u.nombre)} ${toSafeString(
        u.ApellidoP ?? u.apellidoP
      )}`.trim() || `#${id}`;
    if (!window.confirm(`¿Eliminar al empleado ${fullName}?`)) return;

    try {
      await deleteEmpleado(id);
      setSuccessMsg(`Empleado ${fullName} eliminado.`);
      await loadData();
    } catch (error) {
      console.error("Error al eliminar:", error);
      const raw = error.response?.data?.message;
      setErrorMsg(
        Array.isArray(raw) ? raw.join(" • ") : raw || "No se pudo eliminar el empleado."
      );
    }
  };

  // Evita opciones repetidas si /roles trae registros duplicados
  const uniqueRoles = roles.filter(
    (r, index, self) =>
      index === self.findIndex((t) => t.nombre.toLowerCase() === r.nombre.toLowerCase())
  );

  const countByRole = (roleObj) =>
    empleados.filter(
      (u) =>
        String(u.resolvedRoleId) === String(roleObj.id) ||
        toSafeString(u.resolvedRole).toLowerCase() === roleObj.nombre.toLowerCase()
    ).length;

  const filteredEmpleados = empleados.filter((u) => {
    if (selectedRoleFilter !== "todos") {
      const targetRole = uniqueRoles.find(
        (r) => String(r.id) === String(selectedRoleFilter)
      );
      const matchesId = String(u.resolvedRoleId) === String(selectedRoleFilter);
      const matchesName =
        targetRole &&
        toSafeString(u.resolvedRole).toLowerCase() === targetRole.nombre.toLowerCase();
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

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
          REGISTRO DE EMPLEADOS
        </h1>
        <p className="text-xs text-slate-500">
          Alta de Choferes, Checadores y personal operativo mediante /auth/registerAdmin y /roles
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-medium flex justify-between">
          <span>✓ {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg("")} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Formulario de Registro de Empleados */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#123254] mb-4">
          Nuevo Empleado (Chofer / Checador)
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
                {uniqueRoles.length === 0 && <option value="">Cargando roles...</option>}
                {uniqueRoles.map((r) => (
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
              {uniqueRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} ({countByRole(r)})
                </option>
              ))}
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

                  const roleLower = toSafeString(u.resolvedRole).toLowerCase();
                  const isChofer = roleLower.includes("chofer");
                  const isChecador = roleLower.includes("checador");

                  return (
                    <tr key={id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-400 font-medium"># {id}</td>
                      <td className="py-3 px-3 font-bold text-[#123254]">
                        {fullName || "Sin nombre"}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {toSafeString(u.resolvedEmail, "—")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isChofer
                              ? "bg-emerald-50 text-emerald-700"
                              : isChecador
                              ? "bg-sky-50 text-sky-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {toSafeString(u.resolvedRole, "Usuario")}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={u.resolvedRoleId ?? ""}
                          onChange={(e) => handleRoleChange(id, e.target.value)}
                          className="px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#123254]"
                        >
                          {!u.resolvedRoleId && <option value="">Seleccionar rol</option>}
                          {uniqueRoles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="text-rose-600 font-semibold hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}