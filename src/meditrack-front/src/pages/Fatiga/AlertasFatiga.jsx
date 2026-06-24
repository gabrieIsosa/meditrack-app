import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { getAlertasFatiga, procesarDecisionFatiga } from '../../services/api';

const ESTADO_LABEL = {
    PENDIENTE: 'PENDIENTE',
    BLOQUEADO: 'BLOQUEADO',
    VALIDADO_FALLA: 'FALLA TÉCNICA',
};

const ESTADO_COLORS = {
    PENDIENTE: '#F59E0B',
    BLOQUEADO: '#DC2626',
    VALIDADO_FALLA: '#16A34A',
};

function formatFecha(fechaStr) {
    if (!fechaStr) return '–';
    const d = new Date(fechaStr);
    return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function ModalDecision({ alerta, onClose, onDecidido }) {
    const [decision, setDecision] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!decision) { setError('Seleccioná una decisión.'); return; }
        if (!observaciones.trim()) { setError('Las observaciones son obligatorias.'); return; }
        setCargando(true);
        setError('');
        try {
            await procesarDecisionFatiga(alerta.id, { decision, observaciones });
            onDecidido();
        } catch (e) {
            setError(e.message);
            setCargando(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ padding: '32px', width: '100%', maxWidth: '480px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800', color: '#111827' }}>
                    Resolución sobre alerta de fatiga
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
                    Repartidor: <strong style={{ color: '#111827' }}>{alerta.repartidor?.nombre}</strong>
                    &nbsp;·&nbsp;
                    Detectado: <strong style={{ color: '#111827' }}>{formatFecha(alerta.fechaDeteccion)}</strong>
                </p>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '8px', color: '#374151' }}>
                        Resolución *
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setDecision('BLOQUEADO')}
                            style={{
                                flex: 1, padding: '11px 12px', borderRadius: '10px',
                                border: `2px solid ${decision === 'BLOQUEADO' ? '#EF4444' : '#d1d5db'}`,
                                background: decision === 'BLOQUEADO' ? '#FEF2F2' : '#fff',
                                cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#EF4444'
                            }}
                        >
                            Bloquear
                        </button>
                        <button
                            onClick={() => setDecision('VALIDADO_FALLA')}
                            style={{
                                flex: 1, padding: '11px 12px', borderRadius: '10px',
                                border: `2px solid ${decision === 'VALIDADO_FALLA' ? '#10b981' : '#d1d5db'}`,
                                background: decision === 'VALIDADO_FALLA' ? '#F0FDF4' : '#fff',
                                cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#10b981'
                            }}
                        >
                            Validar falla técnica
                        </button>
                    </div>
                    {decision === 'BLOQUEADO' && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>
                            El repartidor quedará bloqueado 6 horas y recibirá una notificación.
                        </p>
                    )}
                    {decision === 'VALIDADO_FALLA' && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>
                            Se registra como falla técnica. El repartidor podrá reintentar la validación.
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '8px', color: '#374151' }}>
                        Observaciones * <span style={{ fontWeight: '400', color: '#6b7280' }}>(obligatorio)</span>
                    </label>
                    <textarea
                        value={observaciones}
                        onChange={e => setObservaciones(e.target.value)}
                        placeholder="Describí el motivo de tu decisión..."
                        rows={3}
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical',
                            boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827'
                        }}
                    />
                </div>

                {error && (
                    <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={cargando}
                        style={{ flex: 1 }}
                    >
                        CANCELAR
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={cargando || !decision}
                        style={{
                            flex: 1,
                            opacity: cargando || !decision ? 0.5 : 1,
                            cursor: cargando || !decision ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {cargando ? 'REGISTRANDO...' : 'CONFIRMAR'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AlertasFatiga() {
    const navigate = useNavigate();
    const [alertas, setAlertas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('TODOS');
    const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);

    const cargarAlertas = useCallback(async () => {
        try {
            const data = await getAlertasFatiga();
            setAlertas(data);
            setError('');
        } catch (e) {
            setError(e.message || 'Error al cargar alertas');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarAlertas();
        const interval = setInterval(cargarAlertas, 30000);
        return () => clearInterval(interval);
    }, [cargarAlertas]);

    const alertasFiltradas = alertas.filter(a =>
        filtro === 'TODOS' ? true : a.estado === filtro
    );

    const pendienteCount = alertas.filter(a => a.estado === 'PENDIENTE').length;

    return (
        <div className="container">
            <style>{`
                @media (max-width: 768px) {
                    .mobile-hidden { display: none !important; }
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    VOLVER
                </button>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Alertas de fatiga
                </h1>
                {pendienteCount > 0 && (
                    <span style={{
                        backgroundColor: '#FEF3C7', color: '#92400E',
                        borderRadius: '999px', padding: '4px 12px',
                        fontSize: '12px', fontWeight: '700'
                    }}>
                        {pendienteCount} pendiente{pendienteCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['TODOS', 'PENDIENTE', 'BLOQUEADO', 'VALIDADO_FALLA'].map(f => {
                        const label = f === 'TODOS' ? 'TODOS' : ESTADO_LABEL[f];
                        const activo = filtro === f;
                        return (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                style={{
                                    padding: '7px 16px', borderRadius: '999px',
                                    border: `1px solid ${activo ? '#111827' : '#d1d5db'}`,
                                    background: activo ? '#111827' : '#fff',
                                    color: activo ? '#fff' : '#374151',
                                    cursor: 'pointer', fontWeight: '600', fontSize: '12px'
                                }}
                            >
                                {label}{f === 'PENDIENTE' && pendienteCount > 0 ? ` (${pendienteCount})` : ''}
                            </button>
                        );
                    })}
                    <button
                        className="btn btn-secondary"
                        onClick={cargarAlertas}
                        style={{ marginLeft: 'auto', fontSize: '12px', padding: '7px 14px' }}
                    >
                        ACTUALIZAR
                    </button>
                </div>
            </div>

            {error && (
                <div style={{
                    background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px',
                    padding: '14px 16px', color: '#DC2626', marginBottom: '16px', fontSize: '14px'
                }}>
                    {error}
                </div>
            )}

            {cargando ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                    Cargando alertas...
                </div>
            ) : alertasFiltradas.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px', color: '#6b7280',
                    background: '#f9fafb', borderRadius: '16px', border: '1px dashed #e5e7eb'
                }}>
                    {filtro === 'PENDIENTE' ? 'No hay alertas pendientes.' : 'No hay alertas registradas.'}
                </div>
            ) : (
                <div className="table-responsive-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                        <thead>
                            <tr>
                                <th>Repartidor</th>
                                <th className="mobile-hidden">Detectado</th>
                                <th className="mobile-hidden">Estado</th>
                                <th className="mobile-hidden">Supervisor / Observaciones</th>
                                <th style={{ textAlign: 'center' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alertasFiltradas.map(alerta => (
                                <tr key={alerta.id}>
                                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                                        <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                                            {alerta.repartidor?.nombre}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                            DNI: {alerta.repartidor?.dni}
                                        </div>
                                    </td>
                                    <td className="mobile-hidden" style={{ fontSize: '13px' }}>
                                        {formatFecha(alerta.fechaDeteccion)}
                                    </td>
                                    <td className="mobile-hidden">
                                        <span
                                            className="status-tag"
                                            style={{
                                                backgroundColor: `${ESTADO_COLORS[alerta.estado]}15`,
                                                color: ESTADO_COLORS[alerta.estado],
                                            }}
                                        >
                                            {ESTADO_LABEL[alerta.estado]}
                                        </span>
                                    </td>
                                    <td className="mobile-hidden" style={{ maxWidth: '240px' }}>
                                        {alerta.supervisor ? (
                                            <div>
                                                <div style={{ fontSize: '13px', color: '#111827', fontWeight: '600' }}>
                                                    {alerta.supervisor.nombre}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                    {formatFecha(alerta.fechaDecision)}
                                                </div>
                                                {alerta.observaciones && (
                                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontStyle: 'italic' }}>
                                                        "{alerta.observaciones}"
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Sin resolver</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {alerta.estado === 'PENDIENTE' ? (
                                            <button
                                                className="action-icon-btn"
                                                title="Decidir"
                                                onClick={() => setAlertaSeleccionada(alerta)}
                                            >
                                                <CheckCircle size={18} color="#F59E0B" />
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>–</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {alertaSeleccionada && (
                <ModalDecision
                    alerta={alertaSeleccionada}
                    onClose={() => setAlertaSeleccionada(null)}
                    onDecidido={() => {
                        setAlertaSeleccionada(null);
                        cargarAlertas();
                    }}
                />
            )}
        </div>
    );
}

export default AlertasFatiga;
