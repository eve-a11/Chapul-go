export default function LocationPill({ label = "Chapulhuacán" }) {
  return (
    <div className="location-pill">
      <span className="dot">•</span> {label}
    </div>
  );
}