import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEnvioById, updateEstadoEnvio } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ModalHistorial from '../components/ModalHistorial';
import StatusLine from '../components/StatusLine';
import ModalCancelacion from '../components/ModalCancelacion';
import { cancelarEnvio } from '../services/api';

const ORDEN_ESTADOS = [
  'PENDIENTE', 'ASIGNADO', 'EN_PREPARACION', 'EN_TRANSITO', 
  'EN_PUNTO_DE_ENTREGA', 'INCIDENTE_REPORTADO', 'ENTREGADO', 'CANCELADO'
];

function ahora() {
  const d = new Date();
  return {
    fecha: d.toISOString().split('T')[0],
    hora: d.toTimeString().slice(0, 5),
  };
}

function DetalleEnvio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [envio, setEnvio] = useState(null);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({ nuevoEstado: '', fecha: '', hora: '', usuario: '' });
  const [modalError, setModalError] = useState('');
  const [cancelacionAbierta, setCancelacionAbierta] = useState(false);

  useEffect(() => {
    getEnvioById(id)
      .then(data => {
        setEnvio(data);
        const { fecha, hora } = ahora();
        setModalForm({ nuevoEstado: data.estado, fecha, hora, usuario: user?.nombre || '' });
      })
      .catch(() => setError('Envío no encontrado.'));
  }, [id, user?.nombre]);

  const abrirModalEstado = () => {
    const { fecha, hora } = ahora();
    setModalForm(prev => ({ ...prev, fecha, hora, usuario: user?.nombre || '' }));
    setModalError('');
    setModalAbierto(true);
  };

  const handleConfirmarEstado = async () => {
    try {
      const actualizado = await updateEstadoEnvio(id, modalForm.nuevoEstado, modalForm.fecha, modalForm.hora, modalForm.usuario);
      setEnvio(actualizado);
      setModalAbierto(false);
    } catch (e) {
      setModalError(e.message);
    }
  };

  const handleConfirmarCancelacion = async (motivo,firma) => {
    try{
      const actualizado = await cancelarEnvio(id, motivo, firma);
      setEnvio(actualizado);
      setCancelacionAbierta(false);
    } catch (e) {
      alert(e.message);
    }
  }

  if (!envio) return <div className="container"><p>{error || 'Cargando...'}</p></div>;

  return (
    <div className="container">
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Detalle del envío</h1>
      </div>

      <StatusLine estadoActual={envio.estado} />

      <div className="card detail-main-card" style={{ position: 'relative', paddingBottom: '80px' }}>
        <div className="detail-top-grid">
          <div className="detail-field">
            <label>TRACKING ID</label>
            <span>{envio.id}</span>
          </div>
          <div className="detail-field">
            <label>ESTADO</label>
            <div className="status-action-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge badge-${envio.estado}`}>{envio.estado?.replace(/_/g, ' ')}</span>
              <button className="btn btn-primary btn-sm" onClick={abrirModalEstado} style={{ backgroundColor: '#10B981', border: 'none' }}>
                Cambiar estado ▾
              </button>
            </div>
          </div>
          <div className="detail-field">
            <label>REMITENTE</label>
            <span>{envio.remitente || '-'}</span>
          </div>
          <div className="detail-field">
            <label>DESTINATARIO</label>
            <span>{envio.destinatario || '-'}</span>
          </div>
        </div>

        <div className="detail-full-width" style={{ marginTop: '20px' }}>
          <div className="detail-field" style={{ marginBottom: '15px' }}>
            <label>DESCRIPCIÓN DE LA CARGA</label>
            <span>{envio.descripcionCarga || '-'}</span>
          </div>
          <div className="detail-field">
            <label>DIRECCIÓN DE ENTREGA</label>
            <span>{envio.direccionEntrega || '-'}</span>
          </div>
        </div>

        <div className="detail-bottom-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', paddingBottom: '20px' }}>
          <div className="detail-field"><label>ORIGEN</label><span>{envio.origen || '-'}</span></div>
          <div className="detail-field"><label>DESTINO</label><span>{envio.destino || '-'}</span></div>
          <div className="detail-field"><label>FECHA ESTIMADA</label><span>{envio.fechaEstimada || '-'}</span></div>
        </div>

        <div className="detail-full-width" style={{ marginTop: '0', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
          <div className="detail-field"><label>OBSERVACIONES</label><span>{envio.observaciones || '-'}</span></div>
        </div>

        <div style={{ position: 'absolute', bottom: '20px', left: '25px', display: 'flex', gap: '10px' }}>
          {user?.role === 'SUPERVISOR' && (
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(`/editar/${id}`)}
              style={{ backgroundColor: '#2563EB', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '600' }}
            >
              Editar
            </button>
          )}
          {user?.role === 'SUPERVISOR' && envio.estado !== 'ENTREGADO' && envio.estado !== 'CANCELADO' &&(
            <button
              className="btn btn-primary"
              onClick={() => setCancelacionAbierta(true)}
              style={{ backgroundColor: '#DC2626', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '600'}}
              >
                Cancelar envío
              </button>
          )}
        </div>

        <div style={{ position: 'absolute', bottom: '20px', right: '25px' }}>
          <button 
            onClick={() => setHistorialAbierto(true)} 
            style={{ backgroundColor: 'transparent', color: '#2563EB', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', textDecoration: 'underline' }}
          >
            Ver historial de cambios
          </button>
        </div>
      </div>

      {historialAbierto && <ModalHistorial historial={envio.historial || []} alCerrar={() => setHistorialAbierto(false)} />}

      {cancelacionAbierta && (<ModalCancelacion
              onConfirmar={handleConfirmarCancelacion}
              onCerrar={() => setCancelacionAbierta(false)}
              />
          )}

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Actualizar estado del envío</h2>
            <div className="form-group"><label>Estado actual</label><input value={envio.estado?.replace(/_/g, ' ')} disabled className="input-locked" /></div>
            <div className="form-group">
              <label>Nuevo estado</label>
              <select value={modalForm.nuevoEstado} onChange={e => setModalForm({...modalForm, nuevoEstado: e.target.value})}>
                {ORDEN_ESTADOS.map(st => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Fecha</label><input type="date" value={modalForm.fecha} onChange={e => setModalForm({...modalForm, fecha: e.target.value})} /></div>
            <div className="form-group"><label>Hora</label><input type="time" value={modalForm.hora} onChange={e => setModalForm({...modalForm, hora: e.target.value})} /></div>
            <div className="form-group"><label>Usuario</label><input value={modalForm.usuario} disabled className="input-locked" /></div>
            {modalError && <p className="error-msg">{modalError}</p>}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleConfirmarEstado}>CONFIRMAR</button>
              <button className="btn btn-secondary" onClick={() => setModalAbierto(false)}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}

export default DetalleEnvio;