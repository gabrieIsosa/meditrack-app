import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { inactivarMedicamento, getMedicamentos, BASE_URL } from '../../services/api';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px' }) => (
    <div style={{ width, height, borderRadius, backgroundColor: '#E5E7EB', animation: 'pulse 1.5s infinite' }} />
);

function Medicamentos() {
    const [medicamentos, setMedicamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const medicamentosPorPagina = 10;
    const navigate = useNavigate();
    const location = useLocation();
    const hasProcessedSuccess = useRef(false);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

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

    useEffect(() => {
        getMedicamentos()
            .then(data => {
                setMedicamentos(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleInactivar = async (id) => {
        try {
            await inactivarMedicamento(id);
            const data = await getMedicamentos();
            setMedicamentos(data);
        } catch (error) {
            console.error(error);
        }
    };

    const filtrados = medicamentos.filter(m => {
        const term = busqueda.toLowerCase();
        return (
            m.nombre?.toLowerCase().includes(term) ||
            m.monodroga?.toLowerCase().includes(term) ||
            m.laboratorio?.toLowerCase().includes(term)
        );
    });

    const totalPaginas = Math.ceil(filtrados.length / medicamentosPorPagina);
    const indiceUltimo = paginaActual * medicamentosPorPagina;
    const indicePrimero = indiceUltimo - medicamentosPorPagina;
    const medicamentosPagina = filtrados.slice(indicePrimero, indiceUltimo);

    const cambiarPagina = (numero) => {
        if (numero >= 1 && numero <= totalPaginas) {
            setPaginaActual(numero);
        }
    };

    return (
        <div className="container">
            {showSnackbar && (
                <div className={`snackbar-msg ${isEdit ? 'edit' : ''}`}>
                    {isEdit ? '¡Medicamento editado correctamente!' : '¡Medicamento creado correctamente!'}
                </div>
            )}
            <style>{`
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                
                .table-responsive-container {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .medicamentos-mobile-grid {
                    display: none;
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
                    .medicamentos-table-container {
                        display: none !important;
                    }
                    .medicamentos-mobile-grid {
                        display: flex !important;
                        flex-direction: column;
                        gap: 16px;
                    }
                    .med-card {
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
                    .med-card:hover {
                        transform: translateY(-2px);
                        border-color: #10B981;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
                    }
                    .med-card-header {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                        border-bottom: 1px solid #f3f4f6;
                        padding-bottom: 10px;
                    }
                    .med-card-details {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .med-card-detail-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 13px;
                        color: #4b5563;
                    }
                    .med-card-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 4px;
                        padding-top: 8px;
                        border-top: 1px solid #f3f4f6;
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
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de medicamentos</h1>
            </div>

            <div className="card">
                <div className="table-header-actions">
                    <div className="search-container">
                        <Search size={18} className="search-icon" />
                        <input
                            className="search-input-user search-input-with-icon"
                            placeholder="Buscar medicamento, principio activo..."
                            value={busqueda}
                            onChange={e => {
                                setBusqueda(e.target.value);
                                setPaginaActual(1);
                            }}
                        />
                    </div>
                    <button className="btn-new-shipment" onClick={() => navigate('/medicamentos/nuevoMedicamento')}>
                        + NUEVO
                    </button>
                </div>

                <div className="table-responsive-container medicamentos-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Medicamento</th>
                                <th>Laboratorio</th>
                                <th className="mobile-hidden">Presentación</th>
                                <th className="mobile-hidden">Cantidad</th>
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
                                                <Skeleton width="42px" height="42px" borderRadius="10px" />
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <Skeleton width="120px" height="16px" />
                                                    <Skeleton width="80px" height="12px" />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}><Skeleton width="100px" /></td>
                                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton width="90px" /></td>
                                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton width="70px" /></td>
                                        <td className="mobile-hidden" style={{ padding: '15px' }}><Skeleton width="80px" /></td>
                                        <td style={{ padding: '15px' }}><Skeleton width="40px" /></td>
                                    </tr>
                                ))
                            ) : (
                                <>
                                    {medicamentosPagina.map(m => (
                                        <tr key={m.id}
                                            style={{ transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#deffe4'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                        >
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}>
                                                    <img
                                                        src={
                                                            m.imagenUrl
                                                                ? (m.imagenUrl.startsWith('http') 
                                                                    ? m.imagenUrl 
                                                                    : `${BASE_URL}${m.imagenUrl}`)
                                                                : '/placeholder-medicamento.png'
                                                        }
                                                        alt={m.nombre}
                                                        style={{
                                                            width: '42px',
                                                            height: '42px',
                                                            borderRadius: '10px',
                                                            objectFit: 'cover',
                                                            border: '1px solid #E5E7EB',
                                                            background: '#F9FAFB'
                                                        }}
                                                    />
                                                    <div>
                                                        <div style={{
                                                            fontWeight: '700',
                                                            color: '#111827',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            {m.nombre}
                                                            {m.cadenaFrio && (
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    backgroundColor: '#eff6ff',
                                                                    color: '#1d4ed8',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '9999px',
                                                                    fontWeight: '800',
                                                                    border: '1px solid #bfdbfe',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '2px'
                                                                }}>
                                                                    ❄️ Frío
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div style={{
                                                            fontSize: '13px',
                                                            color: '#6B7280',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '2px'
                                                        }}>
                                                            <span>{m.monodroga}</span>
                                                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                                {m.volumenCm3 ?? 0} cm³ · {m.pesoGramos ?? 0} g
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{m.laboratorio}</td>
                                            <td className="mobile-hidden">{m.presentacion}</td>
                                            <td className="mobile-hidden">{m.cantidad} {m.unidadMedida}</td>
                                            <td className="mobile-hidden">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={m.estadoActivo}
                                                            onChange={() => handleInactivar(m.id)}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <span className={`user-status-label ${m.estadoActivo ? 'status-active' : 'status-inactive'}`}>
                                                        {m.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        className="action-icon-btn"
                                                        title="Editar medicamento"
                                                        onClick={() => navigate(`/medicamentos/editar/${m.id}`)}
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
                                            <td colSpan="6" style={{ textAlign: 'center', color: '#6B7280', padding: '30px' }}>
                                                No se encontraron medicamentos.
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="medicamentos-mobile-grid">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="med-card">
                                <div className="med-card-header">
                                    <Skeleton width="42px" height="42px" borderRadius="10px" />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <Skeleton width="120px" height="16px" />
                                        <Skeleton width="80px" height="12px" />
                                    </div>
                                </div>
                                <div className="med-card-details">
                                    <div className="med-card-detail-item">
                                        <Skeleton width="120px" height="14px" />
                                    </div>
                                    <div className="med-card-detail-item">
                                        <Skeleton width="150px" height="14px" />
                                    </div>
                                    <div className="med-card-detail-item">
                                        <Skeleton width="90px" height="14px" />
                                    </div>
                                </div>
                                <div className="med-card-footer">
                                    <Skeleton width="120px" height="24px" />
                                    <Skeleton width="30px" height="30px" borderRadius="50%" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {medicamentosPagina.map(m => (
                                <div key={m.id} className="med-card">
                                    <div className="med-card-header">
                                        <img
                                            src={
                                                m.imagenUrl
                                                    ? (m.imagenUrl.startsWith('http') 
                                                        ? m.imagenUrl 
                                                        : `${BASE_URL}${m.imagenUrl}`)
                                                    : '/placeholder-medicamento.png'
                                            }
                                            alt={m.nombre}
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '10px',
                                                objectFit: 'cover',
                                                border: '1px solid #E5E7EB',
                                                background: '#F9FAFB'
                                            }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                             <div style={{ fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                 {m.nombre}
                                                 {m.cadenaFrio && (
                                                     <span style={{
                                                         fontSize: '10px',
                                                         backgroundColor: '#eff6ff',
                                                         color: '#1d4ed8',
                                                         padding: '1px 5px',
                                                         borderRadius: '9999px',
                                                         fontWeight: '800',
                                                         border: '1px solid #bfdbfe'
                                                     }}>
                                                         ❄️ Frío
                                                     </span>
                                                 )}
                                             </div>
                                             <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                                 {m.monodroga}
                                             </div>
                                         </div>
                                    </div>
                                    <div className="med-card-details">
                                         <div className="med-card-detail-item">
                                             <strong>Laboratorio:</strong> {m.laboratorio}
                                         </div>
                                         <div className="med-card-detail-item">
                                             <strong>Presentación:</strong> {m.presentacion}
                                         </div>
                                         <div className="med-card-detail-item">
                                             <strong>Cantidad:</strong> {m.cantidad} {m.unidadMedida}
                                         </div>
                                         <div className="med-card-detail-item">
                                             <strong>Volumen:</strong> {m.volumenCm3 ?? 0} cm³
                                         </div>
                                         <div className="med-card-detail-item">
                                             <strong>Peso:</strong> {m.pesoGramos ?? 0} g
                                         </div>
                                    </div>
                                    <div className="med-card-footer">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={m.estadoActivo}
                                                    onChange={() => handleInactivar(m.id)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                            <span className={`user-status-label ${m.estadoActivo ? 'status-active' : 'status-inactive'}`}>
                                                {m.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </div>
                                        <button
                                            className="action-icon-btn"
                                            title="Editar medicamento"
                                            onClick={() => navigate(`/medicamentos/editar/${m.id}`)}
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
                                    No se encontraron medicamentos.
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

export default Medicamentos;