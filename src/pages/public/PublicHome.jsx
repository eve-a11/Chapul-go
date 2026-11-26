import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapaRuta from '../../components/organisms/public/MapaRuta';
import ObjetosPerdidosForm from '../../components/organisms/public/ObjetosPerdidosForm';
import CalificacionForm from '../../components/organisms/public/CalificacionForm';
import ProximasSalidasView from '../../components/organisms/public/ProximasSalidasView';
import TarifaModal from '../../components/organisms/public/TarifaModal';
import BotpressChat from '../../components/organisms/public/BotpressChat';
import iglesiaImg from './iglesia.jpeg';
import rioImg from './02.jpg';
import './PublicHome.css';

const SALIDAS_INICIALES = [
  {
    id: 1,
    estado: 'Próximo servicio',
    tipoPunto: 'verde',
    ruta: 'El Rayo → Chapulhuacán',
    hora: '08:35',
    faltante: 'En 08 min',
    unidad: 'Combi #07',
    operador: 'Unidad en base El Rayo',
    tarifa: '$35.00 MXN',
  },
  {
    id: 2,
    estado: 'Siguiente salida',
    tipoPunto: 'azul',
    ruta: 'Chapulhuacán → El Rayo',
    hora: '09:05',
    faltante: 'En 38 min',
    unidad: 'Combi #04',
    operador: 'Base Centro Chapulhuacán',
    tarifa: '$35.00 MXN',
  },
  {
    id: 3,
    estado: 'Programada',
    tipoPunto: 'gris',
    ruta: 'El Rayo → Chapulhuacán',
    hora: '09:35',
    faltante: 'En 1 h 08 min',
    unidad: 'Combi #11',
    operador: 'Base El Rayo',
    tarifa: '$35.00 MXN',
  },
];

// Lee el usuario desde localStorage (compatible con distintos nombres de clave de tu Login)
function obtenerUsuarioLogueado() {
  try {
    const claves = ['user', 'usuario', 'chapulgo_user', 'userData'];
    for (const clave of claves) {
      const raw = localStorage.getItem(clave);
      if (raw) {
        const parsed = JSON.parse(raw);
        const data = parsed?.user || parsed?.usuario || parsed;
        const nombre =
          data?.nombre ||
          data?.name ||
          data?.username ||
          data?.correo ||
          data?.email;
        if (nombre) {
          return { ...data, nombre: String(nombre).trim() };
        }
      }
    }

    const nombreDirecto =
      localStorage.getItem('nombre') || localStorage.getItem('userName');
    if (nombreDirecto) {
      return { nombre: nombreDirecto.trim() };
    }

    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const nombreToken =
        payload?.nombre || payload?.name || payload?.username || payload?.email;
      if (nombreToken) {
        return { ...payload, nombre: String(nombreToken).trim() };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export default function PublicHome() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [usuario, setUsuario] = useState(() => obtenerUsuarioLogueado());
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [modalBloqueo, setModalBloqueo] = useState(null);
  const [modalTarifas, setModalTarifas] = useState(false);
  const [salidaDetalle, setSalidaDetalle] = useState(null);

  const navigate = useNavigate();

  // Sincronizar sesión al volver del login o entre pestañas
  useEffect(() => {
    const syncAuth = () => setUsuario(obtenerUsuarioLogueado());
    window.addEventListener('storage', syncAuth);
    window.addEventListener('focus', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
    };
  }, []);

  const inicialUsuario = usuario?.nombre
    ? usuario.nombre.charAt(0).toUpperCase()
    : '';

  // Navegación protegida para Objetos perdidos y Calificación
  const handleSelectTab = (tab) => {
    setMenuPerfilAbierto(false);
    if ((tab === 'objetos' || tab === 'calificacion') && !usuario) {
      setModalBloqueo(tab);
      return;
    }
    setActiveTab(tab);
  };

  const handleCerrarSesion = () => {
    ['token', 'user', 'usuario', 'chapulgo_user', 'userData', 'nombre', 'userName'].forEach(
      (k) => localStorage.removeItem(k)
    );
    setUsuario(null);
    setMenuPerfilAbierto(false);
    if (activeTab === 'objetos' || activeTab === 'calificacion') {
      setActiveTab('inicio');
    }
  };

  return (
    <div className="cg-public-layout">
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <header className="cg-navbar">
        <div className="cg-navbar-inner">
          <button
            type="button"
            className="cg-brand"
            onClick={() => handleSelectTab('inicio')}
          >
            CHAPUL-GO
          </button>

          <nav className="cg-nav-links" aria-label="Navegación principal">
            <button
              type="button"
              className={`cg-nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
              onClick={() => handleSelectTab('inicio')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Inicio</span>
            </button>

            <button
              type="button"
              className={`cg-nav-item ${activeTab === 'objetos' ? 'active' : ''} ${
                !usuario ? 'locked' : ''
              }`}
              onClick={() => handleSelectTab('objetos')}
              title={!usuario ? 'Inicia sesión para ver objetos perdidos' : 'Objetos perdidos'}
            >
              <div className="cg-nav-icon-wrap">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="7" width="16" height="13" rx="2" />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                </svg>
                {!usuario && (
                  <span className="cg-lock-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6 0V7a2 2 0 1 1 4 0v2h-4z" />
                    </svg>
                  </span>
                )}
              </div>
              <span>Objetos perdidos</span>
            </button>

            <button
              type="button"
              className={`cg-nav-item ${activeTab === 'calificacion' ? 'active' : ''} ${
                !usuario ? 'locked' : ''
              }`}
              onClick={() => handleSelectTab('calificacion')}
              title={!usuario ? 'Inicia sesión para calificar el servicio' : 'Calificación'}
            >
              <div className="cg-nav-icon-wrap">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5z" />
                </svg>
                {!usuario && (
                  <span className="cg-lock-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6 0V7a2 2 0 1 1 4 0v2h-4z" />
                    </svg>
                  </span>
                )}
              </div>
              <span>Calificación</span>
            </button>

            <button
              type="button"
              className={`cg-nav-item ${activeTab === 'rutas' ? 'active' : ''}`}
              onClick={() => handleSelectTab('rutas')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5z" />
              </svg>
              <span>Rutas</span>
            </button>

            {/* ICONO DE PERFIL O INICIAL DEL USUARIO LOGUEADO */}
            <div className="cg-profile-wrapper">
              {usuario ? (
                <>
                  <button
                    type="button"
                    className="cg-profile-btn logged"
                    onClick={() => setMenuPerfilAbierto((prev) => !prev)}
                    title={`Sesión iniciada como ${usuario.nombre}`}
                    aria-label={`Cuenta de ${usuario.nombre}`}
                  >
                    {inicialUsuario}
                  </button>

                  {menuPerfilAbierto && (
                    <div className="cg-profile-dropdown">
                      <div className="cg-profile-info">
                        <span className="cg-profile-greeting">Sesión activa</span>
                        <strong>{usuario.nombre}</strong>
                      </div>
                      <button
                        type="button"
                        className="cg-logout-btn"
                        onClick={handleCerrarSesion}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="cg-profile-btn"
                  onClick={() => navigate('/login')}
                  title="Iniciar sesión"
                  aria-label="Iniciar sesión"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4.5 20c1.8-3.8 5-5.5 7.5-5.5s5.7 1.7 7.5 5.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* 1. VISTA DE INICIO */}
      {activeTab === 'inicio' && (
        <div className="cg-home-content">
          <div className="cg-container">
            <section
              className="cg-hero-card"
              style={{
                backgroundImage: `linear-gradient(100deg, rgba(8, 20, 52, 0.96) 0%, rgba(8, 20, 52, 0.84) 46%, rgba(8, 20, 52, 0.32) 100%), url(${iglesiaImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 35%',
              }}
            >
              <div className="cg-hero-left">
                <div className="cg-hero-badge">
                  <span className="cg-hero-badge-dot" />
                  <span>Transporte Oficial · Sierra Gorda</span>
                </div>

                <h1>CHAPUL-GO</h1>
                <p className="cg-hero-subtitle">Movilidad clara, segura y cercana</p>
                <p className="cg-hero-desc">
                  Encuentra tu ruta y llega más fácil a tu destino. Filtra horarios y salidas
                  disponibles al instante.
                </p>

                <div className="cg-hero-mini-cards">
                  <button
                    type="button"
                    className="cg-mini-card"
                    onClick={() => setModalTarifas(true)}
                  >
                    <span className="cg-mini-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                      </svg>
                    </span>
                    <strong>Tarifas</strong>
                    <span>Consulta precios</span>
                  </button>

                  <button
                    type="button"
                    className="cg-mini-card"
                    onClick={() => setActiveTab('salidas')}
                  >
                    <span className="cg-mini-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M6 17l5-5-5-5M13 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <strong>Próximas salidas</strong>
                    <span>Consulta horarios</span>
                  </button>
                </div>
              </div>

              <div className="cg-hero-right">
                <div className="cg-hero-location-pill">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2" />
                  </svg>
                  <span>Chapulhuacán, Hidalgo</span>
                </div>

                <button
                  type="button"
                  className="cg-search-route-btn"
                  onClick={() => handleSelectTab('rutas')}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <span>Buscar ruta</span>
                </button>
              </div>
            </section>

            {/* TABLA DE PRÓXIMAS SALIDAS */}
            <section className="cg-schedules-card">
              <div className="cg-schedules-header">
                <h2>Corridas programadas hoy</h2>
                <span>Ruta Chapulhuacán — El Rayo</span>
              </div>

              {SALIDAS_INICIALES.map((salida) => (
                <div key={salida.id} className="cg-schedule-row">
                  <div className="cg-schedule-status">
                    <span className={`cg-status-dot ${salida.tipoPunto}`} />
                    <span className={`cg-status-text ${salida.tipoPunto}`}>
                      {salida.estado}
                    </span>
                  </div>

                  <div className="cg-schedule-route">{salida.ruta}</div>

                  <div className="cg-schedule-time">{salida.hora}</div>

                  <div className="cg-schedule-eta">{salida.faltante}</div>

                  <button
                    type="button"
                    className="cg-schedule-details-btn"
                    onClick={() => setSalidaDetalle(salida)}
                  >
                    Ver detalles →
                  </button>
                </div>
              ))}
            </section>
          </div>

          <section className="cg-dark-bottom-zone">
            <div className="cg-map-section">
              <h2 className="cg-map-section-title">
                Mapa de Ruta: Chapulhuacán — El Rayo
              </h2>
              <div className="cg-embedded-map-box">
                <MapaRuta />
              </div>
            </div>

            <div className="cg-about-section">
              <div className="cg-about-text">
                <h2>Acerca de Chapulhuacán</h2>
                <p>
                  Habitada desde el siglo XV por pueblos chichimecas-pames y fundada en el siglo XVI
                  por grupos chichimecas, otomíes y mexicas, la región formó parte de un extenso
                  señorío junto con Jaltocán, Mecatlán, Cuesco, Tamazunchale, Huehuetla y Coxcatlán.
                  Tras registrarse como ayuntamiento en 1826 y 1827, el 12 de julio de 1877
                  Chapulhuacán fue elevado oficialmente a la categoría de municipio.
                </p>
                <p>
                  Situado en la Sierra Gorda (20°9&apos;33.904&quot; N, 98°54&apos;16.515&quot; O, a 922 m s. n. m.),
                  posee un relieve predominantemente serrano dentro de la Sierra Madre Oriental y la
                  subprovincia del Carso Huasteco. En hidrología pertenece a la región del Pánuco y a
                  la cuenca del río Moctezuma, presentando un clima semicálido húmedo con lluvias
                  abundantes propias de la sierra.
                </p>
              </div>

              <div className="cg-about-photo-card">
                <img
                  src={rioImg}
                  alt="Río y naturaleza de Chapulhuacán, Hidalgo"
                />
                <div className="cg-about-photo-caption">
                  Naturaleza y Ríos · Chapulhuacán, Hgo.
                </div>
              </div>
            </div>

            <footer className="cg-footer">
              <div className="cg-footer-inner">
                <div className="cg-footer-brand">CHAPUL-GO</div>

                <div className="cg-footer-meta">
                  <div className="cg-footer-contacts">
                    <span>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 7l9 6 9-6" />
                      </svg>
                      chapulgo01@gmail.com
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      771 628 9732
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
                        <circle cx="12" cy="11" r="2" />
                      </svg>
                      Chapulhuacán
                    </span>
                  </div>
                  <p className="cg-footer-copy">
                    Movilidad clara, segura y cercana para Chapulhuacán y sus comunidades. · © 2026 Chapul-Go
                  </p>
                </div>
              </div>
            </footer>
          </section>
        </div>
      )}

      {/* 2. VISTA DE OBJETOS PERDIDOS (FORMULARIO CONECTADO A LA API) */}
      {activeTab === 'objetos' && usuario && (
        <section className="cg-subpage-section">
          <ObjetosPerdidosForm />
        </section>
      )}

      {/* 3. VISTA DE CALIFICACIÓN / RESEÑAS (FORMULARIO CONECTADO A LA API) */}
      {activeTab === 'calificacion' && usuario && (
        <section className="cg-subpage-section">
          <CalificacionForm />
        </section>
      )}

      {/* 4. VISTA DE PRÓXIMAS SALIDAS */}
      {activeTab === 'salidas' && (
        <ProximasSalidasView onBack={() => setActiveTab('inicio')} />
      )}

      {/* 5. VISTA DE RUTAS */}
      {activeTab === 'rutas' && <MapaRuta />}

      {/* MODAL DE BLOQUEO PARA USUARIOS NO LOGUEADOS */}
      {modalBloqueo && (
        <div className="cg-modal-backdrop" onClick={() => setModalBloqueo(null)}>
          <div className="cg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-lock-icon">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#081434" strokeWidth="2.2">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Inicia sesión para continuar</h3>
            <p>
              La sección de{' '}
              <strong>
                {modalBloqueo === 'objetos' ? 'Objetos perdidos' : 'Calificación y reseñas'}
              </strong>{' '}
              está disponible únicamente para usuarios registrados en CHAPUL-GO.
            </p>
            <div className="cg-modal-actions">
              <button
                type="button"
                className="cg-modal-btn-cancel"
                onClick={() => setModalBloqueo(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cg-modal-btn-login"
                onClick={() => {
                  setModalBloqueo(null);
                  navigate('/login');
                }}
              >
                Ir a iniciar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TARIFAS (DISEÑO INTERACTIVO DETALLES DEL TRASLADO) */}
      <TarifaModal
        isOpen={modalTarifas}
        onClose={() => setModalTarifas(false)}
      />

      {/* MODAL DETALLE DE SALIDA */}
      {salidaDetalle && (
        <div className="cg-modal-backdrop" onClick={() => setSalidaDetalle(null)}>
          <div className="cg-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Detalle de salida</h3>
            <p>
              <strong>{salidaDetalle.ruta}</strong> ({salidaDetalle.estado})
            </p>
            <div className="cg-tarifas-list">
              <div className="cg-tarifa-row">
                <span>Hora programada</span>
                <strong>{salidaDetalle.hora} hrs ({salidaDetalle.faltante})</strong>
              </div>
              <div className="cg-tarifa-row">
                <span>Unidad asignada</span>
                <strong>{salidaDetalle.unidad}</strong>
              </div>
              <div className="cg-tarifa-row">
                <span>Punto de abordaje</span>
                <strong>{salidaDetalle.operador}</strong>
              </div>
              <div className="cg-tarifa-row">
                <span>Tarifa completa</span>
                <strong>{salidaDetalle.tarifa}</strong>
              </div>
            </div>
            <div className="cg-modal-actions">
              <button
                type="button"
                className="cg-modal-btn-cancel"
                onClick={() => setSalidaDetalle(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="cg-modal-btn-login"
                onClick={() => {
                  setSalidaDetalle(null);
                  handleSelectTab('rutas');
                }}
              >
                Ver en mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT EN ESQUINA INFERIOR DERECHA (SOLO VISTA PÚBLICA) */}
      <BotpressChat />
    </div>
  );
}