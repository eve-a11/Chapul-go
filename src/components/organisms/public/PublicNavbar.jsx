import PublicNavTab from "../../atoms/public/PublicNavTab";
import LocationPill from "../../atoms/public/LocationPill";

export const PUBLIC_NAV_ITEMS = [
  {
    id: "inicio",
    label: "Inicio",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    id: "tarifas",
    label: "Tarifas",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    ),
  },
  {
    id: "rutas",
    label: "Rutas",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    id: "horarios",
    label: "Horarios",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    id: "ayuda",
    label: "Ayuda",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5a2.5 2.5 0 014.87.8c0 1.7-2.37 2.2-2.37 3.7m.03 3h.01" />
      </svg>
    ),
  },
  {
    id: "calificacion",
    label: "Calificación",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    id: "comentarios",
    label: "Comentarios",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8l3.5-3H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2v3z" />
      </svg>
    ),
  },
  {
    id: "objetos",
    label: "Objetos perdidos",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-5-9 5m18 0l-9 5m9-5v8l-9 5m0-8L3 8m9 5v8m-9-13v8l9 5" />
      </svg>
    ),
  },
];

export default function PublicNavbar({
  activeTab,
  onSelectTab,
  locationName,
  loggedIn,
  userName,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#081633] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo apilado CHAPUL-GO */}
        <button
          type="button"
          onClick={() => onSelectTab("inicio")}
          className="shrink-0 text-left leading-none transition hover:opacity-90"
        >
          <span className="block text-base sm:text-lg font-black tracking-wide text-white">
            CHAPUL-
          </span>
          <span className="block text-center text-base sm:text-lg font-black tracking-wide text-white">
            GO
          </span>
        </button>

        {/* Menú de 8 apartados */}
        <nav className="flex flex-1 items-center justify-start lg:justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <PublicNavTab
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.id}
              onClick={() => onSelectTab(item.id)}
            />
          ))}
        </nav>

        {/* Píldora de localidad + Cerrar sesión */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="hidden sm:block">
            <LocationPill location={locationName} />
          </div>

          {loggedIn && (
            <button
              type="button"
              onClick={onLogout}
              title={`Cerrar sesión (${userName})`}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-rose-500 hover:bg-rose-600 hover:text-white"
            >
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
}