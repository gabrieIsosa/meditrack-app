import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getUsuarios, desbloquearUsuario } from '../../services/api';
import ModalHistorialUsuario from '../../components/ModalHistorialUsuario';

function CuentaRegresivaBloqueo({ fechaBloqueo, onExpirado }) {
    const calcularTiempoRestante = useCallback(() => {
        if (!fechaBloqueo) return null;
        const blockTime = new Date(fechaBloqueo);
        const endTime = new Date(blockTime.getTime() + 6 * 60 * 60 * 1000); // 6 horas después
        const now = new Date();
        const diffMs = endTime - now;
        
        if (diffMs <= 0) return null;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds };
    }, [fechaBloqueo]);

    const [tiempo, setTiempo] = useState(calcularTiempoRestante());

    useEffect(() => {
        setTiempo(calcularTiempoRestante());
        
        const interval = setInterval(() => {
            const rest = calcularTiempoRestante();
            setTiempo(rest);
            if (!rest) {
                clearInterval(interval);
                if (onExpirado) onExpirado();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [fechaBloqueo, calcularTiempoRestante, onExpirado]);

    if (!tiempo) {
        return <span style={{ color: '#10B981', fontWeight: 'bold' }}>Desbloqueo inminente</span>;
    }

    const pad = (num) => String(num).padStart(2, '0');

    return (
        <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px' }}>
            <strong>Tiempo restante:</strong> {pad(tiempo.hours)}:{pad(tiempo.minutes)}:{pad(tiempo.seconds)}
        </div>
    );
}

function Repartidores() {
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [historialAbierto, setHistorialAbierto] = useState(false);
    const [usuarioParaHistorial, setUsuarioParaHistorial] = useState(null);

    const navigate = useNavigate();

    const handleDesbloquear = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas desbloquear a este repartidor manualmente?")) {
            try {
                await desbloquearUsuario(id);
                const data = await getUsuarios();
                setUsuarios(data.filter(u => u.role === 'REPARTIDOR'));
            } catch (error) {
                alert(error.message || "Error al desbloquear repartidor");
            }
        }
    };

    useEffect(() => {
        getUsuarios()
            .then(data => {
                setUsuarios(
                    data.filter(u => u.role === 'REPARTIDOR')
                );
            })
            .catch(console.error);
    }, []);

    const repartidoresFiltrados = usuarios.filter(u => {
        const term = busqueda.toLowerCase();

        const cumpleBusqueda =
            u.nombre?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            String(u.dni || '').toLowerCase().includes(term);

        const cumpleEstado =
            filtroEstado === 'TODOS'
                ? true
                : filtroEstado === 'ACTIVO'
                    ? u.estadoActivo && !u.bloqueoActivo
                    : filtroEstado === 'BLOQUEADO'
                        ? u.bloqueoActivo
                        : !u.estadoActivo && !u.bloqueoActivo;

        return cumpleBusqueda && cumpleEstado;
    });

    return (
        <div className="container">
            <style>{`
                @media (max-width: 768px) {
                    .hidden-mobile { display: none !important; }
                    .show-mobile { display: block !important; }
                }
            `}</style>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '24px'
                }}
            >
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    VOLVER
                </button>

                <h1
                    style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#111827',
                        margin: 0
                    }}
                >
                    Gestión de Repartidores
                </h1>
            </div>

            <div
                style={{
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    marginBottom: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <span style={{ fontSize: '18px' }}>🚚</span>
                <strong>{usuarios.length}</strong>
                <span>Repartidores</span>
            </div>

            <div
                className="card"
                style={{
                    padding: '20px',
                    marginBottom: '24px'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            minWidth: '250px',
                            position: 'relative'
                        }}
                    >
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#6b7280'
                            }}
                        />

                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar repartidor..."
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db'
                            }}
                        />
                    </div>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #d1d5db',
                            minWidth: '180px'
                        }}
                    >
                        <option value="TODOS">Todos</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                        <option value="BLOQUEADO">Bloqueados</option>
                    </select>
                </div>
            </div>

            <div
                className="card"
                style={{
                    padding: '20px',
                    marginTop: '20px'
                }}
            >
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', paddingBottom: '12px', color: 'white', fontWeight: '700' }}>Nombre completo</th>
                                <th className="hidden-mobile" style={{ textAlign: 'left', paddingBottom: '12px', color: 'white', fontWeight: '700' }}>Email</th>
                                <th style={{ textAlign: 'left', paddingBottom: '12px', color: 'white', fontWeight: '700' }}>DNI</th>
                                <th className="hidden-mobile" style={{ textAlign: 'left', paddingBottom: '12px', color: 'white', fontWeight: '700' }}>Estado</th>
                                <th style={{ textAlign: 'center', paddingBottom: '12px', color: 'white', fontWeight: '700' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {repartidoresFiltrados.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px 0', verticalAlign: 'middle' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '15px' }}>{u.nombre}</div>
                                            <div className="show-mobile" style={{ display: 'none', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                {u.email}
                                            </div>
                                            {u.bloqueoActivo && (
                                                <div className="show-mobile" style={{ display: 'none', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>BLOQUEADO</span>
                                                    <CuentaRegresivaBloqueo 
                                                        fechaBloqueo={u.fechaBloqueo}
                                                        onExpirado={async () => {
                                                            const data = await getUsuarios();
                                                            setUsuarios(data.filter(usr => usr.role === 'REPARTIDOR'));
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="hidden-mobile" style={{ padding: '16px 0', color: '#4b5563', verticalAlign: 'middle' }}>{u.email}</td>
                                    <td style={{ padding: '16px 0', color: '#4b5563', verticalAlign: 'middle' }}>{u.dni || '-'}</td>
                                    <td className="hidden-mobile" style={{ padding: '16px 0', verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '999px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    backgroundColor: u.bloqueoActivo
                                                        ? '#FEE2E2'
                                                        : u.estadoActivo
                                                            ? '#DCFCE7'
                                                            : '#E5E7EB',
                                                    color: u.bloqueoActivo
                                                        ? '#991B1B'
                                                        : u.estadoActivo
                                                            ? '#166534'
                                                            : '#374151',
                                                    display: 'inline-block',
                                                    width: 'fit-content'
                                                }}
                                            >
                                                {u.bloqueoActivo ? 'BLOQUEADO' : u.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                            {u.bloqueoActivo && (
                                                <CuentaRegresivaBloqueo 
                                                    fechaBloqueo={u.fechaBloqueo}
                                                    onExpirado={async () => {
                                                        const data = await getUsuarios();
                                                        setUsuarios(data.filter(usr => usr.role === 'REPARTIDOR'));
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 0', textAlign: 'center', verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                                            {u.bloqueoActivo && (
                                                <button
                                                    className="action-icon-btn"
                                                    title="Desbloquear Repartidor"
                                                    onClick={() => handleDesbloquear(u.id)}
                                                    style={{ 
                                                        color: '#10b981',
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        padding: '6px',
                                                        borderRadius: '6px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                className="action-icon-btn"
                                                title="Ver historial"
                                                onClick={() => {
                                                    setUsuarioParaHistorial(u);
                                                    setHistorialAbierto(true);
                                                }}
                                                style={{ 
                                                    color: '#2563eb',
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer',
                                                    padding: '6px',
                                                    borderRadius: '6px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

            {repartidoresFiltrados.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '50px',
                        color: '#6b7280'
                    }}
                >
                    No se encontraron repartidores.
                </div>
            )}

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

export default Repartidores;