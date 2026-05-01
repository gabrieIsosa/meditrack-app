import React, { useState, useEffect } from 'react';

const StatusLine = ({ estadoActual, historial = [] }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const caminoBase = ['PENDIENTE', 'ASIGNADO', 'EN_PREPARACION', 'EN_TRANSITO'];

  const obtenerPasos = () => {
    if (estadoActual === 'CANCELADO') {
      const saltoDirecto = !historial.some(h => 
        h.tipo === 'CAMBIO_ESTADO' && 
        (h.detalle.includes('ASIGNADO') || h.detalle.includes('PREPARACION') || h.detalle.includes('TRANSITO'))
      );
      if (saltoDirecto) return ['PENDIENTE', 'CANCELADO'];
    }

    const registroIncidente = historial.find(h => 
      h.tipo === 'CAMBIO_ESTADO' && h.detalle.includes('INCIDENTE_REPORTADO')
    );

    if (registroIncidente || estadoActual === 'INCIDENTE_REPORTADO' || estadoActual === 'CANCELADO') {
      const detalle = registroIncidente?.detalle || "";
      const pasoPrevio = detalle.split(' → ')[0];
      if (pasoPrevio === 'EN_PUNTO_DE_ENTREGA') {
        return [...caminoBase, 'EN_PUNTO_DE_ENTREGA', 'INCIDENTE_REPORTADO', 'CANCELADO'];
      } else {
        return [...caminoBase, 'INCIDENTE_REPORTADO', 'CANCELADO'];
      }
    }
    return [...caminoBase, 'EN_PUNTO_DE_ENTREGA', 'ENTREGADO'];
  };

  const pasos = obtenerPasos();
  const indiceActual = pasos.indexOf(estadoActual);

  const getStepConfig = (step, index) => {
    const isPassed = index <= indiceActual && indiceActual !== -1;
    if (!isPassed) return { color: '#E5E7EB', icon: index + 1 };
    if (step === 'INCIDENTE_REPORTADO') return { color: '#F59E0B', icon: '!' };
    if (step === 'CANCELADO') return { color: '#EF4444', icon: '✕' };
    return { color: '#10B981', icon: '✓' };
  };

  const getLineColor = (index) => {
    if (indiceActual === -1 || index >= indiceActual) return '#E5E7EB';
    const nextStep = pasos[index + 1];
    if (nextStep === 'INCIDENTE_REPORTADO') return '#F59E0B';
    if (nextStep === 'CANCELADO') return '#EF4444';
    return '#10B981';
  };

  return (
    <div className="card" style={{ marginBottom: '20px', padding: isMobile ? '20px' : '40px 0' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: isMobile ? 'flex-start' : (pasos.length <= 2 ? 'center' : 'space-between'), 
        position: 'relative', 
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        gap: isMobile ? '20px' : (pasos.length <= 2 ? '150px' : '0'),
        margin: '0 auto',
        padding: isMobile ? '0 10px' : '0 60px',
        maxWidth: '1200px'
      }}>
        {pasos.map((step, index) => {
          const config = getStepConfig(step, index);
          const isPassed = index <= indiceActual && indiceActual !== -1;
          
          return (
            <div key={`${step}-${index}`} style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'row' : 'column', 
              alignItems: 'center', 
              zIndex: 3, 
              flex: isMobile ? 'none' : (pasos.length <= 2 ? 'none' : 1), 
              position: 'relative',
              width: isMobile ? '100%' : 'auto'
            }}>
              {index < pasos.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '36px' : '18px',
                  left: isMobile ? '18px' : '50%',
                  width: isMobile ? '2px' : (pasos.length <= 2 ? '188px' : '100%'),
                  height: isMobile ? 'calc(100% + 20px)' : '3px',
                  backgroundColor: getLineColor(index),
                  zIndex: 1,
                  transition: 'background-color 0.3s'
                }} />
              )}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isPassed ? config.color : 'white',
                border: `2px solid ${isPassed ? config.color : '#D1D5DB'}`,
                color: isPassed ? 'white' : '#9CA3AF',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
                marginBottom: isMobile ? '0' : '12px',
                marginRight: isMobile ? '15px' : '0',
                transition: 'all 0.3s',
                zIndex: 2, 
                position: 'relative',
                flexShrink: 0
              }}>
                {config.icon}
              </div>
              <span style={{ 
                fontSize: '10px', 
                textAlign: isMobile ? 'left' : 'center',
                fontWeight: index === indiceActual ? '800' : '500',
                color: isPassed ? config.color : '#9CA3AF',
                textTransform: 'uppercase',
                maxWidth: isMobile ? 'none' : '90px'
              }}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusLine;