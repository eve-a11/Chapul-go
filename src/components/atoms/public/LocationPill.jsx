export default function LocationPill({ location = "Chapulhuacán" }) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#081633] shadow-sm">
      <span className="h-2 w-2 rounded-full bg-[#081633]" />
      <span>{location}</span>
    </div>
  );
}