export default function PublicHeroSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar ruta o parada",
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:ring-4 focus:ring-sky-300/30"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-[#dce8f8] py-3 text-sm font-extrabold text-[#081633] shadow-sm transition hover:bg-[#cdddf5] active:scale-[0.99]"
      >
        Buscar ruta
      </button>
    </form>
  );
}