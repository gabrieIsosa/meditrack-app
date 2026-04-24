import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEnvio, updateEstado } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ORDEN_ESTADOS = ['CREADO', 'EN_TRANSITO', 'EN_DEPOSITO', 'ENTREGADO'];

function siguienteEstado(estado) {
  const idx = ORDEN_ESTADOS.indexOf(estado);
  return idx >= 0 && idx < ORDEN_ESTADOS.length - 1 ? ORDEN_ESTADOS[idx + 1] : null;
}

function ahora() {
  const d = new Date();
  return {
    fecha: d.toISOString().split('T')[0],
    hora:  d.toTimeString().slice(0, 5),
  };
}

function DetalleEnvio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [envio, setEnvio] = useState(null);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({ nuevoEstado: '', fecha: '', hora: '', usuario: '' });
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    getEnvio(id)
      .then(data => {
        setEnvio(data);
        const sig = siguienteEstado(data.estado);
        const { fecha, hora } = ahora();
        setModalForm({ nuevoEstado: sig || '', fecha, hora, usuario: user?.nombre || '' });
      })
      .catch(() => setError('Envío no encontrado.'));
  }, [id, user?.nombre]);

  const abrirModal = () => {
    const { fecha, hora } = ahora();
    setModalForm({
      nuevoEstado: siguienteEstado(envio.estado) || '',
      fecha,
      hora,
      usuario: user?.nombre || '',
    });
    setModalError('');
    setModalAbierto(true);
  };

  const handleConfirmar = async () => {
    try {
      const actualizado = await updateEstado(
        id,
        modalForm.nuevoEstado,
        modalForm.fecha,
        modalForm.hora,
        modalForm.usuario
      );
      setEnvio(actualizado);
      setModalAbierto(false);
    } catch (e) {
      setModalError(e.message);
    }
  };

  if (!envio) {
    return (
      <div className="container">
        <p style={{ color: error ? '#c62828' : '#666', marginTop: '24px' }}>
          {error || 'Cargando...'}
        </p>
      </div>
    );
  }

  const proxEstado = siguienteEstado(envio.estado);
  const puedeActualizar = user?.role === 'SUPERVISOR' || user?.role === 'REPARTIDOR';

  return (
    <div className="container">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>VOLVER</button>
        <h1>Detalle del envío</h1>
      </div>

      <div className="card">
        <div className="detalle-grid">
          <div className="detalle-item">
            <span className="detalle-label">Tracking Id</span>
            <span className="detalle-valor"><code>{envio.id}</code></span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Estado</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge badge-${envio.estado}`}>{envio.estado?.replace(/_/g, ' ')}</span>
              {proxEstado && puedeActualizar && (
                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={abrirModal}>
                  ACTUALIZAR
                </button>
              )}
            </div>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Remitente</span>
            <span className="detalle-valor">{envio.remitente || '-'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Destinatario</span>
            <span className="detalle-valor">{envio.destinatario || '-'}</span>
          </div>
          {envio.descripcionCarga && (
            <div className="detalle-item form-full">
              <span className="detalle-label">Descripción de la carga</span>
              <span className="detalle-valor">{envio.descripcionCarga}</span>
            </div>
          )}
          <div className="detalle-item form-full">
            <span className="detalle-label">Dirección de entrega</span>
            <span className="detalle-valor">{envio.direccionEntrega || '-'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Origen</span>
            <span className="detalle-valor">{envio.origen || '-'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Destino</span>
            <span className="detalle-valor">{envio.destino || '-'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Fecha estimada de entrega</span>
            <span className="detalle-valor">{envio.fechaEstimada || '-'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Prioridad</span>
            <span className="detalle-valor">{envio.prioridad || '-'}</span>
          </div>
          {envio.observaciones && (
            <div className="detalle-item form-full">
              <span className="detalle-label">Observaciones</span>
              <span className="detalle-valor">{envio.observaciones}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h2 className="section-title">Historial de estados</h2>
        {envio.historial && envio.historial.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {envio.historial.map((h, i) => (
                <tr key={i}>
                  <td><span className={`badge badge-${h.estado}`}>{h.estado?.replace(/_/g, ' ')}</span></td>
                  <td>{h.fecha}</td>
                  <td>{h.hora}</td>
                  <td>{h.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999' }}>Sin historial registrado.</p>
        )}
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Actualizar estado del envío</h2>

            <div className="form-group">
              <label>Estado actual</label>
              <input value={envio.estado?.replace(/_/g, ' ')} disabled />
            </div>

            <div className="form-group">
              <label>Nuevo estado</label>
              <select
                value={modalForm.nuevoEstado}
                onChange={e => setModalForm({ ...modalForm, nuevoEstado: e.target.value })}
              >
                {proxEstado && <option value={proxEstado}>{proxEstado.replace(/_/g, ' ')}</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={modalForm.fecha}
                onChange={e => setModalForm({ ...modalForm, fecha: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Hora</label>
              <input
                type="time"
                value={modalForm.hora}
                onChange={e => setModalForm({ ...modalForm, hora: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Usuario</label>
              <input value={modalForm.usuario} disabled />
            </div>

            {modalError && <p className="error-msg">{modalError}</p>}

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleConfirmar}>CONFIRMAR</button>
              <button className="btn btn-secondary" onClick={() => setModalAbierto(false)}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleEnvio;
