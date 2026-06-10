import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getEnvioById, updateEstadoEnvio, cancelarEnvio, getUsuarios, reasignarRepartidorEnvio, descargarEtiqueta, getMedicamentos, BASE_URL } from '../../services/api';
import ModalHistorial from '../../components/ModalHistorial';
import StatusLine from '../../components/StatusLine';
import ModalCancelacion from '../../components/ModalCancelacion';
import { useAuth } from '../../context/AuthContext';
import { Copy, Check } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [repartidores, setRepartidores] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [itemsCarga, setItemsCarga] = useState([]);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [cancelacionAbierta, setCancelacionAbierta] = useState(false);
  const [modalReasignarAbierto, setModalReasignarAbierto] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  
  const [modalForm, setModalForm] = useState({ nuevoEstado: '', fecha: '', hora: '', usuario: '', repartidorId: '' });
  const [repartidorReasignar, setRepartidorReasignar] = useState('');
  const [modalError, setModalError] = useState('');

  const [tipoIncidencia, setTipoIncidencia] = useState('');
  const [descripcionIncidencia, setDescripcionIncidencia] = useState('');

  useEffect(() => {
  getMedicamentos()
    .then(setCatalogo)
    .catch(() => {});

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

      if (data.detalles && Array.isArray(data.detalles)) {
        const itemsMapeados = data.detalles.map((item, index) => ({
          id: item.id || `det-${index}-${Date.now()}`,
          nombre: item.medicamento?.nombre || 'Desconocido',
          presentacion: item.medicamento?.presentacion || '',
          lote: item.lote || 'N/A',
          vencimiento: item.fechaVencimiento || 'N/A',
          cantidad: Number(item.cantidad || 1),
          imagenUrl: item.medicamento?.imagenUrl || '',
          esManual: false
        }));
        setItemsCarga(itemsMapeados);
      } else {
        let textoOriginal = data.descripcionCarga || '';
        let itemsParseados = [];
        let parteManual = '';
        let parteMeds = '';

        if (typeof textoOriginal === 'string' && textoOriginal.trim() !== '') {
          if (textoOriginal.includes('| Meds: ')) {
            const partes = textoOriginal.split('| Meds: ');
            parteManual = partes[0].trim();
            parteMeds = partes[1] || '';
          } else if (textoOriginal.startsWith('Meds: ')) {
            parteMeds = textoOriginal.replace('Meds: ', '');
          } else {
            parteManual = textoOriginal;
          }

          if (parteManual.trim()) {
            const mItems = parteManual.split(', ');
            mItems.forEach((item, index) => {
              if (!item.trim()) return;
              const match = item.match(/^(.*?)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
              if (match) {
                itemsParseados.push({
                  id: `manual-${index}-${Date.now()}`,
                  nombre: match[1],
                  presentacion: '',
                  lote: match[2],
                  vencimiento: match[3],
                  cantidad: Number(match[4]),
                  esManual: true
                });
              } else {
                const matchSimple = item.match(/^(.*?)\sx(\d+)$/);
                itemsParseados.push({
                  id: `manual-${index}-${Date.now()}`,
                  nombre: matchSimple ? matchSimple[1] : item,
                  presentacion: '',
                  lote: 'N/A',
                  vencimiento: 'N/A',
                  cantidad: matchSimple ? Number(matchSimple[2]) : 1,
                  esManual: true
                });
              }
            });
          }

          if (parteMeds.trim()) {
            const medItems = parteMeds.split(', ');
            medItems.forEach((item, index) => {
              if (!item.trim()) return;
              const match = item.match(/^(.*?)\s\((.*?)\)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
              if (match) {
                itemsParseados.push({
                  id: `med-${index}-${Date.now()}`,
                  nombre: match[1],
                  presentacion: match[2],
                  lote: match[3],
                  vencimiento: match[4],
                  cantidad: Number(match[5]),
                  esManual: false
                });
              } else {
                const matchSimple = item.match(/^(.*?)\s\((.*?)\)\sx(\d+)$/);
                if (matchSimple) {
                  itemsParseados.push({
                    id: `med-${index}-${Date.now()}`,
                    nombre: matchSimple[1],
                    presentacion: matchSimple[2],
                    lote: 'N/A',
                    vencimiento: 'N/A',
                    cantidad: Number(matchSimple[3]),
                    esManual: false
                  });
                } else {
                  const matchVerySimple = item.match(/^(.*?)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
                  if (matchVerySimple) {
                    itemsParseados.push({
                      id: `med-${index}-${Date.now()}`,
                      nombre: matchVerySimple[1],
                      presentacion: '',
                      lote: matchVerySimple[2],
                      vencimiento: matchVerySimple[3],
                      bytes: '',
                      amount: '',
                      cantidad: Number(matchVerySimple[4]),
                      esManual: false
                    });
                  } else {
                    itemsParseados.push({
                      id: `med-${index}-${Date.now()}`,
                      nombre: item,
                      presentacion: '',
                      lote: 'N/A',
                      vencimiento: 'N/A',
                      cantidad: 1,
                      esManual: false
                    });
                  }
                }
              }
            });
          }
        }
        setItemsCarga(itemsParseados);
      }
    })
    .catch(() => setError('Envío no encontrado.'))
    .finally(() => setLoading(false));

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

  const itemsCargaVinculados = useMemo(() => {
    if (catalogo.length === 0 || itemsCarga.length === 0) return itemsCarga;
    
    return itemsCarga.map(m => {
      if (m.esManual || m.imagenUrl) return m;
      const coincidencia = catalogo.find(c => c.nombre.toLowerCase().trim() === m.nombre.toLowerCase().trim());
      if (coincidencia) {
        return { 
          ...m, 
          imagenUrl: coincidencia.imagenUrl, 
          presentacion: m.presentacion || coincidencia.presentacion 
        };
      }
      return m;
    });
  }, [catalogo, itemsCarga]);

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
    setTipoIncidencia('');
    setDescripcionIncidencia('');
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

    if (estadoActual === 'INCIDENTE_REPORTADO') {
      opciones.push('EN_TRANSITO');
      opciones.push('EN_PUNTO_DE_ENTREGA');
    }

    return opciones;
  };

  const handleConfirmarEstado = async () => {
    const { nuevoEstado, fecha, hora, usuario, repartidorId } = modalForm;
    
    if (nuevoEstado === 'ASIGNADO' && !repartidorId) {
      setModalError('Debe seleccionar un repartidor para asignar el envío.');
      return;
    }

    if (nuevoEstado === 'INCIDENTE_REPORTADO' && !tipoIncidencia) {
      setModalError('Debe seleccionar el tipo de incidencia para guardar el registro.');
      return;
    }

    try {
      const actualizado = await updateEstadoEnvio(
        id, 
        nuevoEstado, 
        fecha, 
        hora, 
        usuario, 
        repartidorId, 
        tipoIncidencia, 
        descripcionIncidencia
      );
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

  const handleCopiarId = () => {
    if (envio?.id) {
      navigator.clipboard.writeText(envio.id);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
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

  if (loading) {
    return (
      <div className="container">
        <style>
          {`
            .skeleton-box {
              background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
              background-size: 200% 100%;
              animation: skeleton-loading 1.5s infinite linear;
              border-radius: 4px;
            }
            @keyframes skeleton-loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            .info-row-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 25px;
            }
          `}
        </style>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div className="skeleton-box" style={{ width: '90px', height: '38px', borderRadius: '6px' }}></div>
          <div className="skeleton-box" style={{ width: '220px', height: '32px' }}></div>
        </div>
        <div className="skeleton-box" style={{ width: '100%', height: '70px', borderRadius: '8px', marginBottom: '24px' }}></div>
        <div className="card" style={{ padding: '30px 25px 80px 25px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div className="info-row-grid">
            <div>
              <div className="skeleton-box" style={{ width: '80px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '150px', height: '20px' }}></div>
            </div>
            <div>
              <div className="skeleton-box" style={{ width: '60px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '120px', height: '28px', borderRadius: '20px' }}></div>
            </div>
          </div>
          <div className="info-row-grid">
            <div>
              <div className="skeleton-box" style={{ width: '90px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '180px', height: '18px' }}></div>
            </div>
            <div>
              <div className="skeleton-box" style={{ width: '110px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '160px', height: '18px' }}></div>
            </div>
            <div>
              <div className="skeleton-box" style={{ width: '140px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '220px', height: '18px' }}></div>
            </div>
          </div>
          <div className="info-row-grid">
            <div>
              <div className="skeleton-box" style={{ width: '70px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '130px', height: '18px' }}></div>
            </div>
            <div>
              <div className="skeleton-box" style={{ width: '70px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '130px', height: '18px' }}></div>
            </div>
            <div>
              <div className="skeleton-box" style={{ width: '120px', height: '14px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ width: '100px', height: '18px' }}></div>
            </div>
          </div>
          <div style={{ marginTop: '10px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <div className="skeleton-box" style={{ width: '180px', height: '14px', marginBottom: '12px' }}></div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#F9FAFB', marginBottom: '12px' }}>
              <div className="skeleton-box" style={{ width: '50px', height: '50px', borderRadius: '8px' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div className="skeleton-box" style={{ width: '40%', height: '18px' }}></div>
                <div className="skeleton-box" style={{ width: '25%', height: '14px' }}></div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <div className="skeleton-box" style={{ width: '160px', height: '14px', marginBottom: '8px' }}></div>
            <div className="skeleton-box" style={{ width: '200px', height: '18px' }}></div>
          </div>
          <div style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <div className="skeleton-box" style={{ width: '120px', height: '14px', marginBottom: '8px' }}></div>
            <div className="skeleton-box" style={{ width: '90%', height: '18px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !envio) return <div className="container"><p>{error || 'Envío no encontrado.'}</p></div>;

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
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Detalle del envío</h1>
      </div>

      <StatusLine estadoActual={envio.estado} historial={envio.historial || []} />

      <div className="card detail-main-card" style={{ position: 'relative', paddingBottom: '80px', paddingTop: '30px' }}>
        <div className="info-row-grid">
          <div className="detail-field">
            <label>TRACKING ID</label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{envio.id}</span>
              <button
                onClick={handleCopiarId}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: copiado ? '#10B981' : '#9CA3AF',
                  transition: 'color 0.2s'
                }}
                title="Copiar ID al portapapeles"
              >
                {copiado ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
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
            <label>DESCRIPCIÓN DE LA CARGA</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              {itemsCargaVinculados.length > 0 ? (
                itemsCargaVinculados.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#F9FAFB' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.imagenUrl ? (
                        <img src={item.imagenUrl.startsWith('http') ? item.imagenUrl : `${BASE_URL}${item.imagenUrl}`} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9CA3AF' }}>
                          {item.esManual ? 'TXT' : 'N/A'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>
                        {item.nombre} {item.presentacion ? `(${item.presentacion})` : ''} x{item.cantidad}
                      </span>
                      <span style={{ color: '#4B5563', fontSize: '13px', fontWeight: '500' }}>
                        Lote: {item.lote} | Fecha de vencimiento: {item.vencimiento}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <span>{envio.descripcionCarga || '-'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="info-row-grid" style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginBottom: '0' }}>
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
                  style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', transition: 'all 0.2s' }}
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

        {envio.estado === 'ENTREGADO' && (
          <div className="info-row-grid" style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginBottom: '0' }}>
            <div className="detail-field" style={{ gridColumn: 'span 3' }}>
              <label style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                INFORMACIÓN DE RECEPCIÓN
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px', padding: '16px', border: '1px solid #D1FAE5', borderRadius: '8px', background: '#F0FDF4' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#065F46', textTransform: 'uppercase' }}>Recibido Por</span>
                  <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>{envio.receptorNombre || 'No registrado'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#065F46', textTransform: 'uppercase' }}>Número de DNI</span>
                  <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>{envio.receptorDni || 'No registrado'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {envio.incidencias && envio.incidencias.length > 0 && (
          <div className="info-row-grid" style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginBottom: '0' }}>
            <div className="detail-field" style={{ gridColumn: 'span 3' }}>
              <label style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                INCIDENTES REPORTADOS
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {envio.incidencias.map((inc, idx) => (
                  <div key={inc.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', border: '1px solid #FEE2E2', borderRadius: '8px', background: '#FEF2F2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#991B1B', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        {inc.titulo?.replaceAll('_', ' ')}
                      </span>
                      <span style={{ fontSize: '12px', color: '#7F1D1D', background: '#FEE2E2', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        {inc.fecha?.split('-').reverse().join('/')} {inc.hora}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#4B5563', lineHeight: '1.4' }}>
                      {inc.descripcion || 'Sin descripción detallada.'}
                    </p>
                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 'bold', alignSelf: 'flex-end' }}>
                      Reportado por: {inc.usuario}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

            {modalForm.nuevoEstado === 'INCIDENTE_REPORTADO' && (
              <>
                <div className="form-group">
                  <label>Tipo de Incidencia *</label>
                  <select
                    value={tipoIncidencia}
                    onChange={e => setTipoIncidencia(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  >
                    <option value="">-- Seleccione Tipo --</option>
                    <option value="FALLA_MECANICA">Falla Mecánica</option>
                    <option value="ACCIDENTE_VIAL">Accidente Vial</option>
                    <option value="ROBO_O_PERDIDA">Robo o Pérdida</option>
                    <option value="ZONA_INACCESIBLE">Zona Inaccesible o Bloqueo</option>
                    <option value="CLIENTE_AUSENTE">Cliente Ausente</option>
                    <option value="OTRO">Otro Imprevisto</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Descripción del Incidente</label>
                  <textarea
                    value={descripcionIncidencia}
                    onChange={e => setDescripcionIncidencia(e.target.value)}
                    placeholder="Detalles sobre lo sucedido..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </>
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
            <h2 style={{ marginBottom: '10px' }}>Reasignar repartidor</h2>
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