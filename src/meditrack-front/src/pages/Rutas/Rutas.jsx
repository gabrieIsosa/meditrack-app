import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRutas, getUsuarios } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ESTADO_COLORS = {
  PENDIENTE: '#f59e0b',
  EN_CURSO: '#3b82f6',
  COMPLETADA: '#10b981',
};

function Rutas() {
  const [rutas, setRutas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([getRutas(), getUsuarios()])
      .then(([rutasData, usuariosData]) => {
        setRutas(rutasData);
        setUsuarios(usuariosData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getNombreRepartidor = (id) => {
    const u = usuarios.find(u => u.id === id);
    return u ? u.nombre : id;
  };

  const rutasFiltradas = rutas.filter(r => {
    const term = busqueda.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      getNombreRepartidor(r.repartidorId).toLowerCase().includes(term) ||
      r.fecha?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container">
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/menu')}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de rutas</h1>
      </div>

      <div className="card">
        <div className="table-header-actions">
          <input
            className="search-input"
            style={{ margin: 0, flexGrow: 1 }}
            placeholder="Buscar por ID, repartidor o fecha..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {(user?.role === 'SUPERVISOR' || user?.role === 'ADMINISTRADOR') && (
            <button className="btn-new-shipment" onClick={() => navigate('/rutas/nueva')}>
              NUEVA RUTA
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ padding: '20px', color: '#6b7280' }}>Cargando rutas...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>ID Ruta</th>
                <th>Fecha</th>
                <th>Repartidor</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Envíos</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No hay rutas registradas
                  </td>
                </tr>
              ) : (
                rutasFiltradas.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 'bold', color: '#2563EB' }}>{r.id}</td>
                    <td>{r.fecha}</td>
                    <td>{getNombreRepartidor(r.repartidorId)}</td>
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
        )}
      </div>
    </div>
  );
}

export default Rutas;
