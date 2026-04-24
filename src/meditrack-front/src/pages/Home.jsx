import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnvios } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [envios, setEnvios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const esSupervisor = user?.role === 'SUPERVISOR';

  useEffect(() => {
    getEnvios()
      .then(setEnvios)
      .catch(() => setError('No se pudo conectar con el servidor. ¿Está corriendo el backend en :8080?'));
  }, []);

  const filtrados = envios.filter(e =>
    e.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.destinatario.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.remitente.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>Envíos</h1>
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por Tracking Id, remitente o destinatario..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {esSupervisor && (
            <button className="btn btn-primary" onClick={() => navigate('/nuevo')}>
              NUEVO
            </button>
          )}
        </div>

        {error && <p className="error-msg">{error}</p>}

        <table>
          <thead>
            <tr>
              <th>Tracking Id</th>
              <th>Remitente</th>
              <th>Destinatario</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Fecha estimada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                  {envios.length === 0 && !error ? 'Cargando...' : 'Sin resultados'}
                </td>
              </tr>
            ) : (
              filtrados.map(e => (
                <tr key={e.id}>
                  <td><code>{e.id}</code></td>
                  <td>{e.remitente || '-'}</td>
                  <td>{e.destinatario || '-'}</td>
                  <td>{e.origen || '-'}</td>
                  <td>{e.destino || '-'}</td>
                  <td><span className={`badge badge-${e.estado}`}>{e.estado?.replace(/_/g, ' ')}</span></td>
                  <td>{e.prioridad || '-'}</td>
                  <td>{e.fechaEstimada || '-'}</td>
                  <td className="acciones">
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(`/detalle/${e.id}`)}
                    >
                      DETALLE
                    </button>
                    {esSupervisor && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigate(`/editar/${e.id}`)}
                      >
                        EDITAR
                      </button>
                    )}
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

export default Home;
