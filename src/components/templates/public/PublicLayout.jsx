import AdminSidebar from "../organisms/AdminSidebar";

import { getStoredUser, getUserRoleName } from "../../utils/authSession";

export default function AdminLayout({ activeItem, onSelectMenu, children }) {
  const stored = getStoredUser() || {};
  const adminEmail =
    stored.email || stored.Email || stored.correo || "admin@chapulgo.com";
  const roleName = getUserRoleName() || "SuperAdministrador";

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-slate-100/70 text-slate-800">
      <AdminSidebar activeItem={activeItem} onSelect={onSelectMenu} />

      <div className="flex-1 flex flex-col min-w-0 md:h-screen relative">
        {/* Barra superior ejecutiva */}
        <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-5 lg:px-7 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistema conectado
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline font-medium text-slate-500">
              API Chapul-Go v1
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {adminEmail}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">
                {roleName}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d2544] to-[#1e4e8c] text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-sm border border-[#123254]/20">
              {adminEmail.charAt(0)}
            </div>
          </div>
        </header>

        {/* Área de trabajo fluida a ancho completo */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="w-full">{children}</div>
        </main>

        {/* Chatbot Administrativo disponible en todos los módulos */}
        <AdminChatbot />
      </div>
    </div>
  );
}