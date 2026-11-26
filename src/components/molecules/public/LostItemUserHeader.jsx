export default function LostItemUserHeader({ usuario }) {
  const nombre = usuario?.nombre || 'Usuario Chapul-Go';
  const idUsuario = usuario?.id || usuario?.id_usuario || 1;

  const palabras = nombre.trim().split(/\s+/);
  const iniciales =
    palabras.length >= 2
      ? `${palabras[0][0]}${palabras[1][0]}`.toUpperCase()
      : nombre.slice(0, 2).toUpperCase();

  return (
    <>
      <div className="cg-lost-banner" />

      <div className="cg-lost-avatar-wrap">
        <div className="cg-lost-avatar">
          {iniciales}
          <span className="cg-lost-verified" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      <div className="cg-lost-user-meta">
        <h2 className="cg-lost-user-name">{nombre}</h2>
        <p className="cg-lost-user-role">Pasajero · ID Usuario #{idUsuario}</p>
      </div>
    </>
  );
}