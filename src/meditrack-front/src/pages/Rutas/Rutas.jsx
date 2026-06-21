import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRutas, getUsuarios, getTransportes } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Copy, Check } from 'lucide-react';
import './Rutas.css';

const ESTADO_COLORS = {
  PENDIENTE: '#f59e0b',
  EN_CURSO: '#3b82f6',
  COMPLETADA: '#10b981',
};

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', style = {} }) => (
  <div style={{ width, height, borderRadius, backgroundColor: '#E5E7EB', animation: 'pulse 1.5s infinite', ...style }} />
);

function Rutas() {
  const [rutas, setRutas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [transportes, setTransportes] = useState([]);
  const [copiadoId, setCopiadoId] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const hasProcessedSuccess = useRef(false);

  useEffect(() => {
    if (location.state?.success && !hasProcessedSuccess.current) {
      hasProcessedSuccess.current = true;
      setShowSnackbar(true);
      const timer = setTimeout(() => setShowSnackbar(false), 3000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleCopiarId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  useEffect(() => {
    Promise.all([getRutas(), getUsuarios(), getTransportes('', '')])
      .then(([rutasData, usuariosData, transportesData]) => {
        setRutas(rutasData);
        setUsuarios(usuariosData);
        setTransportes(transportesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getNombreRepartidor = (id) => {
    const u = usuarios.find(u => u.id === id);
    return u ? u.nombre : id;
  };

  const getTransporte = (id) => {
    const t = transportes.find(t => t.id === id);
    return t ? `${t.patente} - ${t.tipoVehiculo}` : id;
  }

  const rutasFiltradas = rutas.filter(r => {
    const term = busqueda.toLowerCase();
    const coincideBusqueda = (
      r.id.toLowerCase().includes(term) ||
      getNombreRepartidor(r.repartidorId).toLowerCase().includes(term) ||
      r.fecha?.toLowerCase().includes(term)
    );
    const coincideEstado = filtroEstado === '' || r.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="container rutas-container">
      {showSnackbar && (
        <div className="snackbar-msg">
          ¡Ruta creada correctamente!
        </div>
      )}
      <div className="page-header-row">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de rutas</h1>
      </div>

      <div className="card">
        <div className="table-header-actions">
          <input
            className="search-input"
            placeholder="Buscar por ID, repartidor o fecha..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select
            className="status-filter-select"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_CURSO">En curso</option>
            <option value="COMPLETADA">Completada</option>
          </select>
          {(user?.role === 'SUPERVISOR' || user?.role === 'ADMINISTRADOR') && (
            <button className="btn-new-shipment" onClick={() => navigate('/rutas/nueva')}>
              NUEVA RUTA
            </button>
          )}
        </div>

          <>
            <div className="rutas-table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID Ruta</th>
                    <th>Fecha</th>
                    <th>Repartidor</th>
                    <th>Transporte</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Envíos</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td><Skeleton width="80px" /></td>
                        <td><Skeleton width="100px" /></td>
                        <td><Skeleton width="120px" /></td>
                        <td><Skeleton width="140px" /></td>
                        <td><Skeleton width="100px" borderRadius="20px" /></td>
                        <td><Skeleton width="40px" style={{ margin: '0 auto' }} /></td>
                        <td><Skeleton width="40px" style={{ margin: '0 auto' }} /></td>
                      </tr>
                    ))
                  ) : rutasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        No hay rutas registradas
                      </td>
                    </tr>
                  ) : (
                    rutasFiltradas.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 'bold', color: '#2563EB' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {r.id}
                            <button
                              onClick={() => handleCopiarId(r.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: copiadoId === r.id ? '#10B981' : '#9CA3AF',
                                transition: 'color 0.2s'
                              }}
                              title="Copiar ID al portapapeles"
                            >
                              {copiadoId === r.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td>{r.fecha}</td>
                        <td>{getNombreRepartidor(r.repartidorId)}</td>
                        <td>{getTransporte(r.transporteId)}</td>
                        <td>
                          <span
                            className="status-tag"
                            style={{
                              backgroundColor: `${ESTADO_COLORS[r.estado]}20`,
                              color: ESTADO_COLORS[r.estado],
                            }}
                          >
                            {r.estado?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{r.envios?.length ?? 0}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="action-icon-btn"
                            title="Ver detalle"
                            onClick={() => navigate(`/rutas/${r.id}`)}
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

            <div className="rutas-mobile-grid">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="ruta-card">
                    <div className="ruta-card-header">
                      <Skeleton width="100px" height="18px" />
                      <Skeleton width="90px" height="22px" borderRadius="20px" />
                    </div>
                    <div className="ruta-card-details">
                      <div className="ruta-card-detail-item">
                        <Skeleton width="16px" height="16px" borderRadius="50%" />
                        <Skeleton width="140px" height="14px" />
                      </div>
                      <div className="ruta-card-detail-item">
                        <Skeleton width="16px" height="16px" borderRadius="50%" />
                        <Skeleton width="160px" height="14px" />
                      </div>
                      <div className="ruta-card-detail-item">
                        <Skeleton width="16px" height="16px" borderRadius="50%" />
                        <Skeleton width="180px" height="14px" />
                      </div>
                      <div className="ruta-card-detail-item">
                        <Skeleton width="16px" height="16px" borderRadius="50%" />
                        <Skeleton width="80px" height="14px" />
                      </div>
                    </div>
                    <div className="ruta-card-footer">
                      <Skeleton width="100%" height="40px" borderRadius="8px" />
                    </div>
                  </div>
                ))
              ) : rutasFiltradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No hay rutas registradas
                </div>
              ) : (
                rutasFiltradas.map(r => (
                  <div key={r.id} className="ruta-card">
                    <div className="ruta-card-header">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="ruta-card-id">{r.id}</span>
                        <button
                          onClick={() => handleCopiarId(r.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: copiadoId === r.id ? '#10B981' : '#9CA3AF',
                            transition: 'color 0.2s'
                          }}
                          title="Copiar ID al portapapeles"
                        >
                          {copiadoId === r.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <span
                        className="status-tag"
                        style={{
                          backgroundColor: `${ESTADO_COLORS[r.estado]}20`,
                          color: ESTADO_COLORS[r.estado],
                        }}
                      >
                        {r.estado?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="ruta-card-details">
                      <div className="ruta-card-detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span><strong>Fecha:</strong> {r.fecha}</span>
                      </div>
                      <div className="ruta-card-detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span><strong>Repartidor:</strong> {getNombreRepartidor(r.repartidorId)}</span>
                      </div>
                      <div className="ruta-card-detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        <span><strong>Transporte:</strong> {getTransporte(r.transporteId)}</span>
                      </div>
                      <div className="ruta-card-detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                        </svg>
                        <span><strong>Envíos:</strong> {r.envios?.length ?? 0}</span>
                      </div>
                    </div>
                    <div className="ruta-card-footer">
                      <button className="ruta-card-btn" onClick={() => navigate(`/rutas/${r.id}`)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        </div>
      </div>
  );
}

export default Rutas;
