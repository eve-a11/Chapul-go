import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../../utils/authSession";

export default function PublicNavbar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isLoggedIn = Boolean(user && Object.keys(user).length > 0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    setActiveTab("inicio");
    navigate("/login");
  };

  const navItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
        </svg>
      ),
    },
    {
      id: "objetos",
      label: "Objetos perdidos",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a4 4 0 0 1 8 0v2" />
        </svg>
      ),
    },
    {
      id: "calificacion",
      label: "Calificación",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      id: "rutas",
      label: "Rutas",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="cg-navbar">
      <div className="cg-navbar-inner">
        <button
          type="button"
          className="cg-brand"
          onClick={() => setActiveTab("inicio")}
        >
          CHAPUL-GO
        </button>

        <nav className="cg-nav-group">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`cg-nav-item ${activeTab === item.id ? "is-active" : ""}`}
            >
              <span className="cg-nav-icon">{item.icon}</span>
              <span className="cg-nav-label">{item.label}</span>
            </button>
          ))}

          {isLoggedIn ? (
            <div className="cg-user-actions">
              <button
                type="button"
                className="cg-profile-btn is-logged"
                title={`Sesión activa: ${user?.nombre || user?.correo || "Usuario"}`}
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.8-3.6 5-5 8-5s6.2 1.4 8 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="cg-logout-mini"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="cg-profile-btn"
              title="Iniciar sesión o registrarse"
              onClick={() => navigate("/login", { state: { fromTab: activeTab } })}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.8-3.6 5-5 8-5s6.2 1.4 8 5" />
              </svg>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}