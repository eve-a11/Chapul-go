export default function PublicQuickCard({
  icon,
  title,
  description,
  badge,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col justify-between rounded-2xl bg-[#edf3fb] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1ecfa] hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#081633] transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>
          {badge && (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#081633] shadow-2xs">
              {badge}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-base font-extrabold text-[#081633]">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          {description}
        </p>
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#081633] transition-transform group-hover:translate-x-0.5">
        Consultar →
      </span>
    </button>
  );
}