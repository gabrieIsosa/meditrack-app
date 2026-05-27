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
    const [searchExpanded, setSearchExpanded] = useState(false);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEditando, setIdEditando] = useState(null);
    const [form, setForm] = useState({
        patente: '',
        tipoVehiculo: '',
        capacidadKg: '',
        capacidadLitros: '',
        estadoOperativo: 'ACTIVO',
    });

    const navigate = useNavigate();
    const { user } = useAuth();

    const puedeEditar = user?.role === 'ADMINISTRADOR';

    const cargar = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getTransportes(busqueda, filtroEstado);
            setTransportes(data);
        } catch (e) {
            setError(e.message || 'Error al cargar transportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const data = await getTransportes("", "");
                setTransportes(data);
            } catch (e) {
                setError(e.message || 'Error al cargar transportes');
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
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
                .search-wrapper { display: flex; align-items: center; position: relative; }
                .search-input-exp { width: 0px; padding: 0; opacity: 0; transition: all 0.3s ease; border: none; }
                .search-input-exp.expanded { width: 140px; padding: 8px 12px; opacity: 1; border: 1px solid #ccc; border-radius: 4px; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 15px; }
                .modal-content { background: white; border-radius: 8px; width: 100%; max-width: 520px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow-y: auto; max-height: calc(100vh - 30px); }
                .table-responsive-container { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .table-header-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; box-sizing: border-box; }
                .filters-left { display: flex; align-items: center; gap: 6px; flex-grow: 1; }
                .select-estado-responsive { margin: 0; max-width: 150px; }
                .skeleton-row { background: #f3f4f6; border-radius: 4px; height: 20px; width: 100%; animation: skeleton-loading 1.5s infinite ease-in-out; }
                @keyframes skeleton-loading {
                    0% { background-color: #f3f4f6; }
                    50% { background-color: #e5e7eb; }
                    100% { background-color: #f3f4f6; }
                }
                @media (max-width: 768px) {
                    .col-ocultar { display: none !important; }
                    .col-estado { display: none !important; }
                    .table-header-actions { flex-wrap: nowrap; justify-content: space-between; }
                    .search-input-exp.expanded { width: 90px; }
                    .page-header-row h1 { font-size: 18px !important; }
                    .select-estado-responsive { max-width: 95px; font-size: 13px; padding: 4px; }
                    .filters-left button { padding: 6px 10px; font-size: 13px; }
                }
            `}</style>

            <div
                className="page-header-row"
                style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}
            >
                <button className="btn btn-secondary" onClick={() => navigate('/menu')}>VOLVER</button>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de transportes</h1>
            </div>

            <div className="card">
                <div className="table-header-actions" style={{ padding: '10px' }}>
                    <div className="filters-left">
                        <div className="search-wrapper">
                            <button 
                                type="button"
                                onClick={() => setSearchExpanded(!searchExpanded)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Search size={20} />
                            </button>
                            <input
                                className={`search-input-exp ${searchExpanded ? 'expanded' : ''}`}
                                placeholder="Buscar..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>

                        <select
                            className="search-input select-estado-responsive"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Estados</option>
                            {ESTADOS.map((st) => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>

                        <button className="btn btn-secondary" onClick={cargar}>BUSCAR</button>
                    </div>

                    {puedeEditar && (
                        <button className="btn-new-shipment" onClick={abrirNuevo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', minWidth: '40px', height: '40px', border: 'none', cursor: 'pointer' }}>
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                {error && (
                    <p style={{ padding: '10px 20px', color: '#ef4444', fontWeight: '700' }}>
                        {error}
                    </p>
                )}

                <div className="table-responsive-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Patente</th>
                                <th>Tipo</th>
                                <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (kg)</th>
                                <th className="col-ocultar" style={{ textAlign: 'center' }}>Capacidad (litros)</th>
                                <th className="col-estado">Estado</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map((n) => (
                                    <tr key={n}>
                                        <td><div className="skeleton-row" style={{ width: '80px' }}></div></td>
                                        <td><div className="skeleton-row" style={{ width: '100px' }}></div></td>
                                        <td className="col-ocultar"><div className="skeleton-row" style={{ width: '60px', margin: '0 auto' }}></div></td>
                                        <td className="col-ocultar"><div className="skeleton-row" style={{ width: '60px', margin: '0 auto' }}></div></td>
                                        <td className="col-estado"><div className="skeleton-row" style={{ width: '90px' }}></div></td>
                                        <td><div className="skeleton-row" style={{ width: '40px', margin: '0 auto' }}></div></td>
                                    </tr>
                                ))
                            ) : transportesFiltrados.length === 0 ? (
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