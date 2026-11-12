const COLOR_VARIANTS = {
  navy: {
    badge: "bg-[#123254]/10 text-[#123254]",
    value: "text-[#123254]",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-600",
    value: "text-slate-800",
  },
  amber: {
    badge: "bg-amber-50 text-amber-600",
    value: "text-slate-800",
  },
  blue: {
    badge: "bg-blue-50 text-blue-600",
    value: "text-slate-800",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "navy",
}) {
  const styles = COLOR_VARIANTS[variant] || COLOR_VARIANTS.navy;
  const formattedValue =
    typeof value === "number" && value < 10 ? `0${value}` : value;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className={`text-3xl font-extrabold mt-2 tracking-tight ${styles.value}`}>
            {formattedValue}
          </div>
        </div>

        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${styles.badge}`}>
            {icon}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
          {subtitle}
        </p>
      )}
    </div>
  );
}