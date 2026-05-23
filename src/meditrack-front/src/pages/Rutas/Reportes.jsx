import { useState } from 'react';
import { getReporte } from '../../services/api';

function Reportes() {
  const [tema, setTema] = useState('volumen');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [granularidad, setGranularidad] = useState('diaria');
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleGenerarReporte = async (e) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) {
      setError('Por favor, seleccione un rango de fechas válido.');
      return;
    }
    setError('');
    setCargando(true);
    setResultados(null);
    try {
      const data = await getReporte({ tema, fechaInicio, fechaFin, granularidad });
      setResultados(data);
    } catch (err) {
      setError(err.message || 'Error al generar el reporte.');
    } finally {
      setCargando(false);
    }
  };

  const skeletonStyle = { backgroundColor: '#E5E7EB', borderRadius: '8px', height: '42px', width: '100%', marginBottom: '10px' };
  
  const buttonGroupStyle = { 
    display: 'flex', 
    gap: '10px', 
    marginTop: '5px',
    flexWrap: 'wrap',
    width: '100%'
  };

  const getButtonStyle = (isActive) => ({
    flex: '1 1 120px',
    padding: '12px 15px',
    border: 'none',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#10B981' : '#F3F4F6',
    color: isActive ? 'white' : '#374151',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    whiteSpace: 'nowrap'
  });

  const responsiveGridStyle = {
    display: 'flex',
    gap: '20px',
    width: '100%',
    flexWrap: 'wrap'
  };

  const responsiveFieldStyle = {
    flex: '1 1 250px',
    display: 'flex',
    flexDirection: 'column'
  };

  const tableContainerStyle = {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    border: '1px solid #E5E7EB', 
    borderRadius: '8px', 
    background: '#fff'
  };

  return (
    <div className="container" style={{ padding: '10px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: 'calc(18px + 1vw)', margin: 0 }}>Reportes operativos</h1>
      </div>

      <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleGenerarReporte}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Tema del Reporte *</label>
              <div style={buttonGroupStyle}>
                <button type="button" style={getButtonStyle(tema === 'volumen')} onClick={() => setTema('volumen')}>
                  Volumen
                </button>
                <button type="button" style={getButtonStyle(tema === 'entregas')} onClick={() => setTema('entregas')}>
                  Entregas a tiempo
                </button>
                <button type="button" style={getButtonStyle(tema === 'incidencias')} onClick={() => setTema('incidencias')}>
                  Incidencias
                </button>
              </div>
            </div>

            <div style={responsiveGridStyle}>
              <div className="form-group" style={responsiveFieldStyle}>
                <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Fecha Inicio *</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '5px', boxSizing: 'border-box', fontSize: '14px' }} />
              </div>
              <div className="form-group" style={responsiveFieldStyle}>
                <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Fecha Fin *</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '5px', boxSizing: 'border-box', fontSize: '14px' }} />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Granularidad *</label>
              <div style={buttonGroupStyle}>
                <button type="button" style={getButtonStyle(granularidad === 'diaria')} onClick={() => setGranularidad('diaria')}>
                  Diaria
                </button>
                <button type="button" style={getButtonStyle(granularidad === 'semanal')} onClick={() => setGranularidad('semanal')}>
                  Semanal
                </button>
                <button type="button" style={getButtonStyle(granularidad === 'mensual')} onClick={() => setGranularidad('mensual')}>
                  Mensual
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <button type="submit" style={{ width: '100%', maxWidth: '200px', padding: '12px 25px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              GENERAR REPORTE
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '25px' }}>
        {error && <div style={{ color: '#dc3545', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 'bold', fontSize: '14px' }}>{error}</div>}

        <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '700', color: '#374151' }}>Resultados del análisis</h3>
          
          {cargando && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3, 4, 5].map(i => <div key={i} style={skeletonStyle}></div>)}
            </div>
          )}

          {!cargando && resultados && resultados.data.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#F3F4F6', color: '#6B7280', borderRadius: '12px', fontWeight: '600', border: '1px solid #E5E7EB', fontSize: '14px' }}>
              No se encontraron resultados para el período seleccionado
            </div>
          )}

          {!cargando && resultados && resultados.data.length > 0 && (
            <div style={tableContainerStyle}>
              {resultados.tipo === 'volumen' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '500px' }}>
                  <thead style={{ backgroundColor: '#F3F4F6' }}>
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Período</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Estado del Envío</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Cantidad Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.data.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px' }}>{item.periodo}</td>
                        <td style={{ padding: '10px' }}><span style={{ fontWeight: '600' }}>{item.estado}</span></td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {resultados.tipo === 'entregas' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '500px' }}>
                  <thead style={{ backgroundColor: '#F3F4F6' }}>
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Período</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Total Envíos</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>A Tiempo</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Porcentaje Eficiencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.data.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px' }}>{item.periodo}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.totalEnvios}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.totalATiempo}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#15803D' }}>{item.porcentajeATiempo}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {resultados.tipo === 'incidencias' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
                  <thead style={{ backgroundColor: '#F3F4F6' }}>
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Período</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Tipo de Incidencia</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Repartidor Asignado</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.data.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px', color: '#6B7280' }}>{item.periodo}</td>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{item.tipo}</td>
                        <td style={{ padding: '10px' }}>{item.repartidor}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reportes;