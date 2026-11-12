import AdminSidebar from "../organisms/AdminSidebar";

export default function AdminLayout({ activeItem, onSelectMenu, children }) {
  let adminEmail = "admin@chapulgo.com";
  try {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    if (stored.email) adminEmail = stored.email;
  } catch {
    // Ignorar error de parseo
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-slate-50 text-slate-800">
      <AdminSidebar activeItem={activeItem} onSelect={onSelectMenu} />

      <div className="flex-1 flex flex-col min-w-0 md:h-screen">
        {/* Barra superior compacta */}
        <header className="h-14 bg-white border-b border-slate-200 px-5 lg:px-7 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema conectado • API Chapul-Go</span>
          </div>

          <div className="flex items-center gap-2.5">
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