import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRutas, getClientes, getEnvioById } from '../../services/api';
import MapaRuta from '../../components/MapaRuta';
import OfflineBanner from '../../components/OfflineBanner';
import { iconos, DefaultIcon } from '../../util/Util';
import { ModalValidacionAptitud, PantallaBloqueo } from './ModalValidacionAptitud';
import './Viajes.css';

const obtenerNombreMes = (mesNum) => {
    const meses = {
        '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR',
        '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO',
        '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC'
    };
    return meses[mesNum] || mesNum;
};

const formatearFechaLarga = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    const anio = partes[0];
    const mesNum = partes[1];
    const diaNum = parseInt(partes[2], 10);
    
    const meses = {
        '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril',
        '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto',
        '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre'
    };
    const mesNombre = meses[mesNum] || mesNum;
    return `${diaNum} de ${mesNombre} de ${anio}`;
};


function ModalResumenViaje({ ruta, onClose, clientes }) {
    const paradas = useMemo(() => {
        if (!ruta?.envios) return [];
        return ruta.envios.flatMap(re => {
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
    }, [ruta]);

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
        return <IconComponent size={14} style={{ flexShrink: 0 }} />;
    };

    const resumenCarga = useMemo(() => {
        if (!ruta?.envios) return [];
        const items = [];
        ruta.envios.forEach(re => {
            if (!re.envio) return;
            const envio = re.envio;
            if (envio.detalles && Array.isArray(envio.detalles)) {
                envio.detalles.forEach(item => {
                    items.push({
                        nombre: item.medicamento?.nombre || 'Desconocido',
                        presentacion: item.medicamento?.presentacion || '',
                        lote: item.lote || 'N/A',
                        vencimiento: item.fechaVencimiento || 'N/A',
                        cantidad: Number(item.cantidad || 1),
                        imagenUrl: item.medicamento?.imagenUrl || ''
                    });
                });
            } else {
                let textoOriginal = envio.descripcionCarga || '';
                if (typeof textoOriginal === 'string' && textoOriginal.trim() !== '') {
                    let parteManual = '';
                    let parteMeds = '';
                    if (textoOriginal.includes('| Meds: ')) {
                        const partes = textoOriginal.split('| Meds: ');
                        parteManual = partes[0].trim();
                        parteMeds = partes[1] || '';
                    } else if (textoOriginal.startsWith('Meds: ')) {
                        parteMeds = textoOriginal.replace('Meds: ', '');
                    } else {
                        parteManual = textoOriginal;
                    }

                    if (parteManual.trim()) {
                        const mItems = parteManual.split(', ');
                        mItems.forEach(item => {
                            if (!item.trim()) return;
                            const match = item.match(/^(.*?)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
                            if (match) {
                                items.push({
                                    nombre: match[1],
                                    presentacion: '',
                                    lote: match[2],
                                    vencimiento: match[3],
                                    cantidad: Number(match[4]),
                                    imagenUrl: ''
                                });
                            } else {
                                const matchSimple = item.match(/^(.*?)\sx(\d+)$/);
                                items.push({
                                    nombre: matchSimple ? matchSimple[1] : item,
                                    presentacion: '',
                                    lote: 'N/A',
                                    vencimiento: 'N/A',
                                    cantidad: matchSimple ? Number(matchSimple[2]) : 1,
                                    imagenUrl: ''
                                });
                            }
                        });
                    }

                    if (parteMeds.trim()) {
                        const medItems = parteMeds.split(', ');
                        medItems.forEach(item => {
                            if (!item.trim()) return;
                            const match = item.match(/^(.*?)\s\((.*?)\)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
                            if (match) {
                                items.push({
                                    nombre: match[1],
                                    presentacion: match[2],
                                    lote: match[3],
                                    vencimiento: match[4],
                                    cantidad: Number(match[5]),
                                    imagenUrl: ''
                                });
                            } else {
                                const matchSimple = item.match(/^(.*?)\s\((.*?)\)\sx(\d+)$/);
                                if (matchSimple) {
                                    items.push({
                                        nombre: matchSimple[1],
                                        presentacion: matchSimple[2],
                                        lote: 'N/A',
                                        vencimiento: 'N/A',
                                        cantidad: Number(matchSimple[3]),
                                        imagenUrl: ''
                                    });
                                } else {
                                    const matchVerySimple = item.match(/^(.*?)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
                                    if (matchVerySimple) {
                                        items.push({
                                            nombre: matchVerySimple[1],
                                            presentacion: '',
                                            lote: matchVerySimple[2],
                                            vencimiento: matchVerySimple[3],
                                            cantidad: Number(matchVerySimple[4]),
                                            imagenUrl: ''
                                        });
                                    } else {
                                        items.push({
                                            nombre: item,
                                            presentacion: '',
                                            lote: 'N/A',
                                            vencimiento: 'N/A',
                                            cantidad: 1,
                                            imagenUrl: ''
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            }
        });

        const consolidados = [];
        items.forEach(item => {
            const index = consolidados.findIndex(c => 
                c.nombre === item.nombre && 
                c.presentacion === item.presentacion && 
                c.lote === item.lote && 
                c.vencimiento === item.vencimiento
            );
            if (index > -1) {
                consolidados[index].cantidad += item.cantidad;
            } else {
                consolidados.push({ ...item });
            }
        });
        return consolidados;
    }, [ruta]);

    return (
        <div className="viajes-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="viajes-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="viajes-modal-header">
                    <div>
                        <span className="viajes-modal-subtitle-label">RESUMEN DE PREPARACIÓN</span>
                        <h2 className="viajes-modal-title">Viaje del {formatearFechaLarga(ruta.fecha)}</h2>
                        <span className="viajes-modal-code">{ruta.id}</span>
                    </div>
                    <button className="viajes-modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="viajes-modal-body">
                    <div className="viajes-modal-section">
                        <h4 className="viajes-modal-section-title">ITINERARIO ({paradas.length} Paradas)</h4>
                        <div className="viajes-modal-stops">
                            {paradas.map((p, idx) => (
                                <div key={p.id} className="viajes-modal-stop-item" style={{ borderLeft: p.tipo === 'RETIRO' ? '4px solid #10B981' : '4px solid #3B82F6' }}>
                                    <div className="viajes-modal-stop-num" style={{ backgroundColor: p.tipo === 'RETIRO' ? '#10B981' : '#3B82F6' }}>
                                        {idx + 1}
                                    </div>
                                    <div className="viajes-modal-stop-info">
                                        <span className="viajes-modal-stop-contacto" style={{ color: p.tipo === 'RETIRO' ? '#065F46' : '#1E40AF', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {getClienteIcon(p.contacto)}
                                            {p.tipo === 'RETIRO' ? 'RETIRO' : 'ENTREGA'}: {p.contacto}
                                        </span>
                                        <span className="viajes-modal-stop-address">{p.direccion}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="viajes-modal-section">
                        <h4 className="viajes-modal-section-title">CARGA A TRANSPORTAR ({resumenCarga.length} Medicamentos)</h4>
                        {resumenCarga.length > 0 ? (
                            <div className="viajes-modal-carga-list">
                                {resumenCarga.map((item, idx) => (
                                    <div key={idx} className="viajes-modal-carga-item">
                                        <div className="viajes-modal-carga-img-wrapper">
                                            {item.imagenUrl ? (
                                                <img src={item.imagenUrl.startsWith('http') ? item.imagenUrl : `http://localhost:8080${item.imagenUrl}`} alt={item.nombre} className="viajes-modal-carga-img" />
                                            ) : (
                                                <span className="viajes-modal-carga-fallback">MED</span>
                                            )}
                                        </div>
                                        <div className="viajes-modal-carga-info">
                                            <div className="viajes-modal-carga-header">
                                                <span className="viajes-modal-carga-name">{item.nombre} {item.presentacion && `(${item.presentacion})`}</span>
                                                <span className="viajes-modal-carga-qty">x{item.cantidad}</span>
                                            </div>
                                            <div className="viajes-modal-carga-meta">
                                                <span><strong>Lote:</strong> {item.lote}</span>
                                                <span><strong>Venc:</strong> {item.vencimiento}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="viajes-modal-carga-empty">
                                No se encontraron medicamentos registrados para esta carga.
                            </div>
                        )}
                    </div>
                </div>

                <div className="viajes-modal-footer">
                    <button className="viajes-modal-btn btn-action-hover" onClick={onClose}>Aceptar</button>
                </div>
            </div>
        </div>
    );
}

function Viajes() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [rutas, setRutas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viajePreparar, setViajePreparar] = useState(null);
    const [mostrarValidacionAptitud, setMostrarValidacionAptitud] = useState(false);
    const [viajeBlockeado, setViajeBlockeado] = useState(false);
    const [modoTestMic, setModoTestMic] = useState(false);

    const fetchRutas = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const todasLasRutas = await getRutas();
            const misRutas = todasLasRutas.filter(r => r.repartidorId === user.id);
            setRutas(misRutas);

            // Precarga en segundo plano de detalles de envíos para rutas activas (cacheado offline)
            if (navigator.onLine) {
                const activas = misRutas.filter(r => r.estado !== 'COMPLETADA');
                const enviosIds = activas.flatMap(r => r.envios ? r.envios.map(re => re.envio?.id).filter(Boolean) : []);
                if (enviosIds.length > 0) {
                    console.log(`[Offline Sync] Pre-fetching details for ${enviosIds.length} shipments...`);
                    Promise.all(enviosIds.map(id => 
                        getEnvioById(id).catch(err => console.warn(`Error pre-fetching envio ${id}`, err))
                    ));
                }
            }
        } catch (error) {
            console.error("Error al cargar rutas", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchRutas();

        const handleOnlineReload = () => {
            if (user) fetchRutas(true);
        };
        window.addEventListener('online', handleOnlineReload);
        return () => {
            window.removeEventListener('online', handleOnlineReload);
        };
    }, [user]);

    useEffect(() => {
        getClientes()
            .then(setClientes)
            .catch(err => console.error("Error al cargar clientes B2B", err));
    }, []);

    const hoy = useMemo(() => {
        return new Date().toLocaleDateString('sv-SE'); // Formato YYYY-MM-DD
    }, []);

    const { rutaHoy, viajesFuturos } = useMemo(() => {
        const activas = rutas.filter(r => r.estado !== 'COMPLETADA');
        const hoyRuta = activas.find(r => r.fecha === hoy);
        
        if (hoyRuta) {
            return {
                rutaHoy: hoyRuta,
                viajesFuturos: activas.filter(r => r.id !== hoyRuta.id).sort((a, b) => a.fecha.localeCompare(b.fecha))
            };
        }
        
        // Si no hay ruta para hoy, tomamos la más antigua/cercana que no esté completada
        const principal = [...activas].sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
        
        return {
            rutaHoy: principal || null,
            viajesFuturos: activas.filter(r => r.id !== principal?.id).sort((a, b) => a.fecha.localeCompare(b.fecha))
        };
    }, [rutas, hoy]);
    
    const paradas = useMemo(() => {
        if (!rutaHoy?.envios) return [];
        return rutaHoy.envios.flatMap(re => {
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
    }, [rutaHoy]);

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

    const obtenerParadasDeRuta = (ruta) => {
        if (!ruta?.envios) return [];
        return ruta.envios.flatMap(re => {
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
    };

    if (loading) {
        return (
            <div className="viajes-loading-screen">
                <div className="viajes-loading-spinner" />
                <p className="viajes-loading-text">Cargando agenda de viajes...</p>
            </div>
        );
    }

    return (
        <div className="viajes-page">
            <OfflineBanner />
            <div className="viajes-content-container">
                
                {/* Cabecera Principal */}
                <div className="viajes-header animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            onClick={() => navigate('/inicio-repartidor')} 
                            className="viajes-header-back-btn btn-action-hover"
                            style={{ margin: 0 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <div>
                            <h1 className="viajes-header-title">Mi agenda de viajes</h1>
                            <span className="viajes-header-subtitle">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Planificación y hoja de ruta
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setModoTestMic(true);
                            setMostrarValidacionAptitud(true);
                        }}
                        style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '13px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                        Probar Micrófono (Demo)
                    </button>
                </div>

                {/* Sección de Viaje Principal (de Hoy o más cercano) */}
                <div className="viajes-section-divider">
                    <span className="viajes-section-title">VIAJE ACTIVO / SIGUIENTE</span>
                    <div className="viajes-section-line" />
                </div>

                {rutaHoy ? (
                    <>
                        <div className="viajes-progress-card animate-slide-up">
                            <div className="viajes-progress-header">
                                <div>
                                    <span className="viajes-progress-code-label">CÓDIGO DE RUTA</span>
                                    <p className="viajes-progress-code-value">{rutaHoy.id}</p>
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
                                {paradasCompletadas} de {totalParadas} paradas completadas | Programado: <strong>{formatearFechaLarga(rutaHoy.fecha)}</strong>
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

                        <div className="viajes-itinerary-card animate-slide-up" style={{ marginBottom: '24px' }}>
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
                                            badgeText = 'Pendiente retiro';
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
                                            badgeText = 'Pendiente entrega';
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
                    </>
                ) : (
                    <div className="viajes-today-empty-card animate-slide-up" style={{ marginBottom: '24px' }}>
                        <div className="viajes-today-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9CA3AF' }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <h2 className="viajes-today-empty-title">Sin viajes activos</h2>
                        <p className="viajes-today-empty-desc">No tienes ninguna hoja de ruta activa asignada para el día de hoy.</p>
                    </div>
                )}

                {/* Sección de Viajes Futuros de la Semana */}
                <div className="viajes-section-divider">
                    <span className="viajes-section-title">OTROS VIAJES DE LA SEMANA</span>
                    <div className="viajes-section-line" />
                </div>

                {viajesFuturos.length > 0 ? (
                    <div className="viajes-futuros-grid animate-slide-up">
                        {viajesFuturos.map(ruta => {
                            const paradasDeRuta = obtenerParadasDeRuta(ruta);
                            const enviosCont = ruta.envios ? ruta.envios.length : 0;
                            
                            const partesFecha = ruta.fecha.split('-');
                            const diaNum = partesFecha[2] || '';
                            const mesTexto = partesFecha[1] ? obtenerNombreMes(partesFecha[1]) : '';
                            
                            return (
                                <div key={ruta.id} className="viajes-futuro-card card-hover">
                                    <div className="viajes-futuro-header">
                                        <div className="viajes-calendar-badge">
                                            <span className="viajes-calendar-month">{mesTexto}</span>
                                            <span className="viajes-calendar-day">{diaNum}</span>
                                        </div>
                                        <div className="viajes-futuro-info">
                                            <span className="viajes-futuro-code">{ruta.id}</span>
                                            <span className="viajes-futuro-date">{formatearFechaLarga(ruta.fecha)}</span>
                                            <span className="viajes-parada-badge badge-asignado" style={{ marginTop: '4px' }}>
                                                PENDIENTE
                                            </span>
                                        </div>
                                    </div>
                                    <div className="viajes-futuro-body">
                                        <div className="viajes-futuro-stat">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#2563EB' }}><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                            <strong>{enviosCont}</strong> {enviosCont === 1 ? 'envío' : 'envíos'}
                                        </div>
                                        <div className="viajes-futuro-stat">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10B981' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                            <strong>{paradasDeRuta.length}</strong> paradas
                                        </div>
                                    </div>
                                    <button 
                                        className="viajes-futuro-btn btn-action-hover"
                                        onClick={() => setViajePreparar(ruta)}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        Ver resumen de preparación
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="viajes-futuros-empty card-hover animate-slide-up">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9CA3AF', marginBottom: '8px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 'bold' }}>Sin otros viajes programados para esta semana</p>
                    </div>
                )}
            
            </div>

            {/* Footer flotante con acción principal del viaje activo */}
            {rutaHoy && (
                <div className="viajes-footer">
                    <div className="viajes-footer-container">
                        <button
                            onClick={() => {
                                if (!paradaActual || rutaIniciada) {
                                    navigate('/viajes/detalle');
                                } else {
                                    setMostrarValidacionAptitud(true);
                                }
                            }}
                            disabled={viajeBlockeado}
                            className={`viajes-footer-btn btn-action-hover ${paradaActual && !viajeBlockeado ? 'is-active' : 'is-inactive'}`}
                        >
                            {viajeBlockeado ? (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    RUTA BLOQUEADA
                                </>
                            ) : paradaActual ? (
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
            )}

            {/* Modal de preparación para viajes futuros */}
            {viajePreparar && (
                <ModalResumenViaje
                    ruta={viajePreparar}
                    clientes={clientes}
                    onClose={() => setViajePreparar(null)}
                />
            )}

            {mostrarValidacionAptitud && (
                <ModalValidacionAptitud
                    onAprobado={() => {
                        setMostrarValidacionAptitud(false);
                        if (modoTestMic) {
                            alert('¡Prueba de micrófono exitosa! Tu aptitud ha sido verificada correctamente.');
                            setModoTestMic(false);
                        } else {
                            navigate('/viajes/detalle');
                        }
                    }}
                    onBloqueado={() => {
                        setMostrarValidacionAptitud(false);
                        if (modoTestMic) {
                            alert('Prueba finalizada: Validación de aptitud falló.');
                            setModoTestMic(false);
                        } else {
                            setViajeBlockeado(true);
                        }
                    }}
                    onCancelar={() => {
                        setMostrarValidacionAptitud(false);
                        setModoTestMic(false);
                    }}
                />
            )}

            {viajeBlockeado && (
                <PantallaBloqueo
                    onContactarSupervisor={() => alert('Contactando con supervisor...\n\nUn representante se comunicará contigo a la brevedad para realizar la verificación manual.')}
                />
            )}
        </div>
    );
}

export default Viajes;