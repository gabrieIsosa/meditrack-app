import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnvios, getRutas, getUsuarios, createRuta, getTransportes } from '../../services/api';
import MapaRuta from '../../components/MapaRuta';


const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Genera la secuencia óptima de paradas (retiros y entregas) usando Nearest Neighbor TSP.
// Retiros y entregas son stops independientes sin restricciones de precedencia.
const planificarParadas = (envios) => {
  const paradas = [];
  envios.forEach(e => {
    if (e.latitudOrigen != null && e.longitudOrigen != null) {
      paradas.push({ tipo: 'RETIRO', envio: e, lat: e.latitudOrigen, lon: e.longitudOrigen, direccion: e.origen });
    }
    if (e.latitudDestino != null && e.longitudDestino != null) {
      paradas.push({ tipo: 'ENTREGA', envio: e, lat: e.latitudDestino, lon: e.longitudDestino, direccion: e.destino });
    }
  });

  const sinCoords = envios.filter(
    e => (e.latitudOrigen == null || e.longitudOrigen == null) && (e.latitudDestino == null || e.longitudDestino == null)
  );

  if (paradas.length === 0) {
    return sinCoords.sort((a, b) => (a.destino ?? '').localeCompare(b.destino ?? '')).flatMap(e => [
      { tipo: 'RETIRO', envio: e, lat: null, lon: null, direccion: e.origen },
      { tipo: 'ENTREGA', envio: e, lat: null, lon: null, direccion: e.destino },
    ]);
  }

  // Nearest Neighbor sobre todos los stops con coordenadas
  const pendientes = [...paradas];
  const ruta = [];
  let latActual = pendientes[0].lat;
  let lonActual = pendientes[0].lon;

  while (pendientes.length > 0) {
    let idxMasCercano = 0;
    let distMin = Infinity;
    pendientes.forEach((p, idx) => {
      const d = haversineKm(latActual, lonActual, p.lat, p.lon);
      if (d < distMin) { distMin = d; idxMasCercano = idx; }
    });
    const siguiente = pendientes.splice(idxMasCercano, 1)[0];
    ruta.push(siguiente);
    latActual = siguiente.lat;
    lonActual = siguiente.lon;
  }

  // Envíos sin coordenadas en ninguna parada se agregan al final
  sinCoords.sort((a, b) => (a.destino ?? '').localeCompare(b.destino ?? '')).forEach(e => {
    ruta.push({ tipo: 'RETIRO', envio: e, lat: null, lon: null, direccion: e.origen });
    ruta.push({ tipo: 'ENTREGA', envio: e, lat: null, lon: null, direccion: e.destino });
  });

  return ruta;
};

const ESTADO_COLORS = {
  PENDIENTE: '#6b7280',
  ASIGNADO: '#4338CA',
  EN_PREPARACION: '#f59e0b',
  EN_TRANSITO: '#3b82f6',
  EN_PUNTO_DE_ENTREGA: '#06b6d4',
  INCIDENTE_REPORTADO: '#ef4444',
  ENTREGADO: '#10b981',
  CANCELADO: '#000000',
};

function NuevaRuta() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [repartidorId, setRepartidorId] = useState('');
  const [repartidores, setRepartidores] = useState([]);
  const [todosRepartidores, setTodosRepartidores] = useState([]);
  const [todasRutas, setTodasRutas] = useState([]);

  const [transporteId, setTransporteId] = useState('');
  const [transportes, setTransportes] = useState([]);

  const [enviosDisponibles, setEnviosDisponibles] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [busquedaEnvio, setBusquedaEnvio] = useState('');
  const [loadingEnvios, setLoadingEnvios] = useState(false);

  const [paradas, setParadas] = useState([]);

  useEffect(() => {
    Promise.all([getUsuarios(), getRutas(), getTransportes('', 'ACTIVO')])
      .then(([usuarios, rutas, transportesData]) => {
        setTodosRepartidores(usuarios.filter(u => u.role === 'REPARTIDOR' && u.estadoActivo));
        setTodasRutas(rutas);
        setTransportes(transportesData);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const filtrados = todosRepartidores.filter(repartidor => {
      const tieneRutaAsignada = todasRutas.some(r =>
        r.repartidorId === repartidor.id &&
        r.fecha === fecha &&
        r.estado !== 'COMPLETADA'
      );
      return !tieneRutaAsignada;
    });
    setRepartidores(filtrados);

    if (repartidorId && !filtrados.some(r => r.id === repartidorId)) {
      setRepartidorId('');
    }
  }, [fecha, todosRepartidores, todasRutas]);

  const cargarEnviosDisponibles = async () => {
    setLoadingEnvios(true);
    try {
      const [todosEnvios, todasRutas] = await Promise.all([getEnvios(), getRutas()]);
      const enviosEnRuta = new Set(
        todasRutas.flatMap(r => r.envios?.map(re => re.envio?.id).filter(Boolean) ?? [])
      );
      setEnviosDisponibles(
        todosEnvios.filter(e => e.estado === 'PENDIENTE' && !enviosEnRuta.has(e.id))
      );
    } catch {
      setError('Error al cargar envíos disponibles');
    } finally {
      setLoadingEnvios(false);
    }
  };

  const avanzarPaso1 = () => {
    if (!fecha) { setError('Seleccioná una fecha'); return; }
    if (!repartidorId) { setError('Seleccioná un repartidor'); return; }
    if (!transporteId) { setError('Seleccioná un transporte'); return; }
    setError('');
    cargarEnviosDisponibles();
    setPaso(2);
  };

  const toggleSeleccion = (envio) => {
    setSeleccionados(prev =>
      prev.some(e => e.id === envio.id)
        ? prev.filter(e => e.id !== envio.id)
        : [...prev, envio]
    );
  };

  const avanzarPaso2 = () => {
    if (seleccionados.length === 0) { setError('Seleccioná al menos un envío'); return; }
    setError('');
    setParadas(planificarParadas(seleccionados));
    setPaso(3);
  };

  const moverArriba = (idx) => {
    if (idx === 0) return;
    const nuevo = [...paradas];
    [nuevo[idx - 1], nuevo[idx]] = [nuevo[idx], nuevo[idx - 1]];
    setParadas(nuevo);
  };

  const moverAbajo = (idx) => {
    if (idx === paradas.length - 1) return;
    const nuevo = [...paradas];
    [nuevo[idx], nuevo[idx + 1]] = [nuevo[idx + 1], nuevo[idx]];
    setParadas(nuevo);
  };

  const confirmarCreacion = async () => {
    setGuardando(true);
    setError('');
    try {
      const retiroOrdenPorEnvio = {};
      const entregaOrdenPorEnvio = {};
      paradas.forEach((p, idx) => {
        if (p.tipo === 'RETIRO') {
          retiroOrdenPorEnvio[p.envio.id] = idx + 1;
        } else if (p.tipo === 'ENTREGA') {
          entregaOrdenPorEnvio[p.envio.id] = idx + 1;
        }
      });
      await createRuta({
        fecha,
        repartidorId,
        transporteId,
        envios: seleccionados.map(e => ({
          envioId: e.id,
          retiroOrden: retiroOrdenPorEnvio[e.id] ?? 999,
          entregaOrden: entregaOrdenPorEnvio[e.id] ?? 999,
        })),
      });
      navigate('/rutas', { state: { success: true } });
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const enviosFiltrados = enviosDisponibles.filter(e => {
    const term = busquedaEnvio.toLowerCase();
    return (
      e.id.toLowerCase().includes(term) ||
      e.destinatario?.toLowerCase().includes(term) ||
      e.destino?.toLowerCase().includes(term)
    );
  });

  const getNombreTransporte = (id) => {
    const t = transportes.find(t => String(t.id) === String(id));
    return t ? `${t.patente} - ${t.tipoVehiculo}` : id;
  };

  return (
    <div className="container">
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Nueva ruta</h1>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '32px 60px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          alignItems: 'flex-start',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {[
            { n: 1, label: 'Fecha y repartidor' },
            { n: 2, label: 'Seleccionar envíos' },
            { n: 3, label: 'Confirmar orden' },
          ].map(({ n, label }) => {
            const completado = paso > n;
            const actual = paso === n;
            const circuloColor = completado ? '#10B981' : actual ? '#2563EB' : 'white';
            const bordColor = completado ? '#10B981' : actual ? '#2563EB' : '#D1D5DB';
            const textoColor = completado ? '#10B981' : actual ? '#2563EB' : '#9CA3AF';
            const lineaColor = completado ? '#10B981' : '#E5E7EB';

            return (
              <div key={n} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
                zIndex: 3,
              }}>
                {n < 3 && (
                  <div style={{
                    position: 'absolute',
                    top: '17px',
                    left: '50%',
                    width: '100%',
                    height: '3px',
                    backgroundColor: lineaColor,
                    zIndex: 1,
                    transition: 'background-color 0.3s',
                  }} />
                )}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: circuloColor,
                  border: `2px solid ${bordColor}`,
                  color: completado || actual ? 'white' : '#9CA3AF',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  marginBottom: '12px',
                  transition: 'all 0.3s',
                  zIndex: 2,
                  position: 'relative',
                }}>
                  {completado ? '✓' : n}
                </div>
                <span style={{
                  fontSize: '10px',
                  textAlign: 'center',
                  fontWeight: actual ? '800' : '500',
                  color: textoColor,
                  textTransform: 'uppercase',
                  maxWidth: '90px',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {paso === 1 && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: '#111827' }}>
            Definir fecha y repartidor
          </h2>

          <div className="form-group">
            <label>Fecha de la ruta *</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Repartidor *</label>
            <select
              value={repartidorId}
              onChange={e => setRepartidorId(e.target.value)}
            >
              <option value="">Seleccionar repartidor...</option>
              {repartidores.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            {repartidores.length === 0 && (
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                No hay repartidores disponibles en este momento
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Transporte *</label>
            <select
              value={transporteId}
              onChange={e => setTransporteId(e.target.value)}
            >
              <option value="">Seleccionar transporte...</option>
              {transportes.map(t => (
                <option key={t.id} value={t.id}>{t.patente} - {t.tipoVehiculo}</option>
              ))}
            </select>
            {transportes.length === 0 && (
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                No hay transportes disponibles en este momento
              </p>
            )}
          </div>


          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-new-shipment" onClick={avanzarPaso1}>
              SIGUIENTE
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              Seleccionar envíos ({seleccionados.length} seleccionados)
            </h2>
            <input
              className="search-input"
              style={{ margin: 0, width: '280px' }}
              placeholder="Buscar por ID, destinatario, dirección..."
              value={busquedaEnvio}
              onChange={e => setBusquedaEnvio(e.target.value)}
            />
          </div>

          {loadingEnvios ? (
            <p style={{ padding: '20px', color: '#6b7280' }}>Cargando envíos disponibles...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Tracking ID</th>
                  <th>Destinatario</th>
                  <th>Dirección entrega</th>
                  <th>Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {enviosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No hay envíos disponibles para enrutar
                    </td>
                  </tr>
                ) : (
                  enviosFiltrados.map(e => {
                    const marcado = seleccionados.some(s => s.id === e.id);
                    return (
                      <tr
                        key={e.id}
                        onClick={() => toggleSeleccion(e)}
                        style={{ cursor: 'pointer', backgroundColor: marcado ? '#EFF6FF' : 'transparent' }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={marcado} onChange={() => toggleSeleccion(e)} onClick={ev => ev.stopPropagation()} />
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#2563EB' }}>{e.id}</td>
                        <td>{e.destinatario}</td>
                        <td style={{ fontSize: '13px', color: '#6b7280' }}>{e.destino}</td>
                        <td>
                          {e.prioridad && (
                            <span className="status-tag" style={{ backgroundColor: '#FEF3C720', color: '#D97706' }}>
                              {e.prioridad}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setPaso(1)}>ANTERIOR</button>
            <button className="btn-new-shipment" onClick={avanzarPaso2}>
              SUGERIR ORDEN Y CONTINUAR
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              Confirmar secuencia de paradas
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Secuencia sugerida por proximidad geográfica (vecino más cercano) sobre retiros y entregas. Usá las flechas para ajustarla.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <MapaRuta paradas={paradas} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Parada</th>
                <th style={{ width: '100px' }}>Tipo</th>
                <th>Tracking ID</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Mover</th>
              </tr>
            </thead>
            <tbody>
              {paradas.map((p, idx) => (
                <tr key={`${p.envio.id}-${p.tipo}`} style={{ backgroundColor: p.tipo === 'RETIRO' ? '#F0FDF4' : '#EFF6FF' }}>
                  <td style={{ textAlign: 'center', fontWeight: '900', fontSize: '18px', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: p.tipo === 'RETIRO' ? '#D1FAE5' : '#DBEAFE',
                      color: p.tipo === 'RETIRO' ? '#065F46' : '#1E40AF',
                    }}>
                      {p.tipo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#2563EB' }}>{p.envio.id}</td>
                  <td>{p.tipo === 'RETIRO' ? p.envio.remitente : p.envio.destinatario}</td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>{p.direccion}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={() => moverArriba(idx)}
                        disabled={idx === 0}
                        style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '16px' }}
                        title="Subir"
                      >↑</button>
                      <button
                        onClick={() => moverAbajo(idx)}
                        disabled={idx === paradas.length - 1}
                        style={{ border: 'none', background: 'none', cursor: idx === paradas.length - 1 ? 'default' : 'pointer', opacity: idx === paradas.length - 1 ? 0.3 : 1, fontSize: '16px' }}
                        title="Bajar"
                      >↓</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '13px', color: '#6b7280' }}>

            <strong style={{ color: '#374151' }}>Resumen:</strong>{" "}
            Ruta para el <strong style={{ color: '#111827' }}>{fecha}</strong> |{" "}
            Repartidor: <strong style={{ color: '#111827' }}>{repartidores.find(r => r.id === repartidorId)?.nombre}</strong> |{" "}
            Transporte: <strong style={{ color: '#111827' }}>{getNombreTransporte(transporteId)}</strong> |{" "}
            {seleccionados.length} {seleccionados.length === 1 ? 'envío' : 'envíos' } · 
            {paradas.length} {paradas.length === 1 ? 'parada' : 'paradas' }

          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setPaso(2)}>ANTERIOR</button>
            <button className="btn-new-shipment" onClick={confirmarCreacion} disabled={guardando}>
              {guardando ? 'CREANDO...' : 'CREAR RUTA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NuevaRuta;
