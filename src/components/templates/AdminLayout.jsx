import { useState } from "react";
import AdminSidebar from "../organisms/AdminSidebar";

export default function AdminLayout({ activeItem, onSelectMenu, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  let adminEmail = "admin@chapulgo.com";
  try {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    if (stored.email) adminEmail = stored.email;
  } catch {
    // Ignorar error de parseo
  }

  const handleSelect = (item) => {
    setMobileMenuOpen(false);
    onSelectMenu(item);
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Sidebar fijo en escritorio */}
      <div className="hidden md:flex md:shrink-0">
        <AdminSidebar activeItem={activeItem} onSelect={onSelectMenu} />
      </div>

      {/* Drawer lateral deslizable en móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="h-full flex shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar activeItem={activeItem} onSelect={handleSelect} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 md:h-screen">
        {/* Barra superior compacta */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 lg:px-7 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa solo visible en celular */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              className="md:hidden p-2 -ml-1 rounded-xl border border-slate-200 text-[#123254] hover:bg-slate-100 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">Sistema conectado • API Chapul-Go</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{adminEmail}</p>
              <p className="text-[11px] text-[#123254] font-medium">SuperAdministrador</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#123254] text-white font-bold text-xs flex items-center justify-center uppercase">
              {adminEmail.charAt(0)}
            </div>
          </div>
        </header>

        {/* Área de trabajo fluida a ancho completo */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}