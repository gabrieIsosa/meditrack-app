import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRutaById, getUsuarios, finalizarRuta } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MapaRuta from '../../components/MapaRuta';

const ESTADO_RUTA_COLORS = {
  PENDIENTE: '#f59e0b',
  EN_CURSO: '#3b82f6',
  COMPLETADA: '#10b981',
};

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

  useEffect(() => {
    Promise.all([getRutaById(id), getUsuarios()])
      .then(([rutaData, usuariosData]) => {
        setRuta(rutaData);
        setUsuarios(usuariosData);
      })
      .catch(() => setError('No se pudo cargar la ruta'))
      .finally(() => setLoading(false));
  }, [id]);

  const getNombreRepartidor = (repId) => {
    const u = usuarios.find(u => u.id === repId);
    return u ? u.nombre : repId;
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

  if (loading) return <div className="container"><p style={{ color: '#6b7280', padding: '40px' }}>Cargando ruta...</p></div>;
  if (error && !ruta) return <div className="container"><p style={{ color: '#DC2626', padding: '40px' }}>{error}</p></div>;

  return (
    <div className="container">
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/rutas')}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Detalle de ruta</h1>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
          <div className="detail-field">
            <label>ID RUTA</label>
            <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{ruta?.id}</span>
          </div>
          <div className="detail-field">
            <label>ESTADO</label>
            <div>
              <span style={getBadgeStyle(ruta?.estado, ESTADO_RUTA_COLORS)}>
                {ruta?.estado?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="detail-field">
            <label>REPARTIDOR</label>
            <span>{getNombreRepartidor(ruta?.repartidorId)}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div className="detail-field">
            <label>FECHA</label>
            <span>{ruta?.fecha}</span>
          </div>
          <div className="detail-field">
            <label>CREADA POR</label>
            <span>{ruta?.usuarioResponsable}</span>
          </div>
          <div className="detail-field">
            <label>FECHA CREACIÓN</label>
            <span>{ruta?.fechaCreacion} {ruta?.horaCreacion}</span>
          </div>
        </div>

        {puedeFinalizarRuta && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
            {confirmando ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          Recorrido planificado
        </h2>
        <MapaRuta paradas={(ruta?.envios ?? []).flatMap(re => {
          const stops = [];
          if (re.envio?.latitudOrigen != null && re.envio?.longitudOrigen != null) {
            stops.push({ tipo: 'RETIRO', lat: re.envio.latitudOrigen, lon: re.envio.longitudOrigen, direccion: re.envio.origen, envio: re.envio });
          }
          if (re.envio?.latitudDestino != null && re.envio?.longitudDestino != null) {
            stops.push({ tipo: 'ENTREGA', lat: re.envio.latitudDestino, lon: re.envio.longitudDestino, direccion: re.envio.destino, envio: re.envio });
          }
          return stops;
        })} />
      </div>

      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          Envíos de la ruta ({ruta?.envios?.length ?? 0})
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Orden</th>
              <th>Tracking ID</th>
              <th>Destinatario</th>
              <th>Dirección entrega</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ruta?.envios?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  Esta ruta no tiene envíos
                </td>
              </tr>
            ) : (
              ruta?.envios?.map(re => (
                <tr key={re.id}>
                  <td style={{ textAlign: 'center', fontWeight: '900', fontSize: '18px', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                    {re.orden}
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#2563EB' }}>{re.envio?.id}</td>
                  <td>{re.envio?.destinatario}</td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>{re.envio?.destino}</td>
                  <td>
                    <span
                      className="status-tag"
                      style={{
                        backgroundColor: `${ESTADO_ENVIO_COLORS[re.envio?.estado]}15`,
                        color: ESTADO_ENVIO_COLORS[re.envio?.estado],
                      }}
                    >
                      {re.envio?.estado?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="action-icon-btn"
                      title="Ver detalle del envío"
                      onClick={() => navigate(`/detalle/${re.envio?.id}`)}
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
    </div>
  );
}

export default DetalleRuta;
