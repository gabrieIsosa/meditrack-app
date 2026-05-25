import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRutas, getClientes } from '../../services/api';
import MapaRuta from '../../components/MapaRuta';
import { iconos, DefaultIcon } from '../../util/Util';
import './Viajes.css';

function Viajes() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [rutas, setRutas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRutas = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const todasLasRutas = await getRutas();
            const misRutas = todasLasRutas.filter(r => r.repartidorId === user.id);
            setRutas(misRutas);
        } catch (error) {
            console.error("Error al cargar rutas", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchRutas();
    }, [user]);

    useEffect(() => {
        getClientes()
            .then(setClientes)
            .catch(err => console.error("Error al cargar clientes B2B", err));
    }, []);

    const rutaActiva = rutas.find(r => r.estado !== 'COMPLETADA');
    
    const paradas = useMemo(() => {
        if (!rutaActiva?.envios) return [];
        return rutaActiva.envios.flatMap(re => {
            if (!re.envio) return [];
            return [
                {
                    id: `${re.envio.id}-RETIRO`,
                    tipo: 'RETIRO',
                    envio: re.envio,
                    direccion: re.envio.origen,
                    contacto: re.envio.remitente,
                    orden: re.retiroOrden ?? re.orden
                },
                {
                    id: `${re.envio.id}-ENTREGA`,
                    tipo: 'ENTREGA',
                    envio: re.envio,
                    direccion: re.envio.destino,
                    contacto: re.envio.destinatario,
                    orden: re.entregaOrden ?? re.orden
                }
            ];
        }).sort((a, b) => a.orden - b.orden);
    }, [rutaActiva]);

    const isParadaCompletada = (p) => {
        const estado = p.envio.estado;
        if (p.tipo === 'RETIRO') {
            return ['EN_TRANSITO', 'EN_PUNTO_DE_ENTREGA', 'ENTREGADO', 'CANCELADO', 'INCIDENTE_REPORTADO'].includes(estado);
        } else {
            return ['ENTREGADO', 'CANCELADO', 'INCIDENTE_REPORTADO'].includes(estado);
        }
    };

    const paradaActual = useMemo(() => {
        return paradas.find(p => !isParadaCompletada(p));
    }, [paradas]);

    if (loading) {
        return (
            <div className="viajes-loading-screen">
                <div className="viajes-loading-spinner" />
                <p className="viajes-loading-text">Cargando ruta activa...</p>
            </div>
        );
    }

    if (!rutaActiva) {
        return (
            <div className="viajes-empty-screen">
                <div className="viajes-empty-card animate-slide-up">
                    <div className="viajes-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3B82F6' }}>
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                    </div>
                    <h2 className="viajes-empty-title">No tienes viajes activos</h2>
                    <p className="viajes-empty-desc">En este momento no tienes una hoja de ruta asignada para realizar envíos.</p>
                    <button 
                        onClick={() => navigate('/inicio-repartidor')} 
                        className="viajes-empty-btn btn-action-hover"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const totalParadas = paradas.length;
    const paradasCompletadas = paradas.filter(isParadaCompletada).length;
    const indexParadaActual = paradaActual ? paradas.indexOf(paradaActual) + 1 : totalParadas;
    const porcentajeCompletado = totalParadas > 0 ? Math.round((paradasCompletadas / totalParadas) * 100) : 0;
    
    const rutaIniciada = paradasCompletadas > 0 || (paradaActual && !['PENDIENTE', 'ASIGNADO'].includes(paradaActual.envio.estado));

    const getClienteIcon = (name = '') => {
        const lower = name.toLowerCase().trim();
        const coincidencia = clientes.find(c => c.nombre && c.nombre.toLowerCase().trim() === lower);
        let tipo = '';
        if (coincidencia) {
            tipo = coincidencia.tipoEstablecimiento;
        }
        
        if (!tipo) {
            if (lower.includes('farmacia') || lower.includes('farma') || lower.includes('apoteca') || lower.includes('botica') || lower.includes('med10') || lower.includes('drogueria') || lower.includes('droguería')) {
                tipo = 'FARMACIA';
            } else if (lower.includes('laboratorio') || lower.includes('lab') || lower.includes('pharma') || lower.includes('quimica') || lower.includes('química')) {
                tipo = 'LABORATORIO';
            } else if (lower.includes('deposito') || lower.includes('depósito') || lower.includes('almacen') || lower.includes('almacén') || lower.includes('distribuidora') || lower.includes('logistica') || lower.includes('logística') || lower.includes('bodega') || lower.includes('depot')) {
                tipo = 'DEPOSITO';
            } else if (lower.includes('clinica') || lower.includes('clínica') || lower.includes('hospital') || lower.includes('sanatorio') || lower.includes('medico') || lower.includes('médico') || lower.includes('salud') || lower.includes('policlinico') || lower.includes('policlínico')) {
                tipo = 'HOSPITAL';
            }
        }

        const IconComponent = iconos[tipo] || DefaultIcon;
        return <IconComponent size={16} style={{ flexShrink: 0 }} />;
    };

    return (
        <div className="viajes-page">
            
            <div className="viajes-content-container">
                <div className="viajes-header animate-fade-in">
                    <button 
                        onClick={() => navigate('/inicio-repartidor')} 
                        className="viajes-header-back-btn btn-action-hover"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div>
                        <h1 className="viajes-header-title">Hoja de Ruta</h1>
                        <span className="viajes-header-subtitle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Asignada: {rutaActiva.fecha}
                        </span>
                    </div>
                </div>
                <div className="viajes-progress-card animate-slide-up">
                    <div className="viajes-progress-header">
                        <div>
                            <span className="viajes-progress-code-label">CÓDIGO DE RUTA</span>
                            <p className="viajes-progress-code-value">{rutaActiva.id}</p>
                        </div>
                        <div className="viajes-progress-right">
                            <span className="viajes-progress-percentage-num">{porcentajeCompletado}%</span>
                            <p className="viajes-progress-percentage-label">Completado</p>
                        </div>
                    </div>

                    <div className="viajes-progress-bar-track">
                        <div 
                            className="viajes-progress-bar-fill" 
                            style={{ width: `${porcentajeCompletado}%` }} 
                        />
                    </div>
                    <span className="viajes-progress-summary">
                        {paradasCompletadas} de {totalParadas} paradas completadas
                    </span>
                </div>
                <div className="viajes-itinerary-card animate-slide-up" style={{ padding: '16px', marginBottom: '20px' }}>
                    <h3 className="viajes-itinerary-title" style={{ marginTop: 0, marginBottom: '12px' }}>RECORRIDO EN MAPA</h3>
                    <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                        <MapaRuta paradas={paradas.map(p => {
                            const lat = p.tipo === 'RETIRO' ? p.envio.latitudOrigen : p.envio.latitudDestino;
                            const lon = p.tipo === 'RETIRO' ? p.envio.longitudOrigen : p.envio.longitudDestino;
                            return {
                                tipo: p.tipo,
                                lat,
                                lon,
                                direccion: p.direccion,
                                envio: p.envio,
                                orden: p.orden
                            };
                        }).filter(p => p.lat != null && p.lon != null)} />
                    </div>
                </div>
                <div className="viajes-itinerary-card animate-slide-up">
                    <h3 className="viajes-itinerary-title">ITINERARIO DE PARADAS</h3>
                    
                    {totalParadas > 1 && (
                        <div className="viajes-itinerary-vertical-line" />
                    )}

                    <div className="viajes-itinerary-list">
                        {paradas.map((p, idx) => {
                            const esCompletado = isParadaCompletada(p);
                            const esSiguiente = paradaActual && paradaActual.id === p.id;
                            
                            let badgeClass = 'badge-default';
                            let badgeText = p.envio.estado.replace(/_/g, ' ');
                            
                            if (p.tipo === 'RETIRO') {
                                if (esCompletado) {
                                    badgeClass = 'badge-entregado';
                                    badgeText = 'Retirado';
                                } else if (p.envio.estado === 'EN_PREPARACION') {
                                    badgeClass = 'badge-en-preparacion';
                                    badgeText = 'Retirando';
                                } else {
                                    badgeClass = 'badge-asignado';
                                    badgeText = 'Pendiente Retiro';
                                }
                            } else {
                                if (esCompletado) {
                                    badgeClass = 'badge-entregado';
                                    badgeText = 'Entregado';
                                } else if (p.envio.estado === 'EN_PUNTO_DE_ENTREGA') {
                                    badgeClass = 'badge-en-destino';
                                    badgeText = 'En Destino';
                                } else if (p.envio.estado === 'EN_TRANSITO') {
                                    badgeClass = 'badge-en-ruta';
                                    badgeText = 'En Ruta';
                                } else if (p.envio.estado === 'EN_PREPARACION') {
                                    badgeClass = 'badge-en-preparacion';
                                    badgeText = 'Preparando';
                                } else if (['PENDIENTE', 'ASIGNADO'].includes(p.envio.estado)) {
                                    badgeClass = 'badge-asignado';
                                    badgeText = 'Pendiente Entrega';
                                } else if (p.envio.estado === 'INCIDENTE_REPORTADO') {
                                    badgeClass = 'badge-incidente';
                                    badgeText = 'Incidente';
                                }
                            }

                            return (
                                <div key={p.id} className="viajes-parada-row">
                                    <div className="viajes-parada-indicator">
                                        {esCompletado ? (
                                            <div className="viajes-node-completed" style={{ backgroundColor: p.tipo === 'RETIRO' ? '#10B981' : '#3B82F6' }}>✓</div>
                                        ) : esSiguiente ? (
                                            <div className="viajes-node-active timeline-node-active-blue" style={{ backgroundColor: p.tipo === 'RETIRO' ? '#10B981' : '#3B82F6', borderColor: p.tipo === 'RETIRO' ? '#10B981' : '#3B82F6', color: 'white' }}>
                                                {idx + 1}
                                            </div>
                                        ) : (
                                            <div className="viajes-node-pending">
                                                {idx + 1}
                                            </div>
                                        )}
                                    </div>

                                    <div 
                                        onClick={() => esSiguiente && navigate('/viajes/detalle')}
                                        className={`viajes-parada-content ${esSiguiente ? 'is-next card-hover' : ''}`}
                                        style={{ 
                                            backgroundColor: p.tipo === 'RETIRO' ? '#F0FDF4' : '#EFF6FF',
                                            borderLeft: p.tipo === 'RETIRO' ? '4px solid #10B981' : '4px solid #3B82F6',
                                            opacity: esCompletado ? 0.7 : 1,
                                            cursor: esSiguiente ? 'pointer' : 'default'
                                        }}
                                    >
                                        <div className="viajes-parada-header">
                                            <h4 className={`viajes-parada-destinatario ${esCompletado ? 'is-completed' : ''}`} style={{ color: p.tipo === 'RETIRO' ? '#065F46' : '#1E40AF', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {getClienteIcon(p.contacto)}
                                                {p.tipo === 'RETIRO' ? `RETIRO: ${p.contacto}` : `ENTREGA: ${p.contacto}`}
                                            </h4>
                                            {esSiguiente && (
                                                <span className="viajes-parada-next-badge" style={{ backgroundColor: p.tipo === 'RETIRO' ? '#10B981' : '#3B82F6' }}>
                                                    SIGUIENTE
                                                </span>
                                            )}
                                        </div>
                                        
                                        <p className="viajes-parada-address" style={{ color: '#4b5563' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                            {p.direccion}
                                        </p>

                                        <span className={`viajes-parada-badge ${badgeClass}`}>
                                            {badgeText}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            
            </div>
            <div className="viajes-footer">
                <div className="viajes-footer-container">
                    <button 
                        onClick={() => navigate('/viajes/detalle')}
                        className={`viajes-footer-btn btn-action-hover ${paradaActual ? 'is-active' : 'is-inactive'}`}
                    >
                        {paradaActual ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                {rutaIniciada ? 'CONTINUAR RUTA' : 'INICIAR RUTA'} (PARADA {indexParadaActual})
                            </>
                        ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                    <line x1="4" y1="22" x2="4" y2="15"></line>
                                </svg>
                                VER RESULTADOS FINALES
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Viajes;