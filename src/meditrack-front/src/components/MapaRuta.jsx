import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DirectionsRenderer, GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES = ['places'];

const OFFSET_M = 18;
const GRADOS_POR_METRO = 1 / 111320;

function separarSolapamientos(paradas) {
  const grupos = {};
  paradas.forEach((p, idx) => {
    const key = `${p.lat?.toFixed(5)},${p.lon?.toFixed(5)}`;
    (grupos[key] = grupos[key] ?? []).push(idx);
  });
  const resultado = paradas.map(p => ({ ...p }));
  Object.values(grupos).forEach(indices => {
    if (indices.length <= 1) return;
    const n = indices.length;
    const radio = OFFSET_M * GRADOS_POR_METRO;
    indices.forEach((idx, i) => {
      const angulo = (2 * Math.PI * i) / n - Math.PI / 2;
      resultado[idx].lat += radio * Math.cos(angulo);
      resultado[idx].lon += radio * Math.sin(angulo);
    });
  });
  return resultado;
}

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
};

const CONTAINER_STYLE = { width: '100%', height: '420px', borderRadius: '8px' };

const DIRECTIONS_OPTIONS = {
  suppressMarkers: true,
  preserveViewport: true,
  polylineOptions: {
    strokeColor: '#6366F1',
    strokeOpacity: 0.85,
    strokeWeight: 4,
    icons: [{
      icon: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 3,
      },
      offset: '0',
      repeat: '12px',
    }],
  },
};

function markerIcon(tipo) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 14,
    fillColor: tipo === 'RETIRO' ? '#059669' : '#2563EB',
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 2,
  };
}

function MapaRuta({ paradas }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const mapRef = useRef(null);
  const [paradaSeleccionada, setParadaSeleccionada] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);

  const paradasConCoords = useMemo(() =>
    separarSolapamientos(paradas.filter(p => p.lat != null && p.lon != null)),
    [paradas]
  );

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    if (paradasConCoords.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    paradasConCoords.forEach(p => bounds.extend({ lat: p.lat, lng: p.lon }));
    map.fitBounds(bounds);
  }, [paradasConCoords]);

  useEffect(() => {
    if (!isLoaded || paradasConCoords.length < 2) return;

    let cancelled = false;
    const service = new window.google.maps.DirectionsService();
    const ultimo = paradasConCoords.length - 1;

    service.route({
      origin: { lat: paradasConCoords[0].lat, lng: paradasConCoords[0].lon },
      destination: { lat: paradasConCoords[ultimo].lat, lng: paradasConCoords[ultimo].lon },
      waypoints: paradasConCoords.slice(1, ultimo).slice(0, 25).map(p => ({
        location: { lat: p.lat, lng: p.lon },
        stopover: true,
      })),
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    }, (result, status) => {
      if (!cancelled) setDirectionsResult(status === 'OK' ? result : null);
    });

    return () => { cancelled = true; };
  }, [isLoaded, paradasConCoords]);

  if (!isLoaded) {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return (
      <div style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: '8px', color: '#6b7280', fontSize: '13px', border: '1px dashed #d1d5db', padding: '20px', textAlign: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>{!online ? 'Mapa no disponible sin conexión' : 'Cargando mapa...'}</span>
      </div>
    );
  }

  if (paradasConCoords.length === 0) return null;

  const center = {
    lat: paradasConCoords.reduce((s, p) => s + p.lat, 0) / paradasConCoords.length,
    lng: paradasConCoords.reduce((s, p) => s + p.lon, 0) / paradasConCoords.length,
  };

  return (
    <div>
      <GoogleMap
        mapContainerStyle={CONTAINER_STYLE}
        center={center}
        zoom={12}
        onLoad={onLoad}
        options={MAP_OPTIONS}
        onClick={() => setParadaSeleccionada(null)}
      >
        {directionsResult && paradasConCoords.length >= 2 && (
          <DirectionsRenderer
            directions={directionsResult}
            options={DIRECTIONS_OPTIONS}
          />
        )}

        {paradasConCoords.map((p, idx) => (
          <Marker
            key={`${p.envio.id}-${p.tipo}-${idx}`}
            position={{ lat: p.lat, lng: p.lon }}
            label={{ text: String(idx + 1), color: 'white', fontWeight: 'bold', fontSize: '12px' }}
            icon={markerIcon(p.tipo)}
            onClick={() => setParadaSeleccionada({ ...p, idx })}
          />
        ))}

        {paradaSeleccionada && (
          <InfoWindow
            position={{ lat: paradaSeleccionada.lat, lng: paradaSeleccionada.lon }}
            onCloseClick={() => setParadaSeleccionada(null)}
          >
            <div style={{ fontSize: '13px', lineHeight: '1.6', minWidth: '160px' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                Parada {paradaSeleccionada.idx + 1} —{' '}
                <span style={{ color: paradaSeleccionada.tipo === 'RETIRO' ? '#059669' : '#2563EB' }}>
                  {paradaSeleccionada.tipo}
                </span>
              </div>
              <div style={{ color: '#374151' }}>
                <strong>Envío:</strong> {paradaSeleccionada.envio.id}
              </div>
              <div style={{ color: '#374151' }}>
                <strong>{paradaSeleccionada.tipo === 'RETIRO' ? 'Remitente' : 'Destinatario'}:</strong>{' '}
                {paradaSeleccionada.tipo === 'RETIRO' ? paradaSeleccionada.envio.remitente : paradaSeleccionada.envio.destinatario}
              </div>
              {paradaSeleccionada.direccion && (
                <div style={{ color: '#6b7280', marginTop: '2px', fontSize: '12px' }}>
                  {paradaSeleccionada.direccion}
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }} />
          Retiro
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'inline-block' }} />
          Entrega
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '24px', height: '3px', backgroundColor: '#6366F1', display: 'inline-block' }} />
          Recorrido
        </span>
      </div>
    </div>
  );
}

export default MapaRuta;
