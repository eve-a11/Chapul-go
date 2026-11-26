export default function PublicHeroBanner({ onOpenTarifas, onOpenHorarios, onSearchRuta }) {
  return (
    <section className="cg-hero">
      <div className="cg-hero-left">
        <h1 className="cg-hero-title">CHAPUL-GO</h1>
        <h2 className="cg-hero-subtitle">Movilidad clara, segura y cercana</h2>
        <p className="cg-hero-desc">
          Encuentra tu ruta y llega más fácil a tu destino. Filtra horarios y salidas
          disponibles al instante.
        </p>

        <div className="cg-hero-cards">
          <button type="button" className="cg-hero-card" onClick={onOpenTarifas}>
            <span className="cg-hero-card-icon">≡</span>
            <span className="cg-hero-card-title">Tarifas</span>
            <span className="cg-hero-card-sub">Consulta precios</span>
          </button>

          <button type="button" className="cg-hero-card" onClick={onOpenHorarios}>
            <span className="cg-hero-card-icon">»</span>
            <span className="cg-hero-card-title">Próximas salidas</span>
            <span className="cg-hero-card-sub">Consulta horarios</span>
          </button>
        </div>
      </div>

      <div className="cg-hero-right">
        <button type="button" className="cg-hero-search-btn" onClick={onSearchRuta}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span>Buscar ruta</span>
        </button>
      </div>
    </section>
  );
}