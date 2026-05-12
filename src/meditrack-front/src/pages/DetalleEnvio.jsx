import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getEnvioById, updateEstadoEnvio, cancelarEnvio, getUsuarios, reasignarRepartidorEnvio, descargarEtiqueta } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ModalHistorial from '../components/ModalHistorial';
import StatusLine from '../components/StatusLine';
import ModalCancelacion from '../components/ModalCancelacion';

const ESTADO_COLORS = {
  PENDIENTE: '#6b7280',
  ASIGNADO: '#4338CA',
  EN_PREPARACION: '#f59e0b',
  EN_TRANSITO: '#3b82f6',
  EN_PUNTO_DE_ENTREGA: '#06b6d4',
  INCIDENTE_REPORTADO: '#f59e0b',
  ENTREGADO: '#10b981',
  CANCELADO: '#ec0c0c'
};

const FLUJO_ESTANDAR = [
  'PENDIENTE',
  'ASIGNADO',
  'EN_PREPARACION',
  'EN_TRANSITO',
  'EN_PUNTO_DE_ENTREGA',
  'ENTREGADO'
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
  const location = useLocation();
  const { user } = useAuth();
  
  const [envio, setEnvio] = useState(null);
  const [error, setError] = useState('');
  const [repartidores, setRepartidores] = useState([]);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [cancelacionAbierta, setCancelacionAbierta] = useState(false);
  const [modalReasignarAbierto, setModalReasignarAbierto] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  const [modalForm, setModalForm] = useState({ nuevoEstado: '', fecha: '', hora: '', usuario: '', repartidorId: '' });
  const [repartidorReasignar, setRepartidorReasignar] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    getEnvioById(id)
      .then(data => {
        setEnvio(data);
        const { fecha, hora } = ahora();
        setModalForm({ 
          nuevoEstado: data.estado, 
          fecha, 
          hora, 
          usuario: user?.nombre || '',
          repartidorId: ''
        });
      })
      .catch(() => setError('Envío no encontrado.'));

    getUsuarios()
      .then(data => {
        setRepartidores(data.filter(u => u.role === 'REPARTIDOR' && u.estadoActivo));
      })
      .catch(console.error);

    if (location.state?.editSuccess) {
      const showTimer = setTimeout(() => setShowSnackbar(true), 100);
      window.history.replaceState({}, document.title);
      const hideTimer = setTimeout(() => setShowSnackbar(false), 3100);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
  }, [id, user?.nombre, location.state]);

  const abrirModalEstado = () => {
    const { fecha, hora } = ahora();
    const opcionesValidas = getOpcionesDisponibles();
    
    setModalForm(prev => ({ 
      ...prev, 
      nuevoEstado: opcionesValidas.length > 0 ? opcionesValidas[0] : envio.estado, 
      fecha, 
      hora, 
      usuario: user?.nombre || '',
      repartidorId: ''
    }));
    setModalError('');
    setModalAbierto(true);
  };

  const getOpcionesDisponibles = () => {
    if (!envio) return [];
    const estadoActual = envio.estado;
    const opciones = [];

    const indexActual = FLUJO_ESTANDAR.indexOf(estadoActual);
    if (indexActual !== -1 && indexActual < FLUJO_ESTANDAR.length - 1) {
      opciones.push(FLUJO_ESTANDAR[indexActual + 1]);
    }

    if (estadoActual === 'EN_TRANSITO' || estadoActual === 'EN_PUNTO_DE_ENTREGA') {
      opciones.push('INCIDENTE_REPORTADO');
    }

    return opciones;
  };

  const handleConfirmarEstado = async () => {
    const { nuevoEstado, fecha, hora, usuario, repartidorId } = modalForm;
    
    if (nuevoEstado === 'ASIGNADO' && !repartidorId) {
      setModalError('Debe seleccionar un repartidor para asignar el envío.');
      return;
    }

    try {
      const actualizado = await updateEstadoEnvio(id, nuevoEstado, fecha, hora, usuario, repartidorId);
      setEnvio(actualizado);
      setModalAbierto(false);
    } catch (e) {
      setModalError(e.message);
    }
  };

  const handleReasignar = async () => {
    if (!repartidorReasignar) return;
    try {
      const actualizado = await reasignarRepartidorEnvio(id, repartidorReasignar);
      setEnvio(actualizado);
      setModalReasignarAbierto(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleConfirmarCancelacion = async (motivo, firma) => {
    try {
      const actualizado = await cancelarEnvio(id, motivo, firma);
      setEnvio(actualizado);
      setCancelacionAbierta(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const getNombreRepartidor = (repartidorId) => {
    if (!repartidorId) return 'Sin asignar';
    const rep = repartidores.find(r => r.id === repartidorId);
    return rep ? `${rep.nombre}` : 'Repartidor no encontrado';
  };

  const getBadgeStyle = (estado) => {
    const color = ESTADO_COLORS[estado] || '#6b7280';
    return {
      backgroundColor: `${color}15`,
      color: color,
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '800',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      border: `1px solid ${color}40`,
      textTransform: 'uppercase'
    };
  };

  if (!envio) return <div className="container"><p>{error || 'Cargando...'}</p></div>;

  return (
    <div className="container">
      <style>
        {`
          .snackbar {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #2563EB;
            color: white;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: fadeInDown 0.4s ease-out;
          }
          @keyframes fadeInDown {
            from { top: -50px; opacity: 0; }
            to { top: 20px; opacity: 1; }
          }
          .info-row-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 25px;
          }
        `}
      </style>

      {showSnackbar && <div className="snackbar">¡Envío editado correctamente!</div>}

      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/envios')}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Detalle del envío</h1>
      </div>

      <StatusLine estadoActual={envio.estado} historial={envio.historial || []} />

      <div className="card detail-main-card" style={{ position: 'relative', paddingBottom: '80px', paddingTop: '30px' }}>
        <div className="info-row-grid">
          <div className="detail-field">
            <label>TRACKING ID</label>
            <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{envio.id}</span>
          </div>
          <div className="detail-field">
            <label>ESTADO</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={getBadgeStyle(envio.estado)}>{envio.estado?.replace(/_/g, ' ')}</span>
              {envio.estado !== 'ENTREGADO' && envio.estado !== 'CANCELADO' && (
                <button className="btn btn-primary btn-sm" onClick={abrirModalEstado} style={{ fontSize: "10px", lineHeight: 1 }}>▼</button>
              )}
            </div>
          </div>
          <div className="detail-field">
            <label>DESCRIPCIÓN DE LA CARGA</label>
            <span>{envio.descripcionCarga || '-'}</span>
          </div>
        </div>

        <div className="info-row-grid">
          <div className="detail-field">
            <label>REMITENTE</label>
            <span>{envio.remitente || '-'}</span>
          </div>
          <div className="detail-field">
            <label>DESTINATARIO</label>
            <span>{envio.destinatario || '-'}</span>
          </div>
          <div className="detail-field">
            <label>DIRECCIÓN DE ENTREGA</label>
            <span>{envio.direccionEntrega || '-'}</span>
          </div>
        </div>

        <div className="info-row-grid">
          <div className="detail-field">
            <label>ORIGEN</label>
            <span>{envio.origen || '-'}</span>
          </div>
          <div className="detail-field">
            <label>DESTINO</label>
            <span>{envio.destino || '-'}</span>
          </div>
          <div className="detail-field">
            <label>FECHA ESTIMADA</label>
            <span>{envio.fechaEstimada || '-'}</span>
          </div>
        </div>

        <div className="info-row-grid" style={{ marginTop: '10px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginBottom: '0' }}>
          <div className="detail-field" style={{ gridColumn: 'span 3' }}>
            <label>REPARTIDOR ASIGNADO</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
              <span style={{ fontWeight: '600', fontSize: '15px' }}>
                {getNombreRepartidor(envio.repartidorId)}
              </span>
              
              {envio.repartidorId && (user?.role === 'SUPERVISOR' || user?.role === 'ADMINISTRADOR' || user?.role === 'OPERADOR') && (
                <button 
                  onClick={() => {
                    setRepartidorReasignar(envio.repartidorId);
                    setModalReasignarAbierto(true);
                  }}
                  style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', transition: 'all 0.2s' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                  </svg>
                  CAMBIAR
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
          <div className="detail-field">
            <label>OBSERVACIONES</label>
            <span>{envio.observaciones || '-'}</span>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '20px', left: '25px', display: 'flex', gap: '6px' }}>
          {user?.role === 'SUPERVISOR' && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/envios/editar/${id}`)}
              >
                EDITAR
              </button>
              {(envio.estado === 'INCIDENTE_REPORTADO' || envio.estado === 'PENDIENTE') && (
                <button
                  className="btn btn-danger"
                  onClick={() => setCancelacionAbierta(true)}
                >
                  CANCELAR ENVÍO
                </button>
              )}
            </>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: '20px', right: '25px', display: 'flex', gap: '6px' }}>
          <button className="btn btn-secondary" onClick={() => descargarEtiqueta(envio.id).catch(console.error)}>
            GENERAR ETIQUETA
          </button>
          <button className="btn btn-secondary" onClick={() => setHistorialAbierto(true)}>
            VER HISTORIAL
          </button>
        </div>
      </div>

      {historialAbierto && <ModalHistorial historial={envio.historial || []} alCerrar={() => setHistorialAbierto(false)} />}
      
      {cancelacionAbierta && (
        <ModalCancelacion 
          onConfirmar={handleConfirmarCancelacion} 
          onCerrar={() => setCancelacionAbierta(false)} 
        />
      )}

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px' }}>Actualizar estado del envío</h2>
            <div className="form-group">
              <label>Estado actual</label>
              <input value={envio.estado?.replace(/_/g, ' ')} disabled className="input-locked" />
            </div>
            <div className="form-group">
              <label>Nuevo estado</label>
              <select 
                value={modalForm.nuevoEstado} 
                onChange={e => setModalForm({...modalForm, nuevoEstado: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              >
                {getOpcionesDisponibles().map(st => (
                  <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                ))}
                {getOpcionesDisponibles().length === 0 && (
                  <option disabled>No hay estados siguientes disponibles</option>
                )}
              </select>
            </div>

            {modalForm.nuevoEstado === 'ASIGNADO' && (
              <div className="form-group">
                <label>Seleccionar repartidor *</label>
                <select 
                  value={modalForm.repartidorId} 
                  onChange={e => setModalForm({...modalForm, repartidorId: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                >
                  <option value="">-- Seleccione un repartidor --</option>
                  {repartidores.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group"><label>Fecha</label><input type="date" value={modalForm.fecha} onChange={e => setModalForm({...modalForm, fecha: e.target.value})} /></div>
            <div className="form-group"><label>Hora</label><input type="time" value={modalForm.hora} onChange={e => setModalForm({...modalForm, hora: e.target.value})} /></div>
            <div className="form-group"><label>Usuario</label><input value={modalForm.usuario} disabled className="input-locked" /></div>
            
            {modalError && <p className="error-msg" style={{ color: '#ef4444', fontWeight: 'bold' }}>{modalError}</p>}
            
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmarEstado} 
                disabled={getOpcionesDisponibles().length === 0}
              >
                CONFIRMAR
              </button>
              <button className="btn btn-secondary" onClick={() => setModalAbierto(false)}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {modalReasignarAbierto && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '10px' }}>Reasignar Repartidor</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
              El envío mantendrá su estado actual, pero se actualizará el responsable de la entrega.
            </p>
            
            <div className="form-group">
              <label>Nuevo Repartidor</label>
              <select 
                value={repartidorReasignar} 
                onChange={e => setRepartidorReasignar(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              >
                <option value="">-- Seleccione un repartidor --</option>
                {repartidores.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            
            <div className="modal-actions" style={{ marginTop: '25px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleReasignar} 
                disabled={!repartidorReasignar || repartidorReasignar === envio.repartidorId}
              >
                REASIGNAR
              </button>
              <button className="btn btn-secondary" onClick={() => setModalReasignarAbierto(false)}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleEnvio;