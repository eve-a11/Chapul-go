import { IconLock } from "./PublicIcons";

export default function PublicNavTab({
  label,
  Icon,
  isActive,
  isLocked = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`nav-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      title={isLocked ? "Inicia sesión para acceder a este apartado" : label}
    >
      <Icon />
      <span className="nav-item-label">
        {label}
        {isLocked && <IconLock />}
      </span>
    </button>
  );
}