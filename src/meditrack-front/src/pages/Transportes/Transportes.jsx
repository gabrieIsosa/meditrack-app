import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransportes, createTransporte, updateTransporte } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search } from 'lucide-react';

const ESTADO_COLORS = {
    ACTIVO: '#10b981',
    INACTIVO: '#6b7280',
    MANTENIMIENTO: '#f59e0b',
};

const ESTADOS = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'];

function Transportes() {
    const [transportes, setTransportes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorModal, setErrorModal] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEditando, setIdEditando] = useState(null);
    const [form, setForm] = useState({
        patente: '',
        tipoVehiculo: '',
        capacidadKg: '',
        capacidadLitros: '',
        capacidadM3: '',
        estadoOperativo: 'ACTIVO',
    });

    const navigate = useNavigate();
    const { user } = useAuth();

    const puedeEditar = user?.role === 'ADMINISTRADOR';

    const cargar = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getTransportes("", "");
            setTransportes(data);
        } catch (e) {
            setError(e.message || 'Error al cargar transportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const transportesFiltrados = useMemo(() => {
        const term = busqueda.toLowerCase().trim();
        return transportes.filter((t) => {
            const cumpleTerm =
                !term ||
                (t.patente || '').toLowerCase().includes(term) ||
                (t.tipoVehiculo || '').toLowerCase().includes(term);

            const cumpleEstado = !filtroEstado || t.estadoOperativo === filtroEstado;
            return cumpleTerm && cumpleEstado;
        });
    }, [transportes, busqueda, filtroEstado]);

    const abrirNuevo = () => {
        setModoEdicion(false);
        setIdEditando(null);
        setForm({
            patente: '',
            tipoVehiculo: '',
            capacidadKg: '',
            capacidadLitros: '',
            capacidadM3: '',
            estadoOperativo: 'ACTIVO',
        });
        setError('');
        setErrorModal('');
        setModalAbierto(true);
    };

    const abrirEditar = (t) => {
        setModoEdicion(true);
        setIdEditando(t.id);
        setForm({
            patente: t.patente || '',
            tipoVehiculo: t.tipoVehiculo || '',
            capacidadKg: String(t.capacidadKg ?? ''),
            capacidadLitros: String(t.capacidadLitros ?? ''),
            capacidadM3: String(t.capacidadM3 ?? ''),
            estadoOperativo: t.estadoOperativo || 'ACTIVO',
        });
        setError('');
        setErrorModal('');
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setModoEdicion(false);
        setIdEditando(null);
        setErrorModal('');
    };

    const validarForm = () => {
        if (!form.patente.trim()) return 'La patente es obligatoria';
        if (!form.tipoVehiculo.trim()) return 'El tipo de vehículo es obligatorio';
        const cap = Number(form.capacidadKg);
        if (!form.capacidadKg || Number.isNaN(cap) || cap <= 0) return 'La capacidad debe ser mayor a 0';
        const vol = Number(form.capacidadLitros);
        if (!form.capacidadLitros || Number.isNaN(vol) || vol <= 0) return 'La capacidad de volumen debe ser mayor a 0';
        const capM3 = Number(form.capacidadM3);
        if (!form.capacidadM3 || Number.isNaN(capM3) || capM3 <= 0) return 'La capacidad del contenedor (m³) debe ser mayor a 0';
        if (!form.estadoOperativo) return 'El estado operativo es obligatorio';
        return '';
    };

    const guardar = async () => {
        const msg = validarForm();
        if (msg) {
            setErrorModal(msg);
            return;
        }

        const payload = {
            patente: form.patente.trim(),
            tipoVehiculo: form.tipoVehiculo.trim(),
            capacidadKg: Number(form.capacidadKg),
            capacidadLitros: Number(form.capacidadLitros),
            capacidadM3: Number(form.capacidadM3),
            estadoOperativo: form.estadoOperativo,
        };

        try {
            setError('');
            if (modoEdicion && idEditando != null) {
                await updateTransporte(idEditando, payload);
            } else {
                await createTransporte(payload);
            }
            cerrarModal();
            await cargar();
        } catch (e) {
            setErrorModal(e.message || 'Error al guardar transporte');
        }
    };

    const toggleActivo = async (t) => {
        if (!puedeEditar) return;
        if (t.estadoOperativo === 'MANTENIMIENTO') return;

        const anterior = t.estadoOperativo;
        const nuevoEstado = anterior === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

        setTransportes(prev =>
            prev.map(x => (x.id === t.id ? { ...x, estadoOperativo: nuevoEstado } : x))
        );

        try {
            setError('');
            await updateTransporte(t.id, {
                patente: t.patente,
                tipoVehiculo: t.tipoVehiculo,
                capacidadKg: t.capacidadKg,
                capacidadLitros: t.capacidadLitros,
                capacidadM3: t.capacidadM3,
                estadoOperativo: nuevoEstado,
            });
        } catch (e) {
            setTransportes(prev =>
                prev.map(x => (x.id === t.id ? { ...x, estadoOperativo: anterior } : x))
            );
            setError(e.message || 'Error al actualizar estado');
        }
    };

    const getEstadoStyle = (estado) => {
        const color = ESTADO_COLORS[estado] || '#6b7280';
        return {
            backgroundColor: `${color}20`,
            color,
        };
    };
    return (
        <div className="container">
            <style>{`
                .col-ocultar { display: table-cell; }
                .col-estado { display: table-cell; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 15px; }
                .modal-content { background: white; border-radius: 8px; width: 100%; max-width: 520px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow-y: auto; max-height: calc(100vh - 30px); }
                .table-responsive-container { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .table-header-actions { display: flex; align-items: center; gap: 12px; width: 100%; box-sizing: border-box; padding: 16px; }
                .search-container { position: relative; flex: 2; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 12px; color: #9ca3af; pointer-events: none; }
                .search-input-with-icon { width: 100%; padding: 10px 12px 10px 36px !important; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
                .search-input-with-icon:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
                .select-estado-responsive { flex: 1; padding: 10px 12px !important; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; background-color: white; cursor: pointer; height: 42px; box-sizing: border-box; }
                .select-estado-responsive:focus { border-color: #2563eb; }
                .btn-nuevo-transporte { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; background-color: var(--primary-emerald, #00A86B); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; transition: background-color 0.2s; white-space: nowrap; height: 42px; box-sizing: border-box; }
                .btn-nuevo-transporte:hover { background-color: #00905c; }
                .skeleton-row { background: #f3f4f6; border-radius: 4px; height: 20px; width: 100%; animation: skeleton-loading 1.5s infinite ease-in-out; }
                @keyframes skeleton-loading {
                    0% { background-color: #f3f4f6; }
                    50% { background-color: #e5e7eb; }
                    100% { background-color: #f3f4f6; }
                }
                .transportes-mobile-grid { display: none; grid-template-columns: 1fr; gap: 16px; padding: 15px; }
                .transport-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: transform 0.2s, border-color 0.2s;
                }
                .transport-card:hover {
                    transform: translateY(-2px);
                    border-color: #2563eb;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
                }
                .transport-card-header {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    border-bottom: 1px solid #f3f4f6;
                    padding-bottom: 10px;
                }
                .transport-card-icon-wrapper {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: #eff6ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #2563eb;
                    flex-shrink: 0;
                }
                .transport-card-title-group {
                    display: flex;
                    flex-direction: column;
                }
                .transport-card-patente {
                    font-weight: 800;
                    font-size: 16px;
                    color: #2563eb;
                }
                .transport-card-tipo {
                    font-size: 12px;
                    color: #6b7280;
                }
                .transport-card-details {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .transport-card-detail-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #4b5563;
                }
                .transport-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 4px;
                    padding-top: 8px;
                    border-top: 1px solid #f3f4f6;
                }
                @media (max-width: 768px) {
                    .col-ocultar { display: none !important; }
                    .col-estado { display: none !important; }
                    .transportes-table-container { display: none !important; }
                    .transportes-mobile-grid { display: grid !important; }
                    .table-header-actions { padding: 12px; gap: 8px; }
                    .search-input-with-icon { padding: 8px 10px 8px 32px !important; font-size: 13px; }
                    .select-estado-responsive { padding: 8px 10px !important; font-size: 13px; height: 38px; }
                    .btn-nuevo-transporte { padding: 8px 12px; font-size: 13px; height: 38px; }
                    .page-header-row h1 { font-size: 18px !important; }
                }
            `}</style>

            <div
                className="page-header-row"
                style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}
            >
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de transportes</h1>
            </div>

            <div className="card">
                <div className="table-header-actions">
                    <div className="search-container">
                        <Search size={18} className="search-icon" />
                        <input
                            className="search-input-with-icon"
                            placeholder="Buscar por patente o tipo..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    <select
                        className="select-estado-responsive"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="">Estados</option>
                        {ESTADOS.map((st) => (
                            <option key={st} value={st}>{st}</option>
                        ))}
                    </select>

                    {puedeEditar && (
                        <button className="btn-nuevo-transporte" onClick={abrirNuevo}>
                            <Plus size={18} />
                            <span>NUEVO</span>
                        </button>
                    )}
                </div>

                {error && (
                    <p style={{ padding: '10px 20px', color: '#ef4444', fontWeight: '700' }}>
                        {error}
                    </p>
                )}

                {loading ? (
                    <div style={{ padding: '20px' }}>
                        <div className="table-responsive-container transportes-table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th>Patente</th>
                                        <th>Tipo</th>
                                        <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (kg)</th>
                                        <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (litros)</th>
                                        <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (m³)</th>
                                        <th className="col-estado">Estado</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(4)].map((_, i) => (
                                        <tr key={i}>
                                            <td><div className="skeleton-row" style={{ width: '80px' }} /></td>
                                            <td><div className="skeleton-row" style={{ width: '100px' }} /></td>
                                            <td className="col-ocultar"><div className="skeleton-row" style={{ width: '50px', margin: '0 auto' }} /></td>
                                            <td className="col-ocultar"><div className="skeleton-row" style={{ width: '50px', margin: '0 auto' }} /></td>
                                            <td className="col-ocultar"><div className="skeleton-row" style={{ width: '50px', margin: '0 auto' }} /></td>
                                            <td className="col-estado"><div className="skeleton-row" style={{ width: '90px' }} /></td>
                                            <td><div className="skeleton-row" style={{ width: '40px', margin: '0 auto' }} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="transportes-mobile-grid" style={{ padding: 0 }}>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="transport-card" style={{ gap: '10px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div className="skeleton-row" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div className="skeleton-row" style={{ width: '40%' }} />
                                            <div className="skeleton-row" style={{ width: '25%' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
                                        <div className="skeleton-row" style={{ width: '60%' }} />
                                        <div className="skeleton-row" style={{ width: '50%' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                                        <div className="skeleton-row" style={{ width: '100px', height: '24px', borderRadius: '999px' }} />
                                        <div className="skeleton-row" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                <>
                    <div className="table-responsive-container transportes-table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Patente</th>
                                    <th>Tipo</th>
                                    <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (kg)</th>
                                    <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (litros)</th>
                                    <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (m³)</th>
                                    <th className="col-estado">Estado</th>
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transportesFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                            No hay transportes registrados
                                        </td>
                                    </tr>
                                ) : (
                                    transportesFiltrados.map((t) => (
                                        <tr key={t.id}>
                                            <td style={{ fontWeight: 'bold', color: '#2563EB' }}>{t.patente}</td>
                                            <td>{t.tipoVehiculo}</td>
                                            <td className="col-ocultar" style={{ textAlign: 'center' }}>{t.capacidadKg}</td>
                                            <td className="col-ocultar" style={{ textAlign: 'center' }}>{t.capacidadLitros}</td>
                                            <td className="col-ocultar" style={{ textAlign: 'center' }}>{t.capacidadM3}</td>
                                            <td className="col-estado">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                                                    className="mt-estado-cell"
                                                >
                                                    <label className="mt-switch" title="Activo / Inactivo">
                                                        <input
                                                            type="checkbox"
                                                            checked={t.estadoOperativo === 'ACTIVO'}
                                                            disabled={!puedeEditar || t.estadoOperativo === 'MANTENIMIENTO'}
                                                            onChange={() => toggleActivo(t)}
                                                        />
                                                        <span className="mt-slider" />
                                                    </label>
                                                    <span className="status-tag" style={getEstadoStyle(t.estadoOperativo)}>
                                                        {t.estadoOperativo}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    {puedeEditar && (
                                                        <button
                                                            className="action-icon-btn"
                                                            title="Editar"
                                                            onClick={() => abrirEditar(t)}
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M12 20h9" />
                                                                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="transportes-mobile-grid">
                        {transportesFiltrados.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
                                No hay transportes registrados
                            </div>
                        ) : (
                            transportesFiltrados.map((t) => (
                                <div key={t.id} className="transport-card">
                                    <div className="transport-card-header">
                                        <div className="transport-card-icon-wrapper">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8" />
                                                <path d="M19 18h2a2 2 0 0 0 2-2v-5l-4-4h-5v11" />
                                                <circle cx="7.5" cy="18.5" r="2.5" />
                                                <circle cx="17.5" cy="18.5" r="2.5" />
                                            </svg>
                                        </div>
                                        <div className="transport-card-title-group">
                                            <span className="transport-card-patente">{t.patente}</span>
                                            <span className="transport-card-tipo">{t.tipoVehiculo}</span>
                                        </div>
                                    </div>
                                    <div className="transport-card-details">
                                        <div className="transport-card-detail-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
                                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                            </svg>
                                            <span><strong>Capacidad Peso:</strong> {t.capacidadKg} kg</span>
                                        </div>
                                        <div className="transport-card-detail-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
                                                <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
                                            </svg>
                                            <span><strong>Capacidad Volumen:</strong> {t.capacidadLitros} L</span>
                                        </div>
                                        <div className="transport-card-detail-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <path d="M9 3v18" />
                                                <path d="M15 3v18" />
                                                <path d="M3 9h18" />
                                                <path d="M3 15h18" />
                                            </svg>
                                            <span><strong>Capacidad Contenedor:</strong> {t.capacidadM3} m³</span>
                                        </div>
                                    </div>
                                    <div className="transport-card-footer">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <label className="mt-switch" title="Activo / Inactivo">
                                                <input
                                                    type="checkbox"
                                                    checked={t.estadoOperativo === 'ACTIVO'}
                                                    disabled={!puedeEditar || t.estadoOperativo === 'MANTENIMIENTO'}
                                                    onChange={() => toggleActivo(t)}
                                                />
                                                <span className="mt-slider" />
                                            </label>
                                            <span className="status-tag" style={getEstadoStyle(t.estadoOperativo)}>
                                                {t.estadoOperativo}
                                            </span>
                                        </div>
                                        {puedeEditar && (
                                            <button
                                                className="action-icon-btn"
                                                title="Editar"
                                                onClick={() => abrirEditar(t)}
                                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
                )}
            </div>
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ marginBottom: '14px' }}>
                            {modoEdicion ? 'Editar transporte' : 'Nuevo transporte'}
                        </h2>

                        <div className="form-group">
                            <label>Patente *</label>
                            {errorModal && (
                                <p style={{ marginBottom: '12px', color: '#ef4444', fontWeight: '700' }}>
                                    {errorModal}
                                </p>
                            )}
                            <input
                                value={form.patente}
                                onChange={(e) => setForm({ ...form, patente: e.target.value })}
                                placeholder="AA123BB"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo de vehículo *</label>
                            <input
                                value={form.tipoVehiculo}
                                onChange={(e) => setForm({ ...form, tipoVehiculo: e.target.value })}
                                placeholder="Camión / Utilitario / Moto"
                            />
                        </div>

                        <div className="form-group">
                            <label>Capacidad (kg) *</label>
                            <input
                                type="number"
                                value={form.capacidadKg}
                                onChange={(e) => setForm({ ...form, capacidadKg: e.target.value })}
                                placeholder="1200"
                            />
                        </div>

                        <div className="form-group">
                            <label>Capacidad (L) *</label>
                            <input
                                type="number"
                                value={form.capacidadLitros}
                                onChange={(e) => setForm({ ...form, capacidadLitros: e.target.value })}
                                placeholder="1200"
                            />
                        </div>

                        <div className="form-group">
                            <label>Capacidad Contenedor (m³) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.capacidadM3}
                                onChange={(e) => setForm({ ...form, capacidadM3: e.target.value })}
                                placeholder="12.5"
                            />
                        </div>

                        <div className="form-group">
                            <label>Estado operativo *</label>
                            <select
                                value={form.estadoOperativo}
                                onChange={(e) => setForm({ ...form, estadoOperativo: e.target.value })}
                            >
                                {ESTADOS.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '18px' }}>
                            <button className="btn btn-primary" onClick={guardar}>
                                GUARDAR
                            </button>
                            <button className="btn btn-secondary" onClick={cerrarModal}>
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

export default Transportes;