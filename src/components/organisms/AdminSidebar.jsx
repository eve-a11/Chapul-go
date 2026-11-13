import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  clearAuthSession,
  getStoredUser,
  getUserRoleName,
} from "../../utils/authSession";

const NAV_ITEMS = [
  { label: "Panel de control", to: "/admin", end: true },
  { label: "Rutas", to: "/admin/rutas" },
  { label: "Vehículos", to: "/admin/vehiculos" },
  { label: "Registro de Empleados", to: "/admin/empleados" },
  { label: "Horarios", to: "/admin/horarios" },
  { label: "Objetos perdidos", to: "/admin/objetos-perdidos" },
  { label: "Reportes", to: "/admin/reportes" },
  { label: "Configuración", to: "/admin/configuracion" },
];

export default function AdminSidebar() {
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Leer datos del usuario conectado desde authSession.js
  const user = getStoredUser() || {};
  const email = user?.email || user?.Email || user?.correo || "admin@chapulgo.com";
  const rawName =
    user?.nombre ||
    user?.Nombre ||
    user?.name ||
    (email ? email.split("@")[0] : "Admin");

  const displayName =
    rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleName = getUserRoleName() || "SuperAdministrador";

  const handleLogout = () => {
    clearAuthSession();
    // Redirige a "/" (Login) limpiando el historial y reiniciando el estado en memoria
    window.location.replace("/");
  };

  return (
    <aside className="flex min-h-screen w-64 flex-col justify-between bg-[#0d2544] text-white">
      <div>
        {/* Encabezado de marca */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 shadow-inner">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h8m-8 4h8m-6 4h4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-white">
              CHAPUL-GO
            </h1>
            <p className="text-xs text-slate-300">Gestión Operativa</p>
          </div>
        </div>

        {/* Navegación principal */}
        <div className="px-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Administración
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-100 text-[#0d2544] shadow-sm"
                      : "text-slate-200 hover:bg-white/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Perfil estilo Netflix + Cierre de sesión seguro */}
      <div className="border-t border-white/10 p-4 space-y-3">
        {/* Tarjeta del perfil activo */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
          {/* Avatar cuadrado con degradado estilo perfil Netflix */}
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-sm font-extrabold text-white shadow-md">
              {initials}
            </div>
            {/* Puntito verde de sesión activa */}
            <span
              title="Sesión activa"
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d2544] bg-emerald-400"
            />
          </div>

          {/* Nombre, rol y correo */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {displayName}
            </p>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              ★ {roleName}
            </span>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {email}
            </p>
          </div>
        </div>

        {/* Botón de Cerrar sesión con confirmación rápida */}
        {!confirmLogout ? (
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        ) : (
          <div className="rounded-xl border border-rose-400/30 bg-rose-950/40 p-2.5 text-center">
            <p className="mb-2 text-xs font-medium text-rose-200">
              ¿Salir del panel operativo?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-lg bg-white/10 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-lg bg-rose-600 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
              >
                Sí, salir
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}