import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRutaById, getUsuarios, getTransportes, finalizarRuta } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MapaRuta from '../../components/MapaRuta';
import { Copy, Check } from 'lucide-react';
import './DetalleRuta.css';

const ESTADO_RUTA_COLORS = {
  PENDIENTE: '#f59e0b',
  EN_CURSO: '#3b82f6',
  COMPLETADA: '#10b981',
};

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', style = {} }) => (
  <div style={{ width, height, borderRadius, backgroundColor: '#E5E7EB', animation: 'pulse 1.5s infinite', ...style }} />
);

const getBadgeStyle = (estado, colorMap) => {
  const color = colorMap[estado] || '#6b7280';
  return {
    backgroundColor: `${color}15`,
    color,
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '800',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    border: `1px solid ${color}40`,
    textTransform: 'uppercase',
  };
};

const ESTADO_ENVIO_COLORS = {
  PENDIENTE: '#6b7280',
  ASIGNADO: '#4338CA',
  EN_PREPARACION: '#f59e0b',
  EN_TRANSITO: '#3b82f6',
  EN_PUNTO_DE_ENTREGA: '#06b6d4',
  INCIDENTE_REPORTADO: '#ef4444',
  ENTREGADO: '#10b981',
  CANCELADO: '#000000',
};

function DetalleRuta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ruta, setRuta] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [transportes, setTransportes] = useState([]);
  const [copiadoRutaId, setCopiadoRutaId] = useState(false);
  const [copiadoEnvioId, setCopiadoEnvioId] = useState(null);

  const handleCopiarRutaId = () => {
    if (ruta?.id) {
      navigator.clipboard.writeText(ruta.id);
      setCopiadoRutaId(true);
      setTimeout(() => setCopiadoRutaId(false), 2000);
    }
  };

  const handleCopiarEnvioId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiadoEnvioId(id);
    setTimeout(() => setCopiadoEnvioId(null), 2000);
  };

  useEffect(() => {
    Promise.all([getRutaById(id), getUsuarios(), getTransportes('', '')])
      .then(([rutaData, usuariosData, transportesData]) => {
        setRuta(rutaData);
        setUsuarios(usuariosData);
        setTransportes(transportesData);
      })
      .catch(() => setError('No se pudo cargar la ruta'))
      .finally(() => setLoading(false));
  }, [id]);

  const getNombreRepartidor = (repId) => {
    const u = usuarios.find(u => u.id === repId);
    return u ? u.nombre : repId;
  };

  const getTransporte = (transporteId) => {
    const t = transportes.find(t => t.id === transporteId);
    return t ? `${t.patente} - ${t.tipoVehiculo}` : transporteId;
  };

  const handleFinalizar = async () => {
    setFinalizando(true);
    setError('');
    try {
      const actualizada = await finalizarRuta(id);
      setRuta(actualizada);
      setConfirmando(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setFinalizando(false);
    }
  };

  const puedeFinalizarRuta =
    (user?.role === 'SUPERVISOR' || user?.role === 'ADMINISTRADOR') &&
    ruta?.estado === 'PENDIENTE';

  if (error && !ruta && !loading) return <div className="container"><p style={{ color: '#DC2626', padding: '40px' }}>{error}</p></div>;

  return (
    <div className="container detalle-ruta-container">
      <div className="page-header-row">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Detalle de ruta</h1>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="detalle-ruta-meta-grid first">
          <div className="detail-field">
            <label>ID RUTA</label>
            {loading ? (
              <Skeleton width="100px" />
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{ruta?.id}</span>
                <button
                  onClick={handleCopiarRutaId}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: copiadoRutaId ? '#10B981' : '#9CA3AF',
                    transition: 'color 0.2s'
                  }}
                  title="Copiar ID de ruta"
                >
                  {copiadoRutaId ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
          <div className="detail-field">
            <label>ESTADO</label>
            <div>
              {loading ? (
                <Skeleton width="90px" height="24px" borderRadius="20px" />
              ) : (
                <span style={getBadgeStyle(ruta?.estado, ESTADO_RUTA_COLORS)}>
                  {ruta?.estado?.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
          <div className="detail-field">
            <label>REPARTIDOR</label>
            <span>
              {loading ? <Skeleton width="150px" /> : getNombreRepartidor(ruta?.repartidorId)}
            </span>
          </div>
          <div className="detail-field">
            <label>TRANSPORTE</label>
            <span>
              {loading ? <Skeleton width="180px" /> : getTransporte(ruta?.transporteId)}
            </span>
          </div>
        </div>
        <div className="detalle-ruta-meta-grid">
          <div className="detail-field">
            <label>FECHA</label>
            <span>
              {loading ? <Skeleton width="100px" /> : ruta?.fecha}
            </span>
          </div>
          <div className="detail-field">
            <label>CREADA POR</label>
            <span>
              {loading ? <Skeleton width="120px" /> : ruta?.usuarioResponsable}
            </span>
          </div>
          <div className="detail-field">
            <label>FECHA CREACIÓN</label>
            <span>
              {loading ? (
                <Skeleton width="160px" />
              ) : (
                `${ruta?.fechaCreacion ?? ''} ${ruta?.horaCreacion ?? ''}`
              )}
            </span>
          </div>
        </div>

        {!loading && puedeFinalizarRuta && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
            {confirmando ? (
              <div className="detalle-ruta-confirm-container">
                <span style={{ fontSize: '14px', color: '#374151' }}>¿Confirmar finalización de ruta? El repartidor quedará disponible.</span>
                <button
                  onClick={handleFinalizar}
                  disabled={finalizando}
                  className="btn btn-primary"
                >
                  {finalizando ? 'FINALIZANDO...' : 'CONFIRMAR'}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  className="btn btn-secondary"
                >
                  CANCELAR
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmando(true)}
                className="btn btn-primary"
              >
                FINALIZAR RUTA
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          Recorrido planificado
        </h2>
        {loading ? (
          <Skeleton width="100%" height="400px" borderRadius="12px" />
        ) : (
          <MapaRuta paradas={(ruta?.envios ?? []).flatMap(re => {
            const stops = [];
            if (re.envio?.latitudOrigen != null && re.envio?.longitudOrigen != null) {
              stops.push({
                tipo: 'RETIRO',
                lat: re.envio.latitudOrigen,
                lon: re.envio.longitudOrigen,
                direccion: re.envio.origen,
                envio: re.envio,
                orden: re.retiroOrden ?? re.orden
              });
            }
            if (re.envio?.latitudDestino != null && re.envio?.longitudDestino != null) {
              stops.push({
                tipo: 'ENTREGA',
                lat: re.envio.latitudDestino,
                lon: re.envio.longitudDestino,
                direccion: re.envio.destino,
                envio: re.envio,
                orden: re.entregaOrden ?? re.orden
              });
            }
            return stops;
          }).sort((a, b) => a.orden - b.orden)}
          polyline={ruta?.polyline} />
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          Paradas de la ruta ({
            loading ? '...' : (ruta?.envios ?? []).flatMap(re => {
              if (!re.envio) return [];
              return [
                { tipo: 'RETIRO', envio: re.envio },
                { tipo: 'ENTREGA', envio: re.envio }
              ];
            }).length
          })
        </h2>
        
        <div className="detalle-ruta-table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Parada</th>
                <th style={{ width: '100px' }}>Tipo</th>
                <th>Tracking ID</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'center' }}><Skeleton width="30px" style={{ margin: '0 auto' }} /></td>
                    <td><Skeleton width="70px" borderRadius="20px" /></td>
                    <td><Skeleton width="90px" /></td>
                    <td><Skeleton width="130px" /></td>
                    <td><Skeleton width="220px" /></td>
                    <td><Skeleton width="90px" borderRadius="20px" /></td>
                    <td style={{ textAlign: 'center' }}><Skeleton width="30px" style={{ margin: '0 auto' }} /></td>
                  </tr>
                ))
              ) : ruta?.envios?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Esta ruta no tiene paradas
                  </td>
                </tr>
              ) : (
                (ruta?.envios ?? []).flatMap(re => {
                  if (!re.envio) return [];
                  return [
                    {
                      tipo: 'RETIRO',
                      envio: re.envio,
                      contacto: re.envio.remitente,
                      direccion: re.envio.origen,
                      orden: re.retiroOrden ?? re.orden,
                    },
                    {
                      tipo: 'ENTREGA',
                      envio: re.envio,
                      contacto: re.envio.destinatario,
                      direccion: re.envio.destino,
                      orden: re.entregaOrden ?? re.orden,
                    },
                  ];
                }).sort((a, b) => a.orden - b.orden).map((p, idx) => (
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
                    <td style={{ fontWeight: 'bold', color: '#2563EB' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {p.envio.id}
                        <button
                          onClick={() => handleCopiarEnvioId(p.envio.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: copiadoEnvioId === p.envio.id ? '#10B981' : '#9CA3AF',
                            transition: 'color 0.2s'
                          }}
                          title="Copiar ID de envío"
                        >
                          {copiadoEnvioId === p.envio.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td>{p.contacto}</td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>{p.direccion}</td>
                    <td>
                      <span
                        className="status-tag"
                        style={{
                          backgroundColor: `${ESTADO_ENVIO_COLORS[p.envio.estado]}15`,
                          color: ESTADO_ENVIO_COLORS[p.envio.estado],
                        }}
                      >
                        {p.envio.estado?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="action-icon-btn"
                        title="Ver detalle del envío"
                        onClick={() => navigate(`/detalle/${p.envio.id}`)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="detalle-ruta-mobile-grid">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="parada-card">
                <div className="parada-card-header">
                  <Skeleton width="40px" />
                  <Skeleton width="70px" borderRadius="20px" />
                </div>
                <div className="parada-card-details">
                  <div className="parada-card-detail-item">
                    <Skeleton width="16px" height="16px" borderRadius="50%" />
                    <Skeleton width="140px" height="14px" />
                  </div>
                  <div className="parada-card-detail-item">
                    <Skeleton width="16px" height="16px" borderRadius="50%" />
                    <Skeleton width="160px" height="14px" />
                  </div>
                  <div className="parada-card-detail-item">
                    <Skeleton width="16px" height="16px" borderRadius="50%" />
                    <Skeleton width="180px" height="14px" />
                  </div>
                  <div className="parada-card-detail-item">
                    <Skeleton width="90px" height="22px" borderRadius="20px" style={{ marginLeft: 0 }} />
                  </div>
                </div>
                <div className="parada-card-footer">
                  <Skeleton width="100%" height="40px" borderRadius="8px" />
                </div>
              </div>
            ))
          ) : ruta?.envios?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Esta ruta no tiene paradas
            </div>
          ) : (
            (ruta?.envios ?? []).flatMap(re => {
              if (!re.envio) return [];
              return [
                {
                  tipo: 'RETIRO',
                  envio: re.envio,
                  contacto: re.envio.remitente,
                  direccion: re.envio.origen,
                  orden: re.retiroOrden ?? re.orden,
                },
                {
                  tipo: 'ENTREGA',
                  envio: re.envio,
                  contacto: re.envio.destinatario,
                  direccion: re.envio.destino,
                  orden: re.entregaOrden ?? re.orden,
                },
              ];
            }).sort((a, b) => a.orden - b.orden).map((p, idx) => (
              <div key={`${p.envio.id}-${p.tipo}`} className="parada-card" style={{ backgroundColor: p.tipo === 'RETIRO' ? '#F0FDF4' : '#EFF6FF' }}>
                <div className="parada-card-header">
                  <span className="parada-card-number">#{idx + 1}</span>
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
                </div>
                <div className="parada-card-details">
                  <div className="parada-card-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', wordBreak: 'break-all' }}>
                      <strong>Tracking ID:</strong> {p.envio.id}
                      <button
                        onClick={() => handleCopiarEnvioId(p.envio.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: copiadoEnvioId === p.envio.id ? '#10B981' : '#9CA3AF',
                          transition: 'color 0.2s'
                        }}
                        title="Copiar ID de envío"
                      >
                        {copiadoEnvioId === p.envio.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </span>
                  </div>
                  <div className="parada-card-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span><strong>Contacto:</strong> {p.contacto}</span>
                  </div>
                  <div className="parada-card-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span><strong>Dirección:</strong> {p.direccion}</span>
                  </div>
                  <div className="parada-card-detail-item">
                    <span
                      className="status-tag"
                      style={{
                        backgroundColor: `${ESTADO_ENVIO_COLORS[p.envio.estado]}15`,
                        color: ESTADO_ENVIO_COLORS[p.envio.estado],
                        marginLeft: 0
                      }}
                    >
                      {p.envio.estado?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="parada-card-footer">
                  <button className="parada-card-btn" onClick={() => navigate(`/detalle/${p.envio.id}`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Ver detalle del envío
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DetalleRuta;
