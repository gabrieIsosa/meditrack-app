import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, Eye, Clock, Download, Plus, ArrowLeft, ArrowRight, Search, EllipsisVertical } from 'lucide-react';
import { getEnvios, descargarEtiqueta } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ModalHistorial from '../../components/ModalHistorial';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px' }) => (
  <div style={{ width, height, borderRadius, backgroundColor: '#E5E7EB', animation: 'pulse 1.5s infinite' }} />
);

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

const ORDEN_METRICAS = [
  'TOTAL', 'ENTREGADO', 'CANCELADO',
  'PENDIENTE', 'ASIGNADO', 'EN_PREPARACION',
  'EN_TRANSITO', 'EN_PUNTO_DE_ENTREGA', 'INCIDENTE_REPORTADO'
];

const ITEMS_PER_PAGE = 10;

function Home() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarBusquedaMobile, setMostrarBusquedaMobile] = useState(false);
  const [menuActivoEnvioId, setMenuActivoEnvioId] = useState(null);
  const [filtrosEstados, setFiltrosEstados] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fechaCreacion', direction: 'asc' });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const menuRef = useRef(null);
  const hasProcessedSuccess = useRef(false);

  useEffect(() => {
    getEnvios()
      .then(data => {
        setEnvios(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (location.state?.success && !hasProcessedSuccess.current) {
      hasProcessedSuccess.current = true;
      setShowSnackbar(true);
      const timer = setTimeout(() => setShowSnackbar(false), 3000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    function handleClickAfuera(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuActivoEnvioId(null);
      }
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const contar = (estado) => envios.filter(e => e.estado === estado).length;

  const toggleFiltro = (estado) => {
    setFiltrosEstados(prev => prev.includes(estado) ? prev.filter(s => s !== estado) : [...prev, estado]);
    setCurrentPage(1);
  };

  const getPercent = (count) => {
    const raw = envios.length > 0 ? (count / envios.length) * 100 : 0;
    return Number.isInteger(raw) ? raw : Math.round(raw);
  };

  const getChartData = (key, color) => {
    if (envios.length === 0) return [{ value: 1, fill: '#E5E7EB' }];
    if (key === 'TOTAL') {
      return Object.entries(ESTADO_COLORS).map(([est, col]) => ({ name: est, value: contar(est), fill: col })).filter(d => d.value > 0);
    } else {
      const cantidad = contar(key);
      return [{ value: cantidad, fill: color }, { value: envios.length - cantidad, fill: '#F3F4F6' }];
    }
  };

  const formatearTextoEstado = (key) => {
    if (key === 'EN_PUNTO_DE_ENTREGA') return 'PUNTO ENTREGA';
    if (key === 'INCIDENTE_REPORTADO') return 'INCIDENTES';
    if (key === 'ASIGNADO') return 'ASIGNADOS';
    if (key === 'PENDIENTE') return 'PENDIENTES';
    return key.replace(/_/g, ' ');
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filtradosYOrdenados = [...envios]
    .filter(e => {
      const term = busqueda.toLowerCase();
      const cumpleBusqueda = (e.id.toLowerCase().includes(term) || e.remitente?.toLowerCase().includes(term) || e.destinatario?.toLowerCase().includes(term));
      const cumpleEstado = filtrosEstados.length === 0 || filtrosEstados.includes(e.estado);
      const fecha = e.fechaCreacion.split(' ')[0];
      const cumpleFecha = (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      return cumpleBusqueda && cumpleEstado && cumpleFecha;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filtradosYOrdenados.length / ITEMS_PER_PAGE);
  const paginatedData = filtradosYOrdenados.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="container">
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @media (max-width: 1024px) {
            .dashboard-original { display: none !important; }
            .dashboard-alternativo { display: flex !important; }
            .search-desktop { display: none !important; }
            .search-mobile-trigger { display: flex !important; }
            .acciones-desktop { display: none !important; }
            .acciones-mobile { display: block !important; }
        }
        @media (min-width: 1025px) {
            .dashboard-original { display: flex !important; }
            .dashboard-alternativo { display: none !important; }
            .search-desktop { display: block !important; }
            .search-mobile-trigger { display: none !important; }
            .acciones-desktop { display: flex !important; }
            .acciones-mobile { display: none !important; }
        }
        @media (max-width: 768px) {
            .mobile-hidden { display: none !important; }
        }
      `}</style>
      {showSnackbar && <div className="snackbar-msg">¡Envío creado correctamente!</div>}

      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/menu')}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de envíos</h1>
      </div>

      <div className="summary-card">
        {loading ? (
            <>
                <div className="dashboard-original" style={{ alignItems: 'center', gap: '20px', width: '100%' }}>
                    <Skeleton width="170px" height="170px" borderRadius="50%" />
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {[...Array(8)].map((_, i) => <Skeleton key={i} height="60px" />)}
                    </div>
                </div>
                <div className="dashboard-alternativo" style={{ width: '100%', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', background: '#f9fafb', padding: '15px', borderRadius: '12px' }}>
                        <Skeleton width="110px" height="110px" borderRadius="50%" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                        {[...Array(8)].map((_, i) => <Skeleton key={i} height="65px" borderRadius="8px" />)}
                    </div>
                </div>
            </>
        ) : (
            <>
                <div className="dashboard-original">
                    <div className="summary-chart-container" onClick={() => setFiltrosEstados([])}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={getChartData('TOTAL')}
                            innerRadius={60}
                            outerRadius={85}
                            stroke="none"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            onMouseEnter={(data, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            onClick={(data, index, e) => { e.stopPropagation(); toggleFiltro(data.name); }}
                        >
                            {getChartData('TOTAL').map((entry, index) => {
                            const isActive = filtrosEstados.includes(entry.name);
                            const isHovered = activeIndex === index;
                            return (
                                <Cell key={`cell-${index}`} fill={entry.fill} style={{ transition: 'all 0.3s ease', filter: (filtrosEstados.length > 0 && !isActive) ? 'opacity(0.3)' : 'none' }} outerRadius={isActive || isHovered ? 92 : 85} />
                            );
                            })}
                        </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-center-label" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700' }}>TOTAL</div>
                        <div style={{ fontSize: '28px', color: '#111827', fontWeight: '900' }}>{envios.length}</div>
                    </div>
                    </div>
                    
                    <div className="summary-details">
                    {ORDEN_METRICAS.filter(k => k !== 'TOTAL').map(key => {
                        const count = contar(key);
                        const percent = getPercent(count);
                        const color = ESTADO_COLORS[key];
                        const active = filtrosEstados.includes(key);
                        return (
                        <div key={key} className={`detail-item ${active ? 'active' : ''}`} style={{ color: color }} onClick={(e) => { e.stopPropagation(); toggleFiltro(key); }}>
                            <div className="detail-info-block">
                            <span className="detail-label" style={{ color }}>{key.replace(/_/g, ' ')}</span>
                            <span className="detail-count">{count}</span>
                            </div>
                            <div className="mini-chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <Pie data={getChartData(key, color)} innerRadius={26} outerRadius={34} stroke="none" dataKey="value" startAngle={90} endAngle={-270} isAnimationActive={false}>
                                    {getChartData(key, color).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <span className="mini-percent">{percent}%</span>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </div>

                <div className="dashboard-alternativo" style={{ width: '100%', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '20px', background: '#f9fafb', padding: '15px', borderRadius: '12px' }}>
                        <div className="summary-chart-container" style={{ width: '110px', height: '110px', position: 'relative', margin: 0 }} onClick={() => setFiltrosEstados([])}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <Pie
                                    data={getChartData('TOTAL')}
                                    innerRadius={38}
                                    outerRadius={52}
                                    stroke="none"
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                    paddingAngle={1}
                                    onClick={(data, index, e) => { e.stopPropagation(); toggleFiltro(data.name); }}
                                >
                                    {getChartData('TOTAL').map((entry, index) => {
                                    const isActive = filtrosEstados.includes(entry.name);
                                    return (
                                        <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: (filtrosEstados.length > 0 && !isActive) ? 'opacity(0.3)' : 'none' }} outerRadius={isActive ? 56 : 52} />
                                    );
                                    })}
                                </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="chart-center-label" style={{ textAlign: 'center', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                <div style={{ fontSize: '8px', color: '#6B7280', fontWeight: '700' }}>TOTAL</div>
                                <div style={{ fontSize: '18px', color: '#111827', fontWeight: '900' }}>{envios.length}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                        {ORDEN_METRICAS.filter(k => k !== 'TOTAL').map(key => {
                            const count = contar(key);
                            const percent = getPercent(count);
                            const color = ESTADO_COLORS[key];
                            const active = filtrosEstados.includes(key);
                            return (
                                <div key={key} onClick={() => toggleFiltro(key)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${active ? color : '#e5e7eb'}`, background: active ? `${color}08` : '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', transition: 'all 0.2s' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatearTextoEstado(key)}</span>
                                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>{count}</span>
                                    </div>
                                    <div style={{ width: '45px', height: '45px', position: 'relative', flexShrink: 0 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={getChartData(key, color)} innerRadius={14} outerRadius={20} stroke="none" dataKey="value" startAngle={90} endAngle={-270} isAnimationActive={false}>
                                                    {getChartData(key, color).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '9px', fontWeight: '700', color: '#374151' }}>{percent}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </>
        )}
      </div>

      <div className="card">
        <div className="table-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', width: '100%' }}>
          <input className="search-input search-desktop" style={{ margin: 0, flex: 1 }} placeholder="Buscar..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setCurrentPage(1); }} />
          
          <div className="search-mobile-trigger" style={{ display: 'flex', alignItems: 'center', flex: mostrarBusquedaMobile ? 1 : 'none', transition: 'all 0.3s ease' }}>
            <button style={{ padding: '8px', borderRadius: '50%', border: '1px solid #d1d5db', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }} onClick={() => setMostrarBusquedaMobile(!mostrarBusquedaMobile)}>
              <Search size={16} color="#4b5563" />
            </button>
            {mostrarBusquedaMobile && (
              <input className="search-input" style={{ margin: 0, marginLeft: '8px', flex: 1, padding: '6px 10px', fontSize: '13px', transition: 'all 0.3s ease' }} placeholder="Buscar..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setCurrentPage(1); }} autoFocus />
            )}
          </div>

          {!mostrarBusquedaMobile && (
            <>
              <div style={{ position: 'relative' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }} onClick={() => document.getElementById('date-inicio').showPicker()}>
                  Desde {fechaInicio ? `: ${fechaInicio}` : ''} <Calendar size={14} color="#10b981" />
                </button>
                <input id="date-inicio" type="date" value={fechaInicio} onChange={e => { setFechaInicio(e.target.value); setCurrentPage(1); }} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }} onClick={() => document.getElementById('date-fin').showPicker()}>
                  Hasta {fechaFin ? `: ${fechaFin}` : ''} <Calendar size={14} color="#10b981" />
                </button>
                <input id="date-fin" type="date" value={fechaFin} onChange={e => { setFechaFin(e.target.value); setCurrentPage(1); }} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
              </div>
            </>
          )}

          {(filtrosEstados.length > 0 || fechaInicio || fechaFin || busqueda) && (
            <button className="clear-filters-btn" onClick={() => { setFiltrosEstados([]); setFechaInicio(''); setFechaFin(''); setBusqueda(''); setMostrarBusquedaMobile(false); setCurrentPage(1); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✕</button>
          )}
          {(user?.role === 'SUPERVISOR' || user?.role === 'ADMINISTRADOR') && (
            <button className="btn-new-shipment" onClick={() => navigate('/envios/nuevo')} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={16} /> NUEVO</button>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Destinatario</th>
              <th className="mobile-hidden">Estado</th>
              <th className="mobile-hidden" onClick={() => handleSort('fechaCreacion')} style={{ cursor: 'pointer', userSelect: 'none' }}>F. Creación</th>
              <th className="mobile-hidden" onClick={() => handleSort('fechaEstimada')} style={{ cursor: 'pointer', userSelect: 'none' }}>F. Envío</th>
              <th className="mobile-hidden">Responsable</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                [...Array(5)].map((_, i) => (
                    <tr key={i}>
                        <td style={{ padding: '15px' }}><Skeleton /></td>
                        <td style={{ padding: '15px' }}><Skeleton /></td>
                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton /></td>
                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton /></td>
                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton /></td>
                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton /></td>
                        <td style={{ padding: '15px' }}><Skeleton /></td>
                    </tr>
                ))
            ) : (
                paginatedData.map(e => (
                    <tr key={e.id}>
                        <td style={{ fontWeight: 'bold', color: '#2563EB' }}>{e.id}</td>
                        <td>{e.destinatario}</td>
                        <td className="mobile-hidden"><span className="status-tag" style={{ backgroundColor: `${ESTADO_COLORS[e.estado]}15`, color: ESTADO_COLORS[e.estado] }}>{e.estado?.replace(/_/g, ' ')}</span></td>
                        <td className="mobile-hidden" style={{ fontSize: '13px' }}>{e.fechaCreacion}</td>
                        <td className="mobile-hidden" style={{ fontSize: '13px' }}>{e.fechaEstimada || '-'}</td>
                        <td className="mobile-hidden">{e.usuarioResponsable}</td>
                        <td>
                            <div className="acciones-desktop" style={{ justifyContent: 'center', gap: '8px' }}>
                                <button className="action-icon-btn" title="Ver detalle" onClick={() => navigate(`/detalle/${e.id}`)}><Eye size={18} /></button>
                                <button className="action-icon-btn" title="Ver historial" onClick={() => setEnvioSeleccionado(e)}><Clock size={18} /></button>
                                <button className="action-icon-btn" title="Descargar etiqueta" onClick={() => descargarEtiqueta(e.id).catch(console.error)}><Download size={18} /></button>
                            </div>

                            <div className="acciones-mobile" style={{ position: 'relative', textAlign: 'center' }}>
                                <button className="action-icon-btn" style={{ margin: '0 auto' }} onClick={(event) => { event.stopPropagation(); setMenuActivoEnvioId(menuActivoEnvioId === e.id ? null : e.id); }}>
                                    <EllipsisVertical size={20} />
                                </button>
                                {menuActivoEnvioId === e.id && (
                                    <div ref={menuRef} style={{ position: 'absolute', right: '10px', top: '25px', zIndex: 50, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', minWidth: '120px', overflow: 'hidden' }}>
                                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#374151' }} onClick={() => { setMenuActivoEnvioId(null); navigate(`/detalle/${e.id}`); }}>
                                            <Eye size={16} /> Ver detalle
                                        </button>
                                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#374151' }} onClick={() => { setMenuActivoEnvioId(null); setEnvioSeleccionado(e); }}>
                                            <Clock size={16} /> Historial
                                        </button>
                                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#374151' }} onClick={() => { setMenuActivoEnvioId(null); descargarEtiqueta(e.id).catch(console.error); }}>
                                            <Download size={16} /> Etiqueta
                                        </button>
                                    </div>
                                )}
                            </div>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '10px' }}>
            <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)} 
                style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: currentPage === 1 ? '#ccc' : '#10b981' }}
            >
                <ArrowLeft size={20} />
            </button>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>Página {currentPage} de {totalPages}</span>
            <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)} 
                style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: currentPage === totalPages ? '#ccc' : '#10b981' }}
            >
                <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      {envioSeleccionado && <ModalHistorial historial={envioSeleccionado.historial} alCerrar={() => setEnvioSeleccionado(null)} />}
    </div>
  );
}

export default Home;