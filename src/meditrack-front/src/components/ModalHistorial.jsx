import React, { useState } from 'react';

const ESTADO_COLORS = {
  PENDIENTE: '#6b7280',
  ASIGNADO: '#4338CA',
  EN_PREPARACION: '#f59e0b',
  EN_TRANSITO: '#3b82f6',
  EN_PUNTO_DE_ENTREGA: '#06b6d4',
  INCIDENTE_REPORTADO: '#ef4444',
  ENTREGADO: '#10b981',
  CANCELADO: '#000000'
};

const ModalHistorial = ({ historial, alCerrar }) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(null);

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'CREACION': return { bg: '#F3E8FF', text: '#6B21A8' };
      case 'EDICION': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'CAMBIO_ESTADO': return { bg: '#D1FAE5', text: '#065F46' };
      case 'CANCELACION': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const formatDetalle = (detalle, tipo) => {
    if (!detalle) return '-';

    if (tipo === 'EDICION') {
      if (detalle.startsWith('+') || detalle.includes('[+]')) {
        const sinPrefijo = detalle.replace(/^(\+)\s?|\[\+\]\s?/, '');
        const partes = sinPrefijo.split(' x');
        const nombre = partes[0] ? partes[0].trim() : 'Medicamento';
        const cantidad = partes[1] ? partes[1].trim() : '1';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontWeight: '500' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5', color: '#065F46', width: '22px', height: '22px', borderRadius: '50%', fontSize: '14px', fontWeight: 'bold' }}>+</span>
            <span style={{ fontSize: '13px' }}>{nombre} <b style={{ color: '#065F46', marginLeft: '4px' }}>x {cantidad}</b></span>
          </div>
        );
      }

      if (detalle.startsWith('x ') || detalle.includes('[-]')) {
        const nombre = detalle.replace(/^x\s?|\[-\]\s?/, '').split(' x')[0].trim();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontWeight: '500' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', color: '#991B1B', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold' }}>✕</span>
            <span style={{ fontSize: '13px', color: '#4B5563' }}>{nombre}</span>
          </div>
        );
      }

      if (detalle.includes('→')) {
        const partesFlecha = detalle.split('→');
        const fragmentoIzquierdo = partesFlecha[0].trim();
        const cantNueva = partesFlecha[1] ? partesFlecha[1].trim() : '0';
        
        const cantAntesMatch = fragmentoIzquierdo.match(/x\s?(\d+)$/);
        const cantAntes = cantAntesMatch ? cantAntesMatch[1] : '0';
        const nombre = fragmentoIzquierdo.replace(/x\s?\d+$/, '').trim();

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151', fontWeight: '500' }}>
            <span style={{ fontSize: '13px' }}>{nombre}</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #BFDBFE' }}>
              <span style={{ color: '#4B5563', fontWeight: '600' }}>{cantAntes}</span>
              <span style={{ color: '#9CA3AF', fontWeight: 'bold' }}>→</span>
              <span style={{ color: '#1E40AF', fontWeight: '800' }}>{cantNueva}</span>
            </div>
          </div>
        );
      }
    }

    if (tipo === 'CAMBIO_ESTADO' && detalle.includes('→')) {
      const estados = detalle.split('→').map(s => s.trim());
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {estados.map((estado, idx) => (
            <React.Fragment key={idx}>
              <span style={{ 
                color: ESTADO_COLORS[estado.replace(/ /g, '_')] || '#374151',
                fontWeight: '700',
                textTransform: 'uppercase',
                fontSize: '12px'
              }}>
                {estado}
              </span>
              {idx < estados.length - 1 && <span style={{ color: '#9CA3AF' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      );
    }

    return detalle;
  };

  const renderDetalleMotivo = () => {
    if (!motivoSeleccionado) return null;

    const textoLimpio = motivoSeleccionado.replace('Motivo: ', '');
    const partes = textoLimpio.split('\nFirma: ');
    const motivo = partes[0] || '-';
    const firma = partes[1] || '-';

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '650px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        zIndex: 20,
        padding: '24px',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: '800' }}>Detalle de Cancelación</h3>
          <button 
            onClick={() => setMotivoSeleccionado(null)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9CA3AF', padding: '0 5px' }}
          >✕</button>
        </div>

        <div style={{ 
          overflowY: 'auto', 
          border: '1px solid #E5E7EB', 
          borderRadius: '8px' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#ffffff', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', width: '65%' }}>MOTIVO</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#ffffff', borderBottom: '1px solid #E5E7EB' }}>FIRMA RESPONSABLE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ 
                  padding: '15px', 
                  fontSize: '14px', 
                  color: '#374151', 
                  lineHeight: '1.5', 
                  verticalAlign: 'top', 
                  borderRight: '1px solid #E5E7EB',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {motivo}
                </td>
                <td style={{ 
                  padding: '15px', 
                  fontSize: '14px', 
                  color: '#111827', 
                  fontWeight: '600', 
                  verticalAlign: 'top',
                  fontStyle: 'italic',
                  wordBreak: 'break-word'
                }}>
                  {firma}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content hist-modal-box" style={{ maxWidth: '850px', width: '95%', position: 'relative' }}>
        <style>{`
          .hist-mobile-grid {
            display: none;
          }
          @media (max-width: 768px) {
            .hist-table-container {
              display: none !important;
            }
            .hist-mobile-grid {
              display: flex !important;
              flex-direction: column;
              gap: 12px;
              max-height: 380px;
              overflow-y: auto;
              padding-bottom: 10px;
            }
            .hist-modal-box {
              padding: 20px 16px !important;
              border-radius: 16px !important;
            }
            .hist-mobile-card {
              background: #ffffff;
              border: 1px solid #E5E7EB;
              border-radius: 12px;
              padding: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              display: flex;
              flex-direction: column;
            }
            .hist-card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
            }
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Historial de operaciones</h2>
          <button onClick={alCerrar} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
        </div>

        <div className="hist-table-container" style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#10B981', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ padding: '12px', fontSize: '12px', color: '#ffffff', textTransform: 'uppercase' }}>Evento</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#ffffff', textTransform: 'uppercase' }}>Detalle</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#ffffff', textTransform: 'uppercase' }}>Fecha / Hora</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#ffffff', textTransform: 'uppercase' }}>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {historial && historial.length > 0 ? (
                historial.slice().reverse().map((item, index) => {
                  const colors = getBadgeColor(item.tipo);
                  const esCancelacion = item.tipo === 'CANCELACION';

                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                          backgroundColor: colors.bg, color: colors.text, display: 'inline-block'
                        }}>{item.tipo?.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>
                        {esCancelacion ? (
                          <button 
                            onClick={() => setMotivoSeleccionado(item.detalle)}
                            style={{ background: 'none', border: 'none', color: '#2563EB', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '600' }}
                          >Ver motivo</button>
                        ) : (
                          formatDetalle(item.detalle, item.tipo)
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>
                        {item.fecha} <span style={{ color: '#9CA3AF', marginLeft: '5px' }}>{item.hora}</span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                        {item.usuario || 'Sistema'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No hay registros en el historial</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="hist-mobile-grid">
          {historial && historial.length > 0 ? (
            historial.slice().reverse().map((item, index) => {
              const colors = getBadgeColor(item.tipo);
              const esCancelacion = item.tipo === 'CANCELACION';

              return (
                <div key={index} className="hist-mobile-card" style={{ borderLeft: `4px solid ${colors.text}` }}>
                  <div className="hist-card-header">
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                      backgroundColor: colors.bg, color: colors.text, display: 'inline-block'
                    }}>{item.tipo?.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {item.fecha} {item.hora}
                    </span>
                  </div>
                  <div className="hist-card-body" style={{ margin: '8px 0', fontSize: '13px', color: '#374151' }}>
                    <strong>Detalle:</strong>{' '}
                    {esCancelacion ? (
                      <button 
                        onClick={() => setMotivoSeleccionado(item.detalle)}
                        style={{ background: 'none', border: 'none', color: '#2563EB', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '600' }}
                      >Ver motivo</button>
                    ) : (
                      formatDetalle(item.detalle, item.tipo)
                    )}
                  </div>
                  <div className="hist-card-footer" style={{ fontSize: '12px', color: '#6B7280', borderTop: '1px solid #F3F4F6', paddingTop: '6px', marginTop: '6px', textAlign: 'right' }}>
                    Responsable: <strong>{item.usuario || 'Sistema'}</strong>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              No hay registros en el historial
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={alCerrar}>CERRAR</button>
        </div>

        {motivoSeleccionado && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 15, borderRadius: '8px', backdropFilter: 'blur(2px)' }} onClick={() => setMotivoSeleccionado(null)} />}
        {renderDetalleMotivo()}
      </div>
    </div>
  );
};

export default ModalHistorial;