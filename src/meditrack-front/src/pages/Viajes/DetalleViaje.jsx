import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRutas, updateEstadoEnvio, finalizarRuta, getEnvioById, getMedicamentos, getClientes } from '../../services/api';
import { getTipoStyles, iconos, DefaultIcon } from '../../util/Util';
import OfflineBanner from '../../components/OfflineBanner';
import './DetalleViaje.css';

function DetalleViaje() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [rutas, setRutas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalIncidente, setMostrarModalIncidente] = useState(false);

    const [envioDetalle, setEnvioDetalle] = useState(null);
    const [itemsCarga, setItemsCarga] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [procesando, setProcesando] = useState(false);

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

    const paradaActual = useMemo(() => {
        return paradas.find(p => {
            const estado = p.envio.estado;
            if (p.tipo === 'RETIRO') {
                return ['PENDIENTE', 'ASIGNADO', 'EN_PREPARACION'].includes(estado);
            } else {
                return ['EN_TRANSITO', 'EN_PUNTO_DE_ENTREGA'].includes(estado);
            }
        });
    }, [paradas]);

    useEffect(() => {
        getMedicamentos()
            .then(setCatalogo)
            .catch(err => console.error("Error al cargar medicamentos", err));
    }, []);

    useEffect(() => {
        getClientes()
            .then(setClientes)
            .catch(err => console.error("Error al cargar clientes B2B", err));
    }, []);

    useEffect(() => {
        if (paradaActual?.envio?.id) {
            const esMismoEnvio = envioDetalle && envioDetalle.id === paradaActual.envio.id;
            if (!esMismoEnvio) {
                setCargandoDetalle(true);
            }
            getEnvioById(paradaActual.envio.id)
                .then(data => {
                    setEnvioDetalle(data);

                    if (data.detalles && Array.isArray(data.detalles)) {
                        const itemsMapeados = data.detalles.map((item, index) => ({
                            id: item.id || `det-${index}-${Date.now()}`,
                            nombre: item.medicamento?.nombre || 'Desconocido',
                            presentacion: item.medicamento?.presentacion || '',
                            lote: item.lote || 'N/A',
                            vencimiento: item.fechaVencimiento || 'N/A',
                            cantidad: Number(item.cantidad || 1),
                            imagenUrl: item.medicamento?.imagenUrl || '',
                            esManual: false
                        }));
                        setItemsCarga(itemsMapeados);
                    } else {
                        let textoOriginal = data.descripcionCarga || '';
                        let itemsParseados = [];
                        let parteManual = '';
                        let parteMeds = '';

                        if (typeof textoOriginal === 'string' && textoOriginal.trim() !== '') {
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
                                mItems.forEach((item, index) => {
                                    if (!item.trim()) return;
                                    const match = item.match(/^(.*?)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
                                    if (match) {
                                        itemsParseados.push({
                                            id: `manual-${index}-${Date.now()}`,
                                            nombre: match[1],
                                            presentacion: '',
                                            lote: match[2],
                                            vencimiento: match[3],
                                            cantidad: Number(match[4]),
                                            esManual: true
                                        });
                                    } else {
                                        const matchSimple = item.match(/^(.*?)\sx(\d+)$/);
                                        itemsParseados.push({
                                            id: `manual-${index}-${Date.now()}`,
                                            nombre: matchSimple ? matchSimple[1] : item,
                                            presentacion: '',
                                            lote: 'N/A',
                                            vencimiento: 'N/A',
                                            cantidad: matchSimple ? Number(matchSimple[2]) : 1,
                                            esManual: true
                                        });
                                    }
                                });
                            }

                            if (parteMeds.trim()) {
                                const medItems = parteMeds.split(', ');
                                medItems.forEach((item, index) => {
                                    if (!item.trim()) return;
                                    const match = item.match(/^(.*?)\s\((.*?)\)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
                                    if (match) {
                                        itemsParseados.push({
                                            id: `med-${index}-${Date.now()}`,
                                            nombre: match[1],
                                            presentacion: match[2],
                                            lote: match[3],
                                            vencimiento: match[4],
                                            cantidad: Number(match[5]),
                                            esManual: false
                                        });
                                    } else {
                                        const matchSimple = item.match(/^(.*?)\s\((.*?)\)\sx(\d+)$/);
                                        if (matchSimple) {
                                            itemsParseados.push({
                                                id: `med-${index}-${Date.now()}`,
                                                nombre: matchSimple[1],
                                                presentacion: matchSimple[2],
                                                lote: 'N/A',
                                                vencimiento: 'N/A',
                                                cantidad: Number(matchSimple[3]),
                                                esManual: false
                                            });
                                        } else {
                                            const matchVerySimple = item.match(/^(.*?)\s\[Lote:\s(.*?)\s\/\sVenc:\s(.*?)\]\sx(\d+)$/);
                                            if (matchVerySimple) {
                                                itemsParseados.push({
                                                    id: `med-${index}-${Date.now()}`,
                                                    nombre: matchVerySimple[1],
                                                    presentacion: '',
                                                    lote: matchVerySimple[2],
                                                    vencimiento: matchVerySimple[3],
                                                    cantidad: Number(matchVerySimple[4]),
                                                    esManual: false
                                                });
                                            } else {
                                                itemsParseados.push({
                                                    id: `med-${index}-${Date.now()}`,
                                                    nombre: item,
                                                    presentacion: '',
                                                    lote: 'N/A',
                                                    vencimiento: 'N/A',
                                                    cantidad: 1,
                                                    esManual: false
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        }
                        setItemsCarga(itemsParseados);
                    }
                })
                .catch(err => {
                    console.error("Error al cargar detalles del envío:", err);
                })
                .finally(() => {
                    setCargandoDetalle(false);
                });
        } else {
            setEnvioDetalle(null);
            setItemsCarga([]);
        }
    }, [paradaActual?.envio?.id]);

    const itemsCargaVinculados = useMemo(() => {
        if (catalogo.length === 0 || itemsCarga.length === 0) return itemsCarga;
        return itemsCarga.map(m => {
            if (m.esManual || m.imagenUrl) return m;
            const coincidencia = catalogo.find(c => c.nombre.toLowerCase().trim() === m.nombre.toLowerCase().trim());
            if (coincidencia) {
                return {
                    ...m,
                    imagenUrl: coincidencia.imagenUrl,
                    presentacion: m.presentacion || coincidencia.presentacion
                };
            }
            return m;
        });
    }, [catalogo, itemsCarga]);

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

        const handleOnlineReload = () => {
            if (user) fetchRutas(true);
        };
        window.addEventListener('online', handleOnlineReload);
        return () => {
            window.removeEventListener('online', handleOnlineReload);
        };
    }, [user]);

    const avanzarEstado = async (envioId, estadoActual) => {
        let nuevoEstado = '';
        if (estadoActual === 'ASIGNADO' || estadoActual === 'PENDIENTE') nuevoEstado = 'EN_PREPARACION';
        else if (estadoActual === 'EN_PREPARACION') nuevoEstado = 'EN_TRANSITO';
        else if (estadoActual === 'EN_TRANSITO') nuevoEstado = 'EN_PUNTO_DE_ENTREGA';
        else if (estadoActual === 'EN_PUNTO_DE_ENTREGA') {
            setMostrarModal(true);
            return;
        }

        ejecutarActualizacion(envioId, nuevoEstado);
    };

    const confirmarEntrega = (nombre, dni) => {
        const firmaUsuario = `${user.nombre} (Recibió: ${nombre}, DNI: ${dni})`;
        ejecutarActualizacion(paradaActual.envio.id, 'ENTREGADO', firmaUsuario, nombre, dni);
        setMostrarModal(false);
    };

    const reportarIncidente = () => {
        setMostrarModalIncidente(true);
    };

    const handleConfirmarIncidente = (tipo, descripcion) => {
        ejecutarActualizacion(paradaActual.envio.id, 'INCIDENTE_REPORTADO', user.nombre, null, null, tipo, descripcion);
        setMostrarModalIncidente(false);
    };

    const ejecutarActualizacion = async (envioId, nuevoEstado, customUser = user.nombre, receptorNombre = null, receptorDni = null, tipoIncidencia = null, descripcionIncidencia = null) => {
        if (procesando) return;
        setProcesando(true);

        const rutasPrevias = [...rutas];
        const envioDetallePrevio = envioDetalle;

        const rutasOptimizadas = rutas.map(ruta => {
            if (ruta.id === rutaActiva?.id) {
                return {
                    ...ruta,
                    envios: ruta.envios.map(item => {
                        if (item.envio.id === envioId) {
                            return {
                                ...item,
                                envio: {
                                    ...item.envio,
                                    estado: nuevoEstado,
                                    receptorNombre: receptorNombre || item.envio.receptorNombre,
                                    receptorDni: receptorDni || item.envio.receptorDni
                                }
                            };
                        }
                        return item;
                    })
                };
            }
            return ruta;
        });
        setRutas(rutasOptimizadas);

        if (envioDetalle && envioDetalle.id === envioId) {
            setEnvioDetalle(prev => ({
                ...prev,
                estado: nuevoEstado,
                receptorNombre: receptorNombre || prev.receptorNombre,
                receptorDni: receptorDni || prev.receptorDni
            }));
        }

        try {
            const ahora = new Date();
            const fecha = ahora.toISOString().split('T')[0];
            const hora = ahora.toTimeString().substring(0, 5);

            await updateEstadoEnvio(envioId, nuevoEstado, fecha, hora, customUser, null, tipoIncidencia, descripcionIncidencia, receptorNombre, receptorDni);
            await fetchRutas(true);
        } catch (error) {
            console.error(error);
            setRutas(rutasPrevias);
            setEnvioDetalle(envioDetallePrevio);
            alert("Error al actualizar el estado en el servidor. Inténtalo de nuevo.");
        } finally {
            setProcesando(false);
        }
    };

    const handleFinalizarRuta = async () => {
        if (procesando) return;
        setProcesando(true);
        try {
            await finalizarRuta(rutaActiva.id);
            alert("¡Ruta completada con éxito!");
            navigate('/inicio-repartidor');
        } catch (error) {
            console.error("Error al finalizar ruta:", error);
            alert("Error al finalizar la ruta");
        } finally {
            setProcesando(false);
        }
    };

    const getConfigBoton = (tipo, estado) => {
        if (tipo === 'RETIRO') {
            if (estado === 'ASIGNADO' || estado === 'PENDIENTE') {
                return {
                    texto: 'INICIAR PREPARACIÓN (Ir a origen)',
                    color: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    shadowColor: 'rgba(37, 99, 235, 0.4)'
                };
            }
            if (estado === 'EN_PREPARACION') {
                return {
                    texto: 'INICIAR TRASLADO (Salir a destino)',
                    color: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    shadowColor: 'rgba(124, 58, 237, 0.4)'
                };
            }
        } else {
            if (estado === 'EN_TRANSITO') {
                return {
                    texto: 'LLEGUÉ AL DESTINO',
                    color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    shadowColor: 'rgba(217, 119, 6, 0.4)'
                };
            }
            if (estado === 'EN_PUNTO_DE_ENTREGA') {
                return {
                    texto: 'REGISTRAR ENTREGA',
                    color: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    shadowColor: 'rgba(5, 150, 105, 0.4)'
                };
            }
        }
        return {
            texto: 'AVANZAR PASO',
            color: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            shadowColor: 'rgba(37, 99, 235, 0.4)'
        };
    };

    const getAvatarConfig = (name = '') => {
        const lower = name.toLowerCase().trim();

        const coincidenciaCliente = clientes.find(c => c.nombre && c.nombre.toLowerCase().trim() === lower);
        let tipo = '';
        if (coincidenciaCliente) {
            tipo = coincidenciaCliente.tipoEstablecimiento;
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

        const styles = getTipoStyles(tipo);
        const IconComponent = iconos[tipo] || DefaultIcon;

        let label = 'Cliente';
        if (tipo === 'FARMACIA') label = 'Farmacia';
        else if (tipo === 'LABORATORIO') label = 'Laboratorio';
        else if (tipo === 'DEPOSITO') label = 'Depósito / Almacén';
        else if (tipo === 'HOSPITAL') label = 'Hospital / Clínica';

        if (!tipo) {
            const parts = name.trim().split(/\s+/);
            const firstTwo = parts.length >= 2
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : name.substring(0, 2).toUpperCase();
            return {
                bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                shadow: 'rgba(37, 99, 235, 0.25)',
                color: '#2563EB',
                icon: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{firstTwo || 'B2B'}</span>,
                label: 'Cliente'
            };
        }

        return {
            bg: `linear-gradient(135deg, ${styles.color}15 0%, ${styles.color}35 100%)`,
            shadow: `${styles.color}25`,
            color: styles.color,
            icon: <IconComponent size={24} style={{ color: styles.color }} />,
            label: label
        };
    };

    const getEstadoIndex = (estado) => {
        switch (estado) {
            case 'PENDIENTE':
            case 'ASIGNADO':
                return 0;
            case 'EN_PREPARACION':
                return 1;
            case 'EN_TRANSITO':
                return 2;
            case 'EN_PUNTO_DE_ENTREGA':
                return 3;
            case 'ENTREGADO':
                return 4;
            default:
                return 0;
        }
    };

    const timelineSteps = [
        { key: 'ASIGNADO', label: 'Asignado', color: '#2563EB', activeClass: 'timeline-node-active-blue' },
        { key: 'EN_PREPARACION', label: 'Preparando', color: '#8B5CF6', activeClass: 'timeline-node-active-purple' },
        { key: 'EN_TRANSITO', label: 'En viaje', color: '#F59E0B', activeClass: 'timeline-node-active-amber' },
        { key: 'EN_PUNTO_DE_ENTREGA', label: 'Destino', color: '#10B981', activeClass: 'timeline-node-active-emerald' },
        { key: 'ENTREGADO', label: 'Entregado', color: '#10B981', activeClass: 'timeline-node-active-emerald' }
    ];

    if (loading) {
        return (
            <div className="detalle-loading-screen">
                <div className="detalle-loading-spinner" />
                <p className="detalle-loading-text">Cargando viaje activo...</p>
            </div>
        );
    }

    if (!rutaActiva) {
        return (
            <div className="detalle-empty-screen">
                <div className="detalle-empty-card animate-slide-up">
                    <div className="detalle-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3B82F6' }}>
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                    </div>
                    <h2 className="detalle-empty-title">No tienes viajes activos</h2>
                    <p className="detalle-empty-desc">En este momento no tienes una hoja de ruta asignada para realizar envíos.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="detalle-empty-btn btn-action-hover"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const totalParadas = paradas.length;
    const indexParadaActual = paradaActual ? paradas.indexOf(paradaActual) + 1 : totalParadas;

    const targetEnvio = envioDetalle || paradaActual?.envio;
    const stepIndex = targetEnvio ? getEstadoIndex(targetEnvio.estado) : 4;

    const esFaseOrigen = paradaActual ? paradaActual.tipo === 'RETIRO' : true;
    const nombreEstablecimientoActual = esFaseOrigen
        ? (targetEnvio?.remitente || targetEnvio?.origen || 'Origen Desconocido')
        : (targetEnvio?.destinatario || 'Destinatario Desconocido');

    const avatarConfig = getAvatarConfig(nombreEstablecimientoActual);

    return (
        <div className="detalle-page">
            <OfflineBanner />
            <div className="detalle-content-container">
                <div className="detalle-nav-bar animate-fade-in">
                    <button
                        onClick={() => navigate('/viajes')}
                        className="detalle-nav-back-btn"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Ver resumen
                    </button>
                    <span className="detalle-nav-badge">
                        MODO NAVEGACIÓN
                    </span>
                </div>

                {paradaActual ? (
                    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <div className="detalle-progress-summary-row">
                            <span className="detalle-progress-summary-label">AVANCE</span>
                            <span className="detalle-progress-summary-value">Parada {indexParadaActual} de {totalParadas}</span>
                        </div>

                        <div className="detalle-timeline-card">
                            <div className="detalle-timeline-track">

                                <div className="detalle-timeline-line-bg" />
                                <div
                                    className="detalle-timeline-line-fill"
                                    style={{ width: `${stepIndex * 25}%` }}
                                />

                                {timelineSteps.map((step, idx) => {
                                    const esCompletado = idx < stepIndex;
                                    const esActivo = idx === stepIndex;

                                    let stepIcon = null;
                                    if (idx === 0) {
                                        stepIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
                                    } else if (idx === 1) {
                                        stepIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
                                    } else if (idx === 2) {
                                        stepIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
                                    } else if (idx === 3) {
                                        stepIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
                                    } else if (idx === 4) {
                                        stepIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
                                    }

                                    let circleBg = '#F3F4F6';
                                    let circleColor = '#9CA3AF';
                                    let circleBorder = '3px solid white';
                                    let circleShadow = 'none';

                                    if (esCompletado) {
                                        circleBg = '#E8F5E9';
                                        circleColor = '#10B981';
                                    } else if (esActivo) {
                                        circleBg = step.color;
                                        circleColor = 'white';
                                        circleShadow = `0 0 12px 2px ${step.color}40`;
                                    }

                                    return (
                                        <div key={step.key} className="detalle-timeline-step">
                                            <div
                                                className={`detalle-timeline-circle ${esActivo ? step.activeClass : ''}`}
                                                style={{
                                                    backgroundColor: circleBg,
                                                    color: circleColor,
                                                    border: circleBorder,
                                                    boxShadow: circleShadow
                                                }}
                                            >
                                                {esCompletado ? (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                ) : stepIcon}
                                            </div>
                                            <span
                                                className="detalle-timeline-step-label"
                                                style={{
                                                    fontWeight: esActivo ? '900' : 'bold',
                                                    color: esActivo ? step.color : esCompletado ? '#4B5563' : '#9CA3AF'
                                                }}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="detalle-envio-card">

                            <div className="detalle-establishment-row">
                                <div
                                    className="detalle-avatar"
                                    style={{
                                        background: avatarConfig.bg,
                                        boxShadow: `0 4px 10px ${avatarConfig.shadow}`
                                    }}
                                >
                                    {avatarConfig.icon}
                                </div>
                                <div>
                                    <span className={`detalle-establishment-badge ${esFaseOrigen ? 'origen' : 'destino'}`}>
                                        {esFaseOrigen ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="16"></line><line x1="15" y1="22" x2="15" y2="16"></line><line x1="9" y1="16" x2="15" y2="16"></line><path d="M9 6h6M9 10h6"></path></svg>
                                                ORIGEN ({avatarConfig.label})
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                DESTINO ({avatarConfig.label})
                                            </span>
                                        )}
                                    </span>
                                    <h2 className="detalle-establishment-name">
                                        {nombreEstablecimientoActual}
                                    </h2>
                                </div>
                            </div>

                            <div className="detalle-gps-layout">
                                <div className="detalle-gps-line-container">
                                    <div
                                        className="detalle-gps-dot-origen"
                                        style={{
                                            transform: esFaseOrigen ? 'scale(1.25)' : 'none',
                                            backgroundColor: esFaseOrigen ? '#3B82F6' : '#D1D5DB',
                                            boxShadow: esFaseOrigen ? '0 0 10px #3B82F6' : 'none',
                                            transition: 'all 0.3s'
                                        }}
                                    />
                                    <div className="detalle-gps-line" />
                                    <div
                                        className="detalle-gps-marker-destino"
                                        style={{
                                            transform: !esFaseOrigen ? 'scale(1.25)' : 'none',
                                            color: !esFaseOrigen ? '#10B981' : '#9CA3AF',
                                            filter: !esFaseOrigen ? 'drop-shadow(0 0 6px #10B981)' : 'none',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                </div>

                                <div className="detalle-gps-addresses-column">
                                    <div
                                        className="detalle-gps-address-card-origen"
                                        style={{
                                            opacity: esFaseOrigen ? 1 : 0.5,
                                            border: esFaseOrigen ? '2px solid #3B82F6' : '1px dashed #E5E7EB',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            backgroundColor: esFaseOrigen ? '#EFF6FF' : '#F9FAFB',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <span className="detalle-gps-label-origen" style={{ color: esFaseOrigen ? '#1E40AF' : '#6B7280', fontWeight: esFaseOrigen ? '800' : 'bold' }}>RECOGER EN ORIGEN</span>
                                        <p className="detalle-gps-text-origen" style={{ color: esFaseOrigen ? '#1E293B' : '#64748B', margin: '4px 0 0 0' }}>
                                            {cargandoDetalle ? 'Cargando origen...' : (targetEnvio?.origen || 'No especificado')}
                                        </p>
                                    </div>
                                    <div
                                        className="detalle-gps-address-card-destino"
                                        style={{
                                            opacity: !esFaseOrigen ? 1 : 0.5,
                                            border: !esFaseOrigen ? '2px solid #10B981' : '1px dashed #E5E7EB',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            backgroundColor: !esFaseOrigen ? '#F0FDF4' : '#F9FAFB',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <span className="detalle-gps-label-destino" style={{ color: !esFaseOrigen ? '#065F46' : '#6B7280', fontWeight: !esFaseOrigen ? '800' : 'bold' }}>ENTREGAR EN DESTINO</span>
                                        <p className="detalle-gps-text-destino" style={{ color: !esFaseOrigen ? '#1E293B' : '#64748B', margin: '4px 0 0 0' }}>
                                            {cargandoDetalle ? 'Cargando destino...' : (targetEnvio?.destino || targetEnvio?.direccionEntrega || 'No especificado')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {targetEnvio?.observaciones && (
                                <div className="detalle-observaciones-card">
                                    <div className="detalle-observaciones-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                    </div>
                                    <div className="detalle-observaciones-text">
                                        <strong>Nota del envío:</strong> {targetEnvio.observaciones}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="detalle-carga-card animate-slide-up">
                            <div className="detalle-carga-title-row">
                                <div className="detalle-carga-title-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                </div>
                                <h3 className="detalle-carga-title">Resumen de la carga</h3>
                            </div>

                            {cargandoDetalle ? (
                                <div className="detalle-carga-spinner-container">
                                    <div className="detalle-carga-spinner" />
                                </div>
                            ) : itemsCargaVinculados.length > 0 ? (
                                <div className="detalle-carga-list">
                                    {itemsCargaVinculados.map((item) => (
                                        <div key={item.id} className="detalle-carga-item card-hover">
                                            <div className="detalle-carga-img-wrapper">
                                                {item.imagenUrl ? (
                                                    <img src={item.imagenUrl.startsWith('http') ? item.imagenUrl : `http://localhost:8080${item.imagenUrl}`} alt={item.nombre} className="detalle-carga-img" />
                                                ) : (
                                                    <span className="detalle-carga-img-fallback-text">
                                                        {item.esManual ? 'MAN' : 'MED'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="detalle-carga-info">
                                                <div className="detalle-carga-item-header">
                                                    <span className="detalle-carga-item-name">
                                                        {item.nombre} {item.presentacion ? `(${item.presentacion})` : ''}
                                                    </span>
                                                    <span className="detalle-carga-item-qty">
                                                        x{item.cantidad}
                                                    </span>
                                                </div>
                                                <div className="detalle-carga-metadata-row">
                                                    <span className="detalle-carga-metadata">
                                                        <strong>Lote:</strong> {item.lote}
                                                    </span>
                                                    <span className="detalle-carga-metadata">
                                                        <strong>Vencimiento:</strong> {item.vencimiento}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="detalle-carga-empty-box">
                                    {targetEnvio?.descripcionCarga || 'No hay detalles de medicamentos registrados.'}
                                </div>
                            )}
                        </div>
                        <div className="detalle-actions-container">
                            <button
                                onClick={() => avanzarEstado(paradaActual.envio.id, paradaActual.envio.estado)}
                                disabled={procesando}
                                className={`detalle-btn-giant ${procesando ? "" : "btn-action-hover"}`}
                                style={{
                                    background: procesando ? '#9CA3AF' : (getConfigBoton(paradaActual.tipo, paradaActual.envio.estado)?.color || 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'),
                                    boxShadow: procesando ? 'none' : `0 8px 24px -4px ${getConfigBoton(paradaActual.tipo, paradaActual.envio.estado)?.shadowColor || 'rgba(37,99,235,0.3)'}`,
                                    cursor: procesando ? 'not-allowed' : 'pointer',
                                    opacity: procesando ? 0.8 : 1
                                }}
                            >
                                {procesando ? (
                                    <div className="detalle-btn-giant-spinner" />
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                )}
                                {procesando ? 'CARGANDO...' : getConfigBoton(paradaActual.tipo, paradaActual.envio.estado)?.texto}
                            </button>
                            {(paradaActual.envio.estado !== 'ASIGNADO' && paradaActual.envio.estado !== 'PENDIENTE') && (
                                <button
                                    onClick={reportarIncidente}
                                    disabled={procesando}
                                    className={`detalle-btn-incidente ${procesando ? "" : "btn-sec-hover"}`}
                                    style={{
                                        cursor: procesando ? 'not-allowed' : 'pointer',
                                        opacity: procesando ? 0.4 : 1
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                    REPORTAR INCIDENTE
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="detalle-fin-jornada-card animate-slide-up">
                        <div className="detalle-fin-jornada-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                <line x1="4" y1="22" x2="4" y2="15"></line>
                            </svg>
                        </div>
                        <h2 className="detalle-fin-jornada-title">¡Todas las paradas completadas!</h2>
                        <p className="detalle-fin-jornada-desc">Has completado todas las entregas asignadas para esta hoja de ruta con éxito. ¡Buen trabajo!</p>

                        <button
                            onClick={handleFinalizarRuta}
                            disabled={procesando}
                            className={`detalle-fin-jornada-btn ${procesando ? "" : "btn-action-hover"}`}
                            style={{
                                background: procesando ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                cursor: procesando ? 'not-allowed' : 'pointer',
                                opacity: procesando ? 0.8 : 1
                            }}
                        >
                            {procesando ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div className="detalle-btn-giant-spinner" />
                                    <span>CERRANDO RUTA...</span>
                                </div>
                            ) : 'FINALIZAR JORNADA (CERRAR RUTA)'}
                        </button>
                    </div>
                )}
                <ModalRecepcion
                    isOpen={mostrarModal}
                    onClose={() => setMostrarModal(false)}
                    onConfirm={confirmarEntrega}
                />

                <ModalIncidente
                    isOpen={mostrarModalIncidente}
                    onClose={() => setMostrarModalIncidente(false)}
                    onConfirm={handleConfirmarIncidente}
                />
            </div>
        </div>
    );
}

function ModalRecepcion({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in">
            <ModalRecepcionForm onClose={onClose} onConfirm={onConfirm} />
        </div>
    );
}

function ModalRecepcionForm({ onClose, onConfirm }) {
    const [nombre, setNombre] = useState('');
    const [dni, setDni] = useState('');

    const handleSubmit = () => {
        if (!nombre || !dni) {
            alert("Por favor, completa el nombre y DNI de quien recibe.");
            return;
        }
        onConfirm(nombre, dni);
        setNombre('');
        setDni('');
    };

    return (
        <div className="modal-sheet-container modal-sheet">
            <div className="modal-drag-indicator" />

            <div className="modal-header">
                <div className="modal-header-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 className="modal-title">Registrar Recepción</h3>
            </div>
            <p className="modal-subtitle">Por favor, solicita la firma ingresando los datos de la persona que recibe el paquete.</p>

            <div className="modal-form-fields">
                <div className="modal-field-container">
                    <label className="modal-label">Nombre Completo de quien recibe</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="modal-input"
                        placeholder="Ej. María López"
                    />
                </div>

                <div className="modal-field-container">
                    <label className="modal-label">Número de DNI</label>
                    <input
                        type="number"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        className="modal-input"
                        placeholder="Sin puntos"
                    />
                </div>
            </div>

            <div className="modal-actions">
                <button
                    onClick={onClose}
                    className="modal-btn-cancelar btn-action-hover"
                >
                    CANCELAR
                </button>
                <button
                    onClick={handleSubmit}
                    className="modal-btn-confirmar btn-action-hover"
                >
                    CONFIRMAR ENTREGA
                </button>
            </div>
        </div>
    );
}

function ModalIncidente({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in">
            <ModalIncidenteForm onClose={onClose} onConfirm={onConfirm} />
        </div>
    );
}

function ModalIncidenteForm({ onClose, onConfirm }) {
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const handleSubmit = () => {
        if (!tipo) {
            alert("Por favor, selecciona un tipo de incidencia.");
            return;
        }
        onConfirm(tipo, descripcion);
        setTipo('');
        setDescripcion('');
    };

    return (
        <div className="modal-sheet-container modal-sheet">
            <div className="modal-drag-indicator" />

            <div className="modal-header">
                <div className="modal-header-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h3 className="modal-title" style={{ color: '#92400E' }}>Reportar Incidente</h3>
            </div>
            <p className="modal-subtitle">Por favor, selecciona la categoría de la incidencia y detalla lo ocurrido.</p>

            <div className="modal-form-fields">
                <div className="modal-field-container">
                    <label className="modal-label">Tipo de Incidencia *</label>
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="modal-input"
                        style={{ width: '100%', height: '46px', padding: '0 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '15px' }}
                    >
                        <option value="">-- Selecciona el tipo --</option>
                        <option value="FALLA_MECANICA">Falla Mecánica</option>
                        <option value="ACCIDENTE_VIAL">Accidente Vial</option>
                        <option value="ROBO_O_PERDIDA">Robo o Pérdida</option>
                        <option value="ZONA_INACCESIBLE">Zona Inaccesible o Bloqueo</option>
                        <option value="CLIENTE_AUSENTE">Cliente Ausente</option>
                        <option value="OTRO">Otro Imprevisto</option>
                    </select>
                </div>

                <div className="modal-field-container">
                    <label className="modal-label">Detalles del Incidente</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        className="modal-input"
                        placeholder="Detalles sobre lo sucedido (opcional)..."
                        style={{ height: '90px', padding: '10px 12px', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }}
                    />
                </div>
            </div>

            <div className="modal-actions">
                <button
                    onClick={onClose}
                    className="modal-btn-cancelar btn-action-hover"
                >
                    CANCELAR
                </button>
                <button
                    onClick={handleSubmit}
                    className="modal-btn-confirmar btn-action-hover"
                    style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)' }}
                >
                    ENVIAR REPORTE
                </button>
            </div>
        </div>
    );
}

export default DetalleViaje;
