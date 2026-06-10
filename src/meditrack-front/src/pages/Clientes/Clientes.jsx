import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cambiarEstadoCliente, getClientes } from '../../services/api';
import { getTipoStyles, iconos, DefaultIcon } from '../../util/Util';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px' }) => (
    <div style={{ width, height, borderRadius, backgroundColor: '#E5E7EB', animation: 'pulse 1.5s infinite' }} />
);

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const clientesPorPagina = 10;
    const navigate = useNavigate();

    useEffect(() => {
        getClientes()
            .then(data => {
                setClientes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleInactivar = async (id) => {
        try {
            await cambiarEstadoCliente(id);
            const data = await getClientes();
            setClientes(data);
        } catch (error) {
            console.error(error);
        }
    };

    const filtrados = clientes.filter(c => {
        const term = busqueda.toLowerCase();
        return (
            c.nombre?.toLowerCase().includes(term) ||
            c.tipoEstablecimiento?.toLowerCase().includes(term) ||
            c.direccion?.toLowerCase().includes(term)
        );
    });

    const totalPaginas = Math.ceil(filtrados.length / clientesPorPagina);
    const indiceUltimo = paginaActual * clientesPorPagina;
    const indicePrimero = indiceUltimo - clientesPorPagina;
    const clientesPagina = filtrados.slice(indicePrimero, indiceUltimo);

    const cambiarPagina = (numero) => {
        if (numero >= 1 && numero <= totalPaginas) {
            setPaginaActual(numero);
        }
    };

    return (
        <div className="container">
            <style>{`
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                
                .clientes-mobile-grid {
                    display: none;
                }

                .table-responsive-container {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .search-container {
                    position: relative;
                    flex: 1;
                }

                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9CA3AF;
                    pointer-events: none;
                }

                .search-input-with-icon {
                    width: 100%;
                    padding-left: 40px !important;
                }

                .pagination-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 24px;
                    padding: 20px;
                    border-top: 1px solid #E5E7EB;
                    user-select: none;
                }

                .pagination-arrow {
                    background: none;
                    border: none;
                    font-size: 24px;
                    font-weight: 300;
                    color: #10B981;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    transition: color 0.2s, transform 0.2s;
                }

                .pagination-arrow:hover:not(:disabled) {
                    transform: scale(1.15);
                }

                .pagination-arrow:disabled {
                    color: #D1D5DB;
                    cursor: not-allowed;
                }

                .pagination-info {
                    font-size: 16px;
                    font-weight: 700;
                    color: #10B981;
                }

                @media (max-width: 768px) {
                    .clientes-table-container {
                        display: none !important;
                    }
                    .clientes-mobile-grid {
                        display: flex !important;
                        flex-direction: column;
                        gap: 16px;
                    }
                    .client-card {
                        background: #ffffff;
                        border: 1px solid #e5e7eb;
                        border-radius: 12px;
                        padding: 16px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        transition: transform 0.2s, border-color 0.2s;
                    }
                    .client-card:hover {
                        transform: translateY(-2px);
                        border-color: #10B981;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
                    }
                    .client-card-header {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                        border-bottom: 1px solid #f3f4f6;
                        padding-bottom: 10px;
                    }
                    .client-card-details {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .client-card-detail-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 8px;
                        font-size: 13px;
                        color: #4b5563;
                    }
                    .client-card-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 4px;
                        padding-top: 8px;
                        border-top: 1px solid #f3f4f6;
                    }
                    .mobile-hidden { 
                        display: none !important; 
                    }
                    .table-header-actions {
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 8px !important;
                        align-items: center !important;
                    }
                    .btn-new-shipment {
                        white-space: nowrap;
                        padding: 10px 12px !important;
                        font-size: 13px !important;
                    }
                }
            `}</style>
            
            <div className="page-header-row">
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de clientes</h1>
            </div>

            <div className="card">
                <div className="table-header-actions">
                    <div className="search-container">
                        <Search size={18} className="search-icon" />
                        <input
                            className="search-input-user search-input-with-icon"
                            placeholder="Buscar por nombre, tipo o dirección..."
                            value={busqueda}
                            onChange={e => {
                                setBusqueda(e.target.value);
                                setPaginaActual(1);
                            }}
                        />
                    </div>
                    <button className="btn-new-shipment" onClick={() => navigate('/clientes/nuevo')}>
                        + NUEVO
                    </button>
                </div>

                <div className="table-responsive-container clientes-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th className="mobile-hidden">Tipo</th>
                                <th className="mobile-hidden">Estado</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Skeleton width="42px" height="42px" borderRadius="50%" />
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <Skeleton width="140px" height="16px" />
                                                    <Skeleton width="200px" height="12px" className="mobile-hidden" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton width="90px" height="24px" borderRadius="999px" /></td>
                                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton width="80px" /></td>
                                        <td style={{ padding: '15px' }}><Skeleton width="40px" /></td>
                                    </tr>
                                ))
                            ) : (
                                <>
                                    {clientesPagina.map(c => (
                                        <tr key={c.id}
                                            style={{ transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        ...getTipoStyles(c.tipoEstablecimiento),
                                                        border: '1px solid #E5E7EB'
                                                    }}>
                                                        {(() => {
                                                            const IconComponent = iconos[c.tipoEstablecimiento] || DefaultIcon;
                                                            return <IconComponent size={20} />;
                                                        })()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#111827' }}>
                                                            {c.nombre}
                                                        </div>
                                                        <div className="mobile-hidden" style={{
                                                            fontSize: '13px',
                                                            color: '#6B7280',
                                                            maxWidth: '320px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {c.direccion}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="mobile-hidden">
                                                <span style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '999px',
                                                    fontWeight: '600',
                                                    fontSize: '12px',
                                                    ...getTipoStyles(c.tipoEstablecimiento)
                                                }}>
                                                    {c.tipoEstablecimiento}
                                                </span>
                                            </td>
                                            <td className="mobile-hidden">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={c.estadoActivo}
                                                            onChange={() => handleInactivar(c.id)}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <span className={`user-status-label ${c.estadoActivo ? 'status-active' : 'status-inactive'}`}>
                                                        {c.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        className="action-icon-btn"
                                                        title="Editar cliente"
                                                        onClick={() => navigate(`/clientes/editar/${c.id}`)}
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtrados.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: '#6B7280', padding: '30px' }}>
                                                No se encontraron clientes.
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="clientes-mobile-grid">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="client-card">
                                <div className="client-card-header">
                                    <Skeleton width="42px" height="42px" borderRadius="50%" />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <Skeleton width="120px" height="16px" />
                                        <Skeleton width="80px" height="12px" />
                                    </div>
                                </div>
                                <div className="client-card-details">
                                    <div className="client-card-detail-item">
                                        <Skeleton width="100%" height="14px" />
                                    </div>
                                </div>
                                <div className="client-card-footer">
                                    <Skeleton width="120px" height="24px" />
                                    <Skeleton width="30px" height="30px" borderRadius="50%" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {clientesPagina.map(c => (
                                <div key={c.id} className="client-card">
                                    <div className="client-card-header">
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            ...getTipoStyles(c.tipoEstablecimiento),
                                            border: '1px solid #E5E7EB',
                                            flexShrink: 0
                                        }}>
                                            {(() => {
                                                const IconComponent = iconos[c.tipoEstablecimiento] || DefaultIcon;
                                                return <IconComponent size={20} />;
                                            })()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.nombre}
                                            </div>
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: '4px',
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                fontWeight: '600',
                                                fontSize: '11px',
                                                ...getTipoStyles(c.tipoEstablecimiento)
                                            }}>
                                                {c.tipoEstablecimiento}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="client-card-details">
                                        <div className="client-card-detail-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            <span style={{ fontSize: '13px', color: '#4B5563', wordBreak: 'break-word' }}>
                                                {c.direccion}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="client-card-footer">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={c.estadoActivo}
                                                    onChange={() => handleInactivar(c.id)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                            <span className={`user-status-label ${c.estadoActivo ? 'status-active' : 'status-inactive'}`}>
                                                {c.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </div>
                                        <button
                                            className="action-icon-btn"
                                            title="Editar cliente"
                                            onClick={() => navigate(`/clientes/editar/${c.id}`)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filtrados.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#6B7280', padding: '30px' }}>
                                    No se encontraron clientes.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!loading && filtrados.length > 0 && (
                    <div className="pagination-container">
                        <button 
                            className="pagination-arrow"
                            onClick={() => cambiarPagina(paginaActual - 1)}
                            disabled={paginaActual === 1}
                        >
                            &larr;
                        </button>
                        <span className="pagination-info">
                            Página {paginaActual} de {totalPaginas || 1}
                        </span>
                        <button 
                            className="pagination-arrow"
                            onClick={() => cambiarPagina(paginaActual + 1)}
                            disabled={paginaActual === totalPaginas}
                        >
                            &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Clientes;