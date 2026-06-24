import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnvios, getRutas, getUsuarios, createRuta, getTransportes } from '../../services/api';
import MapaRuta from '../../components/MapaRuta';
import './NuevaRuta.css';


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
//
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

  const [polyline, setPolyline] = useState("");
  const [paradas, setParadas] = useState([]);

  const [hoveredBox, setHoveredBox] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setTooltipPos({
      x: e.clientX,
      y: e.clientY
    });
  };

  const resCarga = useMemo(() => {
    const tSel = transportes.find(t => String(t.id) === String(transporteId)) || {};
    const capacidadKg = tSel.capacidadKg ?? 0;
    const capacidadM3 = tSel.capacidadM3 ?? 0;

    let totalPesoGramos = 0;
    let totalVolumenFrio = 0;
    let totalVolumenNormal = 0;
    const CAPACIDAD_CAJA = 100000; // 100,000 cm3 = 0.1 m3

    const listaCajas = [];

    // Pack cold chain items per shipment into coolers (blue boxes)
    seleccionados.forEach(envio => {
      if (envio.detalles) {
        envio.detalles.forEach(d => {
          const cantidad = d.cantidad || 0;
          const med = d.medicamento || {};
          totalPesoGramos += (med.pesoGramos || 0) * cantidad;
          if (!med.cadenaFrio) {
            totalVolumenNormal += (med.volumenCm3 || 0) * cantidad;
          }
        });
      }

      const coldChainDetails = envio.detalles ? envio.detalles.filter(d => d.medicamento?.cadenaFrio) : [];
      const groups = []; // each group: { details: [], tempMin: Number, tempMax: Number, volumenTotal: Number }

      coldChainDetails.forEach(d => {
        const med = d.medicamento || {};
        const medMin = med.temperaturaMinima !== null && med.temperaturaMinima !== undefined ? parseFloat(med.temperaturaMinima) : -Infinity;
        const medMax = med.temperaturaMaxima !== null && med.temperaturaMaxima !== undefined ? parseFloat(med.temperaturaMaxima) : Infinity;
        const cantidad = d.cantidad || 0;
        const vol = (med.volumenCm3 || 0) * cantidad;

        // Try to place it in an existing group
        let placed = false;
        for (let group of groups) {
          const newMin = Math.max(group.tempMin, medMin);
          const newMax = Math.min(group.tempMax, medMax);
          if (newMin <= newMax) {
            group.details.push(d);
            group.tempMin = newMin;
            group.tempMax = newMax;
            group.volumenTotal += vol;
            placed = true;
            break;
          }
        }

        if (!placed) {
          groups.push({
            details: [d],
            tempMin: medMin,
            tempMax: medMax,
            volumenTotal: vol
          });
        }
      });

      groups.forEach((group, idx) => {
        totalVolumenFrio += group.volumenTotal;
        let volRestante = group.volumenTotal;
        let cCount = 1;
        while (volRestante > 0) {
          const capCaja = Math.min(volRestante, CAPACIDAD_CAJA);
          listaCajas.push({
            tipo: 'frio',
            fillPct: capCaja / CAPACIDAD_CAJA,
            envioId: envio.id,
            remitente: envio.remitente,
            destinatario: envio.destinatario || 'Desconocido',
            tempMin: group.tempMin === -Infinity ? null : group.tempMin,
            tempMax: group.tempMax === Infinity ? null : group.tempMax,
            medicamentos: group.details.map(d => `${d.medicamento.nombre} (${d.cantidad} u.)`),
            groupNum: idx + 1,
            cajaNum: cCount,
            coolerIndex: listaCajas.length + 1
          });
          volRestante -= capCaja;
          cCount++;
        }
      });
    });

    const cajasAzules = listaCajas.length;
    const cajasNaranjas = 0;
    const totalCajas = cajasAzules;
    const maxCajas = Math.floor((capacidadM3 * 1000000) / CAPACIDAD_CAJA);

    const totalVolumenOcupado = (cajasAzules * CAPACIDAD_CAJA) + totalVolumenNormal;
    const totalPesoKg = Number((totalPesoGramos / 1000).toFixed(2));
    const pesoExcedido = totalPesoKg > capacidadKg;
    const volumenExcedido = totalVolumenOcupado > (capacidadM3 * 1000000);

    return {
      tSel,
      capacidadKg,
      capacidadM3,
      totalPesoKg,
      totalVolumenFrio,
      totalVolumenNormal,
      totalVolumenOcupado,
      cajasAzules,
      cajasNaranjas,
      totalCajas,
      maxCajas,
      pesoExcedido,
      volumenExcedido,
      listaCajas
    };
  }, [seleccionados, transportes, transporteId]);

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
    if (resCarga.pesoExcedido) {
      setError(`Se ha excedido la capacidad de peso del transporte (${resCarga.totalPesoKg} kg / ${resCarga.capacidadKg} kg)`);
      return;
    }
    if (resCarga.volumenExcedido) {
      setError(`Se ha excedido la capacidad de volumen del transporte (${(resCarga.totalVolumenOcupado / 1000000).toFixed(3)} m³ / ${resCarga.capacidadM3} m³)`);
      return;
    }
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
        polyline,
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

      <div className="card nr-stepper-card">
        <div className="nr-stepper-container">
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
              <div key={n} className="nr-step-item">
                {n < 3 && (
                  <div className="nr-step-line" style={{ backgroundColor: lineaColor }} />
                )}
                <div style={{
                  backgroundColor: circuloColor,
                  border: `2px solid ${bordColor}`,
                  color: completado || actual ? 'white' : '#9CA3AF',
                }} className="nr-step-circle">
                  {completado ? '✓' : n}
                </div>
                <span style={{
                  fontWeight: actual ? '800' : '500',
                  color: textoColor,
                }} className="nr-step-label">
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
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Columna izquierda: Listado de envíos */}
          <div className="card" style={{ flex: '2 1 600px', margin: 0 }}>
            <div className="nr-step2-header">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Seleccionar envíos ({seleccionados.length} seleccionados)
              </h2>
              <input
                className="search-input nr-search-input"
                placeholder="Buscar por ID, destinatario, dirección..."
                value={busquedaEnvio}
                onChange={e => setBusquedaEnvio(e.target.value)}
              />
            </div>

            {loadingEnvios ? (
              <p style={{ padding: '20px', color: '#6b7280' }}>Cargando envíos disponibles...</p>
            ) : (
              <table className="nr-envios-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                          <td data-label="Tracking ID" style={{ fontWeight: 'bold', color: '#2563EB' }}>{e.id}</td>
                          <td data-label="Destinatario">{e.destinatario}</td>
                          <td data-label="Dirección" style={{ fontSize: '13px', color: '#6b7280' }}>{e.destino}</td>
                          <td data-label="Prioridad">
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

            <div className="nr-actions-row">
              <button className="btn btn-secondary" onClick={() => setPaso(1)}>ANTERIOR</button>
              <button 
                className="btn-new-shipment" 
                onClick={avanzarPaso2}
                disabled={resCarga.pesoExcedido || resCarga.volumenExcedido}
                style={{
                  opacity: (resCarga.pesoExcedido || resCarga.volumenExcedido) ? 0.5 : 1,
                  cursor: (resCarga.pesoExcedido || resCarga.volumenExcedido) ? 'not-allowed' : 'pointer'
                }}
              >
                SUGERIR ORDEN Y CONTINUAR
              </button>
            </div>
          </div>

          {/* Columna derecha: Indicadores de capacidad y Camión interactivo */}
          <div className="card" style={{ flex: '1 1 320px', minWidth: '320px', margin: 0, padding: '24px', backgroundColor: '#F9FAFB' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
              Capacidad y Carga del Transporte
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {/* Indicador de Peso */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#4B5563', marginBottom: '4px' }}>
                  <span>Peso Total</span>
                  <span style={{ color: resCarga.pesoExcedido ? '#EF4444' : '#10B981' }}>
                    {resCarga.totalPesoKg} kg / {resCarga.capacidadKg} kg
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min((resCarga.totalPesoKg / (resCarga.capacidadKg || 1)) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: resCarga.pesoExcedido ? '#EF4444' : '#10B981',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {resCarga.pesoExcedido && (
                  <p style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                    ⚠️ Capacidad de peso excedida
                  </p>
                )}
              </div>

              {/* Indicador de Volumen/Cajas */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#4B5563', marginBottom: '4px' }}>
                  <span>Volumen Total (m³)</span>
                  <span style={{ color: resCarga.volumenExcedido ? '#EF4444' : '#10B981' }}>
                    {resCarga.cajasAzules} / {resCarga.maxCajas} coolers ({ (resCarga.totalVolumenOcupado / 1000000).toFixed(3) } m³ / { resCarga.capacidadM3 } m³)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min((resCarga.totalVolumenOcupado / (resCarga.capacidadM3 * 1000000 || 1)) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: resCarga.volumenExcedido ? '#EF4444' : '#10B981',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {resCarga.volumenExcedido && (
                  <p style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                    ⚠️ Capacidad de volumen excedida
                  </p>
                )}
              </div>
            </div>

            {/* Render del camión en 2D SVG */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vista de Carga (Distribución)
              </div>
              
              {/* Contenedor del camión SVG */}
              {(() => {
                const maxC = resCarga.maxCajas || 1;
                // Grid layout
                let rows = 3;
                let cols = 4;
                if (maxC <= 4) { rows = 1; cols = maxC; }
                else if (maxC <= 8) { rows = 2; cols = 4; }
                else if (maxC <= 12) { rows = 3; cols = 4; }
                else if (maxC <= 16) { rows = 4; cols = 4; }
                else { rows = 4; cols = Math.min(Math.ceil(maxC / 4), 6); }

                const visualMax = rows * cols;

                const padding = 6;
                const usableW = 188;
                const usableH = 78;
                const boxW = Math.min(Math.floor(usableW / cols) - 4, 40);
                const boxH = Math.min(Math.floor(usableH / rows) - 4, 24);

                const gridW = cols * (boxW + 4) - 4;
                const gridH = rows * (boxH + 4) - 4;
                const offsetX = 20 + padding + (usableW - gridW) / 2;
                const offsetY = 40 + padding + (usableH - gridH) / 2;

                const slots = [];
                const cajasARenderizar = Math.min(resCarga.totalCajas, visualMax);
                for (let i = 0; i < cajasARenderizar; i++) {
                  const r = Math.floor(i / cols);
                  const c = i % cols;
                  const bx = offsetX + c * (boxW + 4);
                  // Stack from bottom up
                  const by = offsetY + (rows - 1 - r) * (boxH + 4);
                  
                  const boxInfo = resCarga.listaCajas[i];
                  const fillPct = boxInfo.fillPct; // 0 to 1
                  
                  const colorFill = boxInfo.tipo === 'frio' ? '#3B82F6' : '#F59E0B';
                  const colorStroke = boxInfo.tipo === 'frio' ? '#1D4ED8' : '#D97706';

                  const isFrio = boxInfo.tipo === 'frio';
                  slots.push(
                    <g 
                      key={`box-${i}`}
                      onMouseEnter={isFrio ? (e) => { setHoveredBox(boxInfo); handleMouseMove(e); } : undefined}
                      onMouseMove={isFrio ? handleMouseMove : undefined}
                      onMouseLeave={isFrio ? () => setHoveredBox(null) : undefined}
                      style={isFrio ? { cursor: 'pointer' } : undefined}
                    >
                      {/* Container box with a thin outline */}
                      <rect 
                        x={bx} 
                        y={by} 
                        width={boxW} 
                        height={boxH} 
                        rx="2" 
                        fill="#FFFFFF" 
                        stroke="#D1D5DB" 
                        strokeWidth="1.5" 
                      />
                      {/* Inner content filled from bottom up based on fillPct */}
                      <rect 
                        x={bx + 1} 
                        y={by + boxH - (boxH * fillPct) + 1} 
                        width={boxW - 2} 
                        height={Math.max((boxH * fillPct) - 2, 0)} 
                        rx="1" 
                        fill={colorFill} 
                        stroke={colorStroke} 
                        strokeWidth="1" 
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    </g>
                  );
                }

                // Calcular cajas excedidas (fuera de capacidad)
                const totalC = resCarga.totalCajas;
                const sobrantes = totalC - maxC;
                const overflowBoxes = [];
                if (sobrantes > 0) {
                  // Renderizar cajas excedidas encima de la caja del camión
                  for (let i = 0; i < sobrantes; i++) {
                    const bx = 20 + padding + i * (boxW + 4);
                    const by = 12;
                    
                    const boxInfo = resCarga.listaCajas[maxC + i];
                    const fillPct = boxInfo.fillPct;
                    const colorFill = boxInfo.tipo === 'frio' ? '#3B82F6' : '#F59E0B';
                    
                    const isFrio = boxInfo.tipo === 'frio';
                    overflowBoxes.push(
                      <g 
                        key={`overflow-${i}`}
                        onMouseEnter={isFrio ? (e) => { setHoveredBox(boxInfo); handleMouseMove(e); } : undefined}
                        onMouseMove={isFrio ? handleMouseMove : undefined}
                        onMouseLeave={isFrio ? () => setHoveredBox(null) : undefined}
                        style={isFrio ? { cursor: 'pointer' } : undefined}
                      >
                        {/* Container box */}
                        <rect 
                          x={bx} 
                          y={by} 
                          width={boxW} 
                          height={boxH} 
                          rx="2" 
                          fill="#FFFFFF" 
                          stroke="#EF4444" 
                          strokeWidth="2"
                        />
                        {/* Inner fill */}
                        <rect 
                          x={bx + 1} 
                          y={by + boxH - (boxH * fillPct) + 1} 
                          width={boxW - 2} 
                          height={Math.max((boxH * fillPct) - 2, 0)} 
                          rx="1" 
                          fill={colorFill} 
                          stroke="#EF4444" 
                          strokeWidth="1" 
                        />
                        <line x1={bx} y1={by} x2={bx+boxW} y2={by+boxH} stroke="#EF4444" strokeWidth="1.5" />
                        <line x1={bx+boxW} y1={by} x2={bx} y2={by+boxH} stroke="#EF4444" strokeWidth="1.5" />
                      </g>
                    );
                  }
                }

                return (
                  <svg viewBox="0 0 320 180" width="100%" height="auto" style={{ display: 'block' }}>
                    <defs>
                      <clipPath id="cargo-hold-clip">
                        <rect x="20" y="40" width="200" height="100" rx="6" />
                      </clipPath>
                    </defs>
                    <line x1="20" y1="140" x2="290" y2="140" stroke="#111827" strokeWidth="4" />
                    
                    <path d="M230,70 L260,70 L280,92 L290,105 L290,140 L230,140 Z" fill="#E5E7EB" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
                    <path d="M240,80 L258,80 L271,95 L271,115 L240,115 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
                    <rect x="282" y="115" width="8" height="15" rx="1" fill="#9CA3AF" />
                    
                    <g>
                      <circle cx="60" cy="148" r="14" fill="#111827" />
                      <circle cx="60" cy="148" r="5" fill="#FFFFFF" />
                      <circle cx="95" cy="148" r="14" fill="#111827" />
                      <circle cx="95" cy="148" r="5" fill="#FFFFFF" />
                      <circle cx="255" cy="148" r="14" fill="#111827" />
                      <circle cx="255" cy="148" r="5" fill="#FFFFFF" />
                    </g>
                    
                    {/* Cargo Hold background outline */}
                    <rect 
                      x="20" 
                      y="40" 
                      width="200" 
                      height="100" 
                      rx="6" 
                      fill="#FFFFFF" 
                      stroke={resCarga.volumenExcedido ? '#EF4444' : '#111827'} 
                      strokeWidth={resCarga.volumenExcedido ? '4' : '3'}
                      style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
                    />
                    
                    {/* Normal medicines volume background fill */}
                    {resCarga.totalVolumenNormal > 0 && (
                      <rect 
                        x="20" 
                        y={40 + 100 - (100 * Math.min(resCarga.totalVolumenNormal / (resCarga.capacidadM3 * 1000000 || 1), 1))} 
                        width="200" 
                        height={100 * Math.min(resCarga.totalVolumenNormal / (resCarga.capacidadM3 * 1000000 || 1), 1)} 
                        fill="#F59E0B" 
                        fillOpacity="0.25"
                        clipPath="url(#cargo-hold-clip)"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    )}
                    
                    {slots}
                    {overflowBoxes}
                  </svg>
                );
              })()}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', fontSize: '11px', fontWeight: '600', color: '#4B5563' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '3px', border: '1px solid #1D4ED8' }} />
                  <span>Cooler (Cadena de Frío)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#F59E0B', fillOpacity: 0.25, opacity: 0.5, borderRadius: '3px', border: '1px solid #D97706' }} />
                  <span>Carga Común (Normal)</span>
                </div>
              </div>

              {resCarga.volumenExcedido && (
                <div style={{ marginTop: '12px', color: '#EF4444', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>
                  ⚠️ ¡Capacidad de volumen del transporte superada!
                </div>
              )}
            </div>

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

          <div className="nr-map-container">
            <MapaRuta 
              paradas={paradas}
              onPolylineCalculated={setPolyline}
            />
          </div>

          <table className="nr-paradas-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  <td data-label="Tracking ID" style={{ fontWeight: 'bold', color: '#2563EB' }}>{p.envio.id}</td>
                  <td data-label="Contacto">{p.tipo === 'RETIRO' ? p.envio.remitente : p.envio.destinatario}</td>
                  <td data-label="Dirección" style={{ fontSize: '13px', color: '#6b7280' }}>{p.direccion}</td>
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

          <div className="nr-summary-box">
            <strong style={{ color: '#374151', display: 'block', marginBottom: '8px' }}>Resumen de la ruta:</strong>
            <div className="nr-summary-grid">
              <span className="nr-summary-item">Fecha: <strong>{fecha}</strong></span>
              <span className="nr-summary-item">Repartidor: <strong>{repartidores.find(r => r.id === repartidorId)?.nombre || 'No asignado'}</strong></span>
              <span className="nr-summary-item">Transporte: <strong>{getNombreTransporte(transporteId)}</strong></span>
              <span className="nr-summary-item">Envíos: <strong>{seleccionados.length}</strong></span>
              <span className="nr-summary-item">Paradas: <strong>{paradas.length}</strong></span>
            </div>
          </div>

          <div className="nr-actions-row">
            <button className="btn btn-secondary" onClick={() => setPaso(2)}>ANTERIOR</button>
            <button className="btn-new-shipment" onClick={confirmarCreacion} disabled={guardando}>
              {guardando ? 'CREANDO...' : 'CREAR RUTA'}
            </button>
          </div>
        </div>
      )}

      {hoveredBox && hoveredBox.tipo === 'frio' && (
        <div style={{
          position: 'fixed',
          top: tooltipPos.y + 15,
          left: tooltipPos.x + 15,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '12px 16px',
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: '240px',
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#3B82F6', borderRadius: '50%' }}></div>
            <span style={{ fontWeight: '750', fontSize: '13px', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cooler {hoveredBox.coolerIndex}
            </span>
          </div>
          
          <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '6px' }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: '#374151' }}>Medicamentos:</strong>
            <ul style={{ margin: 0, paddingLeft: '14px', listStyleType: 'disc', color: '#4B5563' }}>
              {hoveredBox.medicamentos.map((m, idx) => (
                <li key={idx} style={{ marginBottom: '2px' }}>{m}</li>
              ))}
            </ul>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            padding: '8px 10px',
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#1E40AF' }}>Temp:</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1D4ED8' }}>
              {hoveredBox.tempMin !== null && hoveredBox.tempMax !== null
                ? `${hoveredBox.tempMin}°C a ${hoveredBox.tempMax}°C`
                : hoveredBox.tempMin !== null
                  ? `≥ ${hoveredBox.tempMin}°C`
                  : hoveredBox.tempMax !== null
                    ? `≤ ${hoveredBox.tempMax}°C`
                    : 'Sin rango'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NuevaRuta;
