import PublicHeroSearch from "../../molecules/public/PublicHeroSearch";

export default function PublicHeroBanner({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}) {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl bg-[#081633] px-6 py-10 sm:px-12 sm:py-14 text-white shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-10">
        {/* Columna izquierda */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight text-white">
            CHAPUL-
            <span className="block">GO</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg font-bold text-white">
            Movilidad clara, segura y cercana
          </p>
          <p className="mt-2 max-w-xs text-xs sm:text-sm text-slate-300">
            Encuentra tu ruta y llega más fácil a tu destino.
          </p>
        </div>

        {/* Columna derecha */}
        <div className="flex justify-center md:justify-end">
          <PublicHeroSearch
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearchSubmit}
          />
        </div>
      </div>
    </section>
  );
}