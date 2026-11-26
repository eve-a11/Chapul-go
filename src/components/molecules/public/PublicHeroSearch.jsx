import { IconBuscar } from "../../atoms/public/PublicIcons";

export default function PublicHeroSearch({ value, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="hero-search-container">
      <div className="search-input-wrapper">
        <IconBuscar />
        <input
          type="text"
          placeholder="Buscar ruta o parada"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-input"
        />
      </div>
      <button type="submit" className="btn-search">
        Buscar ruta
      </button>
    </form>
  );
}