import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapaRuta.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const PARADAS_INICIALES = [
  { id: 1, nombre: 'Base Centro Chapulhuacán ', coords: [-98.904513, 21.156327] },
  { id: 2, nombre: 'Base Los Arcos Chapulhuacán ', coords: [-98.908037, 21.158749] },
  { id: 3, nombre: 'El Polvorin', coords: [-98.916653, 21.169452] },
  { id: 4, nombre: 'Plan De Guadalupe', coords: [-98.927074, 21.168602] },
  { id: 5, nombre: 'UTTT', coords: [-98.930291, 21.155875] },
  { id: 6, nombre: 'Tamaulipas', coords: [-98.929869, 21.160559] },
  { id: 7, nombre: 'El Barrio', coords: [-98.935659, 21.159321] },
  { id: 8, nombre: 'Pemex', coords: [-98.939818, 21.152264] },
  { id: 9, nombre: 'El Entronque', coords: [-98.946544, 21.154639] },
  { id: 10, nombre: 'Puerto Obscuro (Parada 1)', coords: [-98.952396, 21.150270] },
  { id: 11, nombre: 'Puerto Obscuro (Parada 2)', coords: [-98.953125, 21.149005] },
  { id: 12, nombre: 'El Amolar (Parada 1)', coords: [-98.959423, 21.143583] },
  { id: 13, nombre: 'El Amolar (Parada 2)', coords: [-98.960924, 21.143885] },
  { id: 14, nombre: 'Santa Maria de Alamos (Parada 1)', coords: [-98.970323, 21.136547] },
  { id: 15, nombre: 'Santa Maria de Alamos (Parada 2)', coords: [-98.971311, 21.135483] },
  { id: 16, nombre: 'Santa Maria de Alamos (Parada 3)', coords: [-98.972664, 21.135921] },
  { id: 17, nombre: 'Las Carpas', coords: [-98.981543, 21.130005] },
  { id: 18, nombre: 'El Tejocote', coords: [-98.986073, 21.130673] },
  { id: 19, nombre: 'Santa Ana de Allende (Parada1)', coords: [-98.986078, 21.129484] },
  { id: 20, nombre: 'Santa Ana de Allende (Parada2)', coords: [-98.985125, 21.124534] },
  { id: 21, nombre: 'Santa Ana de Allende (Parada3)', coords: [-98.985940, 21.123218] },
  { id: 22, nombre: 'Santa Ana de Allende (Parada4)', coords: [-98.986411, 21.122729] },
  { id: 23, nombre: 'El Paraje', coords: [-98.991028, 21.120723] },
  { id: 24, nombre: 'El Gavilan', coords: [-99.006046, 21.127088] },
  { id: 25, nombre: 'Zacate Grande', coords: [-99.005283, 21.121618] },
  { id: 26, nombre: 'Zacate Grande (Parada 2)', coords: [-99.004389, 21.120618] },
  { id: 27, nombre: 'Zacate Grande (Parada 3)', coords: [-99.002861, 21.117171] },
  { id: 28, nombre: 'Zacate Grande (Parada 4)', coords: [-99.003279, 21.116388] },
  { id: 29, nombre: 'La Reforma de Palo Semita', coords: [-99.004390, 21.112186] },
  { id: 30, nombre: 'La Joya de Palo Semita', coords: [-99.004360, 21.103341] },
  { id: 31, nombre: 'Rancho Nuevo', coords: [-99.010626, 21.100086] },
  { id: 32, nombre: 'El Hualul (Parada 2)', coords: [-99.019114, 21.096937] },
  { id: 33, nombre: 'El Ocote', coords: [-99.019480, 21.095991] },
  { id: 34, nombre: 'Cantil del Tambor', coords: [-99.022717, 21.083710] },
  { id: 35, nombre: 'Base de combis, El Rayo', coords: [-99.033955, 21.061656] },
];

const ESTILOS_MAPA = [
  { id: 'calles', nombre: 'Calles', url: 'mapbox://styles/mapbox/streets-v12', terreno3D: false },
  { id: 'relieve', nombre: 'Relieve 3D', url: 'mapbox://styles/mapbox/outdoors-v12', terreno3D: true },
  { id: 'satelite', nombre: 'Satélite', url: 'mapbox://styles/mapbox/satellite-streets-v12', terreno3D: true },
];

const RUTAS_FRECUENTES = [
  {
    id: 'completa-ida',
    titulo: 'Chapulhuacán → El Rayo',
    subtitulo: 'Recorrido completo · 35 paradas',
    origenId: '1',
    destinoId: '35',
  },
  {
    id: 'completa-vuelta',
    titulo: 'El Rayo → Chapulhuacán',
    subtitulo: 'Regreso a base · 35 paradas',
    origenId: '35',
    destinoId: '1',
  },
  {
    id: 'tramo-uttt',
    titulo: 'Chapulhuacán → UTTT',
    subtitulo: 'Tramo escolar · 4 paradas',
    origenId: '1',
    destinoId: '5',
  },
];

const CENTRO_INICIAL = [-98.952, 21.142];
const ZOOM_INICIAL = 12.65;
const GEOJSON_VACIO = { type: 'FeatureCollection', features: [] };

function crearMarcadorProfesional(tipo, titulo) {
  const esOrigen = tipo === 'origen';
  const colorInicio = esOrigen ? '#45d416' : '#d1921f';
  const colorFin = esOrigen ? '#0c482d' : '#ff0101';
  const gradId = esOrigen ? 'grad-pin-origen' : 'grad-pin-destino';
  const etiqueta = esOrigen ? 'ORIGEN' : 'DESTINO';

  const contenedor = document.createElement('div');
  contenedor.className = 'mapbox-custom-marker';

  const badge = document.createElement('div');
  badge.className = 'mapbox-marker-badge';
  badge.innerHTML = `
    <span class="mapbox-marker-tag">${etiqueta}</span>
    ${titulo}
  `;

  const pinWrapper = document.createElement('div');
  pinWrapper.className = 'mapbox-marker-pin';

  pinWrapper.innerHTML = esOrigen
    ? `<svg viewBox="0 0 40 48" width="38" height="46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradId}" x1="8" y1="2" x2="32" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${colorInicio}"/>
            <stop offset="100%" stop-color="${colorFin}"/>
          </linearGradient>
        </defs>
        <ellipse cx="20" cy="45.5" rx="5.5" ry="1.8" fill="rgba(15,23,42,0.28)"/>
        <path d="M20 2C11.163 2 4 9.163 4 18C4 29.2 20 44 20 44C20 44 36 29.2 36 18C36 9.163 28.837 2 20 2Z" fill="url(#${gradId})" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="20" cy="18" r="8.5" fill="rgba(255,255,255,0.22)"/>
        <circle cx="20" cy="18" r="5.5" fill="#FFFFFF"/>
        <circle cx="20" cy="18" r="2.4" fill="${colorFin}"/>
      </svg>`
    : `<svg viewBox="0 0 40 48" width="38" height="46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradId}" x1="8" y1="2" x2="32" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${colorInicio}"/>
            <stop offset="100%" stop-color="${colorFin}"/>
          </linearGradient>
        </defs>
        <ellipse cx="20" cy="45.5" rx="5.5" ry="1.8" fill="rgba(15,23,42,0.28)"/>
        <path d="M20 2C11.163 2 4 9.163 4 18C4 29.2 20 44 20 44C20 44 36 29.2 36 18C36 9.163 28.837 2 20 2Z" fill="url(#${gradId})" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="20" cy="18" r="8.5" fill="rgba(255,255,255,0.2)"/>
        <path d="M16.2 12.8V24.2M16.2 13.3H24.6L22.8 16.4L24.6 19.5H16.2" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

  contenedor.appendChild(badge);
  contenedor.appendChild(pinWrapper);
  return contenedor;
}

export default function MapaRuta() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const styleReadyRef = useRef(false);
  const estiloActivoRef = useRef(ESTILOS_MAPA[0]);
  const markerOrigenRef = useRef(null);
  const markerDestinoRef = useRef(null);
  const rutaGeoJSONRef = useRef(GEOJSON_VACIO);
  const isFirstMountRef = useRef(true);

  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [estiloActivo, setEstiloActivo] = useState(ESTILOS_MAPA[0]);
  const [infoViaje, setInfoViaje] = useState(null);
  const [tabPanel, setTabPanel] = useState('rapidas');

  const origen = PARADAS_INICIALES.find((p) => p.id === Number(origenId)) || null;
  const destino = PARADAS_INICIALES.find((p) => p.id === Number(destinoId)) || null;

  const paradasDelTramo = useMemo(() => {
    if (!origen && !destino) return PARADAS_INICIALES;
    if (origen && !destino) return [origen];
    if (!origen && destino) return [destino];

    const idxOrigen = PARADAS_INICIALES.findIndex((p) => p.id === origen.id);
    const idxDestino = PARADAS_INICIALES.findIndex((p) => p.id === destino.id);

    if (idxOrigen <= idxDestino) {
      return PARADAS_INICIALES.slice(idxOrigen, idxDestino + 1);
    }
    return PARADAS_INICIALES.slice(idxDestino, idxOrigen + 1).reverse();
  }, [origen, destino]);

  useEffect(() => {
    if (origen && destino) {
      setTabPanel('paradas');
    }
  }, [origen, destino]);

  const configurarTerreno3D = useCallback((map, activar) => {
    if (!map || !styleReadyRef.current) return;
    try {
      if (activar) {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.4 });
        map.easeTo({ pitch: 35, duration: 800 });
      } else {
        map.setTerrain(null);
        map.easeTo({ pitch: 0, duration: 800 });
      }
    } catch {
      // Ignora si el estilo aún está cambiando
    }
  }, []);

  const pintarCapaRuta = useCallback((map, dataGeoJson) => {
    if (!map || !styleReadyRef.current) return;
    try {
      if (map.getSource('ruta')) {
        map.getSource('ruta').setData(dataGeoJson);
      } else {
        map.addSource('ruta', {
          type: 'geojson',
          data: dataGeoJson,
        });
        map.addLayer({
          id: 'ruta-borde',
          type: 'line',
          source: 'ruta',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 8,
            'line-opacity': 0.9,
          },
        });
        map.addLayer({
          id: 'ruta-linea',
          type: 'line',
          source: 'ruta',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#1d4ed8',
            'line-width': 5,
          },
        });
      }
    } catch {
      map.once('idle', () => pintarCapaRuta(map, rutaGeoJSONRef.current));
    }
  }, []);

  // 1. Inicializar mapa y observar tamaño del contenedor
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    styleReadyRef.current = false;

    const map = new mapboxgl.Map({
      container,
      style: ESTILOS_MAPA[0].url,
      center: CENTRO_INICIAL,
      zoom: ZOOM_INICIAL,
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    const timerResize = setTimeout(() => {
      map.resize();
    }, 150);

    map.on('style.load', () => {
      styleReadyRef.current = true;
      map.resize();
      configurarTerreno3D(map, estiloActivoRef.current.terreno3D);
      pintarCapaRuta(map, rutaGeoJSONRef.current);
    });

    return () => {
      clearTimeout(timerResize);
      resizeObserver.disconnect();
      styleReadyRef.current = false;
      markerOrigenRef.current?.remove();
      markerDestinoRef.current?.remove();
      map.remove();
    };
  }, [configurarTerreno3D, pintarCapaRuta]);

  // 2. Cambiar estilo de mapa
  const handleCambiarEstilo = (nuevoEstilo) => {
    const map = mapRef.current;
    if (!map || nuevoEstilo.id === estiloActivo.id) return;

    styleReadyRef.current = false;
    estiloActivoRef.current = nuevoEstilo;
    setEstiloActivo(nuevoEstilo);
    map.setStyle(nuevoEstilo.url);
  };

  // 3. Trazar ruta azul al elegir origen y destino
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    markerOrigenRef.current?.remove();
    markerOrigenRef.current = null;
    markerDestinoRef.current?.remove();
    markerDestinoRef.current = null;

    if (origen) {
      const elOrigen = crearMarcadorProfesional('origen', origen.nombre);
      markerOrigenRef.current = new mapboxgl.Marker({
        element: elOrigen,
        anchor: 'bottom',
      })
        .setLngLat(origen.coords)
        .addTo(map);
    }

    if (destino) {
      const elDestino = crearMarcadorProfesional('destino', destino.nombre);
      markerDestinoRef.current = new mapboxgl.Marker({
        element: elDestino,
        anchor: 'bottom',
      })
        .setLngLat(destino.coords)
        .addTo(map);
    }

    if (origen && !destino) {
      rutaGeoJSONRef.current = GEOJSON_VACIO;
      setInfoViaje(null);
      pintarCapaRuta(map, GEOJSON_VACIO);
      map.flyTo({ center: origen.coords, zoom: 15, duration: 1200 });
      return;
    }

    if (!origen && destino) {
      rutaGeoJSONRef.current = GEOJSON_VACIO;
      setInfoViaje(null);
      pintarCapaRuta(map, GEOJSON_VACIO);
      map.flyTo({ center: destino.coords, zoom: 15, duration: 1200 });
      return;
    }

    if (origen && destino) {
      let cancelado = false;

      const trazarTramo = async () => {
        const puntosMuestra =
          paradasDelTramo.length <= 25
            ? paradasDelTramo
            : paradasDelTramo.filter(
                (_, idx) =>
                  idx === 0 ||
                  idx === paradasDelTramo.length - 1 ||
                  idx % Math.ceil(paradasDelTramo.length / 23) === 0
              );

        const coordsStr = puntosMuestra
          .map((p) => `${p.coords[0]},${p.coords[1]}`)
          .join(';');
        const radios = puntosMuestra.map(() => 'unlimited').join(';');

        let geometry = null;
        let distanciaKm = null;
        let duracionMin = null;

        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&radiuses=${radios}&access_token=${mapboxgl.accessToken}`;
          const res = await fetch(url);
          const data = await res.json();
          const ruta = data.routes?.[0];

          if (ruta?.geometry) {
            geometry = ruta.geometry;
            distanciaKm = (ruta.distance / 1000).toFixed(1);
            duracionMin = Math.max(1, Math.round(ruta.duration / 60));
          }
        } catch {
          // Respaldo con trazo directo
        }

        if (cancelado) return;

        if (!geometry) {
          geometry = {
            type: 'LineString',
            coordinates: paradasDelTramo.map((p) => p.coords),
          };
          distanciaKm = (paradasDelTramo.length * 0.8).toFixed(1);
          duracionMin = Math.max(2, paradasDelTramo.length * 2);
        }

        const featureGeoJson = {
          type: 'Feature',
          properties: {},
          geometry,
        };

        rutaGeoJSONRef.current = featureGeoJson;
        pintarCapaRuta(map, featureGeoJson);

        setInfoViaje({
          distanciaKm,
          duracionMin,
        });

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(origen.coords);
        bounds.extend(destino.coords);
        geometry.coordinates.forEach((coord) => bounds.extend(coord));

        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 95, left: 370, right: 60 },
          duration: 1300,
          maxZoom: 15.5,
        });
      };

      trazarTramo();
      return () => {
        cancelado = true;
      };
    }

    rutaGeoJSONRef.current = GEOJSON_VACIO;
    setInfoViaje(null);
    pintarCapaRuta(map, GEOJSON_VACIO);
    map.flyTo({ center: CENTRO_INICIAL, zoom: ZOOM_INICIAL, duration: 1000 });
  }, [origen, destino, paradasDelTramo, pintarCapaRuta]);

  const handleInvertirRuta = () => {
    if (!origenId && !destinoId) return;
    const prevOrigen = origenId;
    setOrigenId(destinoId);
    setDestinoId(prevOrigen);
  };

  const handleLimpiar = () => {
    setOrigenId('');
    setDestinoId('');
    setTabPanel('rapidas');
  };

  const handleEnfocarParada = (coords) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: coords, zoom: 15.2, duration: 900 });
  };

  return (
    <main className="ruta-viewport">
      <div className="ruta-map-wrapper">
        <div className="map-style-switcher" role="group" aria-label="Estilo de mapa">
          {ESTILOS_MAPA.map((estilo) => {
            const activo = estiloActivo.id === estilo.id;
            return (
              <button
                key={estilo.id}
                type="button"
                onClick={() => handleCambiarEstilo(estilo)}
                className={`style-switch-btn ${activo ? 'active' : ''}`}
              >
                {estilo.nombre}
              </button>
            );
          })}
        </div>

        <aside className="ruta-floating-panel">
          <div className="panel-top-header">
            <h2 className="panel-heading">Selecciona tu recorrido</h2>

            {(origenId || destinoId) && (
              <button
                type="button"
                className="btn-reset-pill"
                onClick={handleLimpiar}
                title="Limpiar selección"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="route-inputs-card">
            <div className="route-timeline-track" aria-hidden="true">
              <span className="track-dot track-origin" />
              <span className="track-line" />
              <span className="track-dot track-dest" />
            </div>

            <div className="route-selects-stack">
              <label className="route-field">
                <span className="route-field-label">Parada de Origen</span>
                <select
                  value={origenId}
                  onChange={(e) => setOrigenId(e.target.value)}
                  className="route-select"
                >
                  <option value="">-- Selecciona punto de partida --</option>
                  {PARADAS_INICIALES.filter((p) => String(p.id) !== destinoId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="route-field">
                <span className="route-field-label">Parada de Destino</span>
                <select
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value)}
                  className="route-select"
                >
                  <option value="">-- Selecciona destino --</option>
                  {PARADAS_INICIALES.filter((p) => String(p.id) !== origenId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              className="btn-swap-route"
              onClick={handleInvertirRuta}
              disabled={!origenId && !destinoId}
              title="Invertir origen y destino"
              aria-label="Invertir origen y destino"
            >
              ⇅
            </button>
          </div>

          <div className="panel-segmented-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tabPanel === 'rapidas'}
              className={`panel-tab-btn ${tabPanel === 'rapidas' ? 'active' : ''}`}
              onClick={() => setTabPanel('rapidas')}
            >
              Rutas rápidas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tabPanel === 'paradas'}
              className={`panel-tab-btn ${tabPanel === 'paradas' ? 'active' : ''}`}
              onClick={() => setTabPanel('paradas')}
            >
              Paradas
              <span className="panel-tab-badge">{paradasDelTramo.length}</span>
            </button>
          </div>

          {tabPanel === 'rapidas' ? (
            <div className="quick-routes-list">
              {RUTAS_FRECUENTES.map((item) => {
                const esActual =
                  origenId === item.origenId && destinoId === item.destinoId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`quick-route-card ${esActual ? 'selected' : ''}`}
                    onClick={() => {
                      setOrigenId(item.origenId);
                      setDestinoId(item.destinoId);
                    }}
                  >
                    <div className="quick-route-info">
                      <span className="quick-route-title">{item.titulo}</span>
                      <span className="quick-route-sub">{item.subtitulo}</span>
                    </div>
                    <span className="quick-route-arrow">→</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="stops-timeline-list">
              {paradasDelTramo.map((parada, idx) => {
                const esPrimera = idx === 0 && origen;
                const esUltima =
                  idx === paradasDelTramo.length - 1 && destino;
                return (
                  <button
                    key={parada.id}
                    type="button"
                    className="stop-item-row"
                    onClick={() => handleEnfocarParada(parada.coords)}
                    title="Centrar parada en el mapa"
                  >
                    <span
                      className={`stop-node ${
                        esPrimera
                          ? 'node-origin'
                          : esUltima
                          ? 'node-dest'
                          : 'node-mid'
                      }`}
                    />
                    <span className="stop-item-name">{parada.nombre}</span>
                    <span className="stop-item-num">#{parada.id}</span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {origen && destino && infoViaje && (
          <div className="route-telemetry-bar">
            <div className="telemetry-status">
              <span className="telemetry-pulse" />
              TRAMO ACTIVO
            </div>

            <div className="telemetry-metrics">
              <div className="telemetry-cell">
                <span className="telemetry-label">Recorrido</span>
                <span className="telemetry-value">
                  {origen.nombre.trim()} → {destino.nombre.trim()}
                </span>
              </div>

              <div className="telemetry-cell compact highlight">
                <span className="telemetry-label">Distancia</span>
                <span className="telemetry-value">{infoViaje.distanciaKm} km</span>
              </div>

              <div className="telemetry-cell compact">
                <span className="telemetry-label">Tiempo est.</span>
                <span className="telemetry-value">~{infoViaje.duracionMin} min</span>
              </div>

              <div className="telemetry-cell compact">
                <span className="telemetry-label">Paradas</span>
                <span className="telemetry-value">{paradasDelTramo.length}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={mapContainerRef} className="mapbox-canvas" />
      </div>
    </main>
  );
}