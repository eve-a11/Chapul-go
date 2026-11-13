export default function PublicNavTab({ icon, label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
        isActive
          ? "bg-white text-[#081633] shadow-sm"
          : "text-slate-200 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="whitespace-nowrap leading-tight">{label}</span>
    </button>
  );
}