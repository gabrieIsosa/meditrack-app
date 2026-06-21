import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Search, Plus } from 'lucide-react';
import { getUsuarios, toggleEstadoUsuario } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ModalHistorialUsuario from '../../components/ModalHistorialUsuario';

const ROLE_COLORS = {
  ADMINISTRADOR: '#8b5cf6',
  SUPERVISOR: '#3b82f6',
  OPERADOR: '#f59e0b',
  REPARTIDOR: '#ef4444'
};

const ORDEN_ROLES = ['TOTAL', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR', 'REPARTIDOR'];

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaMovilVisible, setBusquedaMovilVisible] = useState(false);
  const [filtrosRoles, setFiltrosRoles] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [usuarioParaHistorial, setUsuarioParaHistorial] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const hasProcessedSuccess = useRef(false);

  useEffect(() => {
    getUsuarios().then(setUsuarios).catch(console.error);
  }, []);

  useEffect(() => {
    if ((location.state?.success || location.state?.editSuccess) && !hasProcessedSuccess.current) {
      hasProcessedSuccess.current = true;
      setIsEdit(!!location.state?.editSuccess);
      setShowSnackbar(true);
      const timer = setTimeout(() => setShowSnackbar(false), 3000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleToggleEstado = async (id) => {
    try {
      await toggleEstadoUsuario(id);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
    }
  };

  const contar = (rol) => usuarios.filter(u => u.role === rol).length;

  const toggleFiltro = (rol) => {
    setFiltrosRoles(prev => 
      prev.includes(rol) 
      ? prev.filter(r => r !== rol) 
      : [...prev, rol]
    );
  };

  const getPercent = (count) => {
    const raw = usuarios.length > 0 ? (count / usuarios.length) * 100 : 0;
    return Number.isInteger(raw) ? raw : Math.round(raw);
  };

  const getChartData = (key, color) => {
    if (usuarios.length === 0) return [{ value: 1, fill: '#E5E7EB' }];
    if (key === 'TOTAL') {
      return Object.entries(ROLE_COLORS).map(([rol, col]) => ({
        name: rol,
        value: contar(rol),
        fill: col
      })).filter(d => d.value > 0);
    } else {
      const cantidad = contar(key);
      return [
        { value: cantidad, fill: color },
        { value: usuarios.length - cantidad, fill: '#F3F4F6' }
      ];
    }
  };

  const usuariosFiltrados = [...usuarios].filter(u => {
    const term = busqueda.toLowerCase();
    const cumpleBusqueda = (
        u.nombre?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term) || 
        String(u.dni || '').toLowerCase().includes(term)
    );
    const cumpleRol = filtrosRoles.length === 0 || filtrosRoles.includes(u.role);
    const cumpleEstado = 
        filtroEstado === 'TODOS' ? true : 
        filtroEstado === 'ACTIVO' ? u.estadoActivo === true : 
        u.estadoActivo === false;
    return cumpleBusqueda && cumpleRol && cumpleEstado;
  });

  return (
    <div className="container">
      {showSnackbar && (
        <div className={`snackbar-msg ${isEdit ? 'edit' : ''}`}>
          {isEdit ? '¡Usuario editado correctamente!' : '¡Usuario creado correctamente!'}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .summary-details { justify-content: center !important; }
          .desktop-search { display: none !important; }
          .mobile-search-wrapper { display: flex !important; align-items: center; flex: 1; }
          .new-user-text { display: none !important; }
          .new-user-btn { padding: 10px !important; }
        }
        @media (min-width: 769px) {
          .mobile-search-wrapper { display: none !important; }
          .desktop-search { display: block !important; }
        }
      `}</style>
      
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión del personal</h1>
      </div>

      <div className="summary-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <div className="summary-chart-container" onClick={() => setFiltrosRoles([])} style={{ position: 'relative', cursor: 'pointer', minWidth: '200px', flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={200}>
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
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(data, index, e) => {
                  e.stopPropagation();
                  toggleFiltro(data.name);
                }}
              >
                {getChartData('TOTAL').map((entry, index) => {
                  const isActive = filtrosRoles.includes(entry.name);
                  const isHovered = activeIndex === index;
                  const targetOuterRadius = isActive || isHovered ? 92 : 85;
                  const targetFilter = filtrosRoles.length > 0 && !isActive ? 'opacity(0.3)' : 'none';
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill} 
                      style={{ transition: 'all 0.3s ease', filter: targetFilter }}
                      outerRadius={targetOuterRadius}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-center-label" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
            <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700' }}>TOTAL</div>
            <div style={{ fontSize: '28px', color: '#111827', fontWeight: '900' }}>{usuarios.length}</div>
          </div>
        </div>
        
        <div className="summary-details" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: '2 1 400px', alignContent: 'center' }}>
          {ORDEN_ROLES.filter(k => k !== 'TOTAL').map(key => {
            const count = contar(key);
            const color = ROLE_COLORS[key];
            const percent = getPercent(count);
            const active = filtrosRoles.includes(key);
            return (
              <div 
                key={key} 
                className={`detail-item ${active ? 'active' : ''}`}
                style={{ color: color, cursor: 'pointer', flex: '1 1 40%', minWidth: '180px' }}
                onClick={(e) => { e.stopPropagation(); toggleFiltro(key); }}
              >
                <div className="detail-info-block">
                  <span className="detail-label" style={{ color, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{key}</span>
                  <span className="detail-count" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{count}</span>
                </div>
                <div className="mini-chart-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={60}>
                    <PieChart>
                      <Pie
                        data={getChartData(key, color)}
                        innerRadius={22}
                        outerRadius={30}
                        stroke="none"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                        cx="50%"
                        cy="50%"
                      >
                        {getChartData(key, color).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="mini-percent" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                    {percent}<span className="mini-percent-symbol">%</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '20px', width: '100%' }}>
          
          <input
            className="desktop-search"
            style={{ flex: 1, margin: 0, padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd' }}
            placeholder="Buscar por Nombre, Email o DNI..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <div className="mobile-search-wrapper">
            {busquedaMovilVisible ? (
              <input
                autoFocus
                style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', width: '140px', transition: 'width 0.3s ease' }}
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onBlur={() => !busqueda && setBusquedaMovilVisible(false)}
              />
            ) : (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }} onClick={() => setBusquedaMovilVisible(true)}>
                <Search size={24} color="#374151" />
              </button>
            )}
          </div>
          
          <select 
            value={filtroEstado} 
            onChange={e => setFiltroEstado(e.target.value)}
            style={{ width: 'auto', padding: '10px 15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', fontWeight: '500', color: '#374151', cursor: 'pointer' }}
          >
            <option value="TODOS">Estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="INACTIVO">Solo Inactivos</option>
          </select>

          {filtrosRoles.length > 0 && (
            <button 
              style={{ padding: '10px 15px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' }} 
              onClick={() => setFiltrosRoles([])}
            >
              ✕ BORRAR FILTROS
            </button>
          )}
          
          {user?.role === 'ADMINISTRADOR' && (
            <button 
              className="new-user-btn"
              style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }} 
              onClick={() => navigate('/usuarios/nuevo')}
            >
              <Plus size={20} />
              <span className="new-user-text">+ NUEVO USUARIO</span>
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingBottom: '10px' }}>Nombre completo</th>
                <th className="hidden-mobile" style={{ textAlign: 'left', paddingBottom: '10px' }}>Email</th>
                <th style={{ textAlign: 'left', paddingBottom: '10px' }}>Rol</th>
                <th className="hidden-mobile" style={{ textAlign: 'left', paddingBottom: '10px' }}>Estado</th>
                <th style={{ textAlign: 'center', paddingBottom: '10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ fontWeight: 'bold', padding: '15px 0' }}>{u.nombre}</td>
                  <td className="hidden-mobile">{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td className="hidden-mobile">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={u.estadoActivo} 
                          onChange={() => handleToggleEstado(u.id)}
                        />
                        <span className="slider"></span>
                      </label>
                      <span className={`user-status-label ${u.estadoActivo ? 'status-active' : 'status-inactive'}`}>
                        {u.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="action-icon-btn" 
                        title="Editar Usuario"
                        onClick={() => navigate(`/usuarios/editar/${u.id}`)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                        </svg>
                      </button>
                      
                      <button 
                        className="action-icon-btn" 
                        title="Ver Historial"
                        onClick={() => {
                          setUsuarioParaHistorial(u);
                          setHistorialAbierto(true);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {historialAbierto && usuarioParaHistorial && (
        <ModalHistorialUsuario
          usuario={usuarioParaHistorial}
          alCerrar={() => {
            setHistorialAbierto(false);
            setUsuarioParaHistorial(null);
          }}
        />
      )}
    </div>
  );
}

export default Usuarios;