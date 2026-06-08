import { useState } from "react";
import { getTrackingPublico } from "../../services/api";
import Navbar from '../../components/Navbar';
import bg from '../../assets/bg.png';
import { Search } from 'lucide-react';
import LegalModal from "../../components/LegalModal";

const PASOS =[
    {key: 'PENDIENTE', label: 'PENDIENTE'},
    {key: 'ASIGNADO', label: 'ASIGNADO'},
    {key: 'EN_PREPARACION', label: 'EN PREPARACION'},
    {key: 'EN_TRANSITO', label: 'EN TRANSITO'},
    {key: 'EN_PUNTO_DE_ENTREGA', label: 'EN PUNTO DE ENTREGA'},
    {key: 'ENTREGADO', label: 'ENTREGADO'},
    {key: 'CANCELADO', label: 'CANCELADO'},
];

function formaUltimaActualizacion(fecha, hora){
    if(!fecha && !hora) return '';
    const [y, m, d] = (fecha || '').split('-');
    const fechaFormateada = y && m && d ? `${d}/${m}/${y}` : (fecha || '');
    return `${fechaFormateada} ${hora ? `${hora}` : ''}`.trim();
}

export default function TrackingPublico() {
    const [trackingId, setTrackingId] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    
    // Modal states for terms, privacy policy, and contact form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('terms');

    const idxActual = resultado
    ? PASOS.findIndex(p => p.key === resultado.estado)
    : -1;

    const pasosFiltrados = resultado?.estado === 'CANCELADO'
        ? PASOS.filter(p => p.key !== 'ENTREGADO')
        : PASOS.filter(p => p.key !== 'CANCELADO');

    async function consultar(e) {
        e.preventDefault();
        setError('');
        setResultado(null);

        const id = trackingId.trim();
        if (!id) {
            setError('Ingrese un Tracking ID');
            return;
        }

        setCargando(true);
        try {
            const data = await getTrackingPublico(id);
            setResultado(data);
        } catch (err) {
            setError(err?.message || 'Error al consultar tracking');
        } finally {
            setCargando(false);
        }
    }
        return(
            <div style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '100vh',
                width: '100vw',
                overflowX: 'hidden',
                overflowY: 'auto',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column'
            }}>
            <Navbar/>

            <div style={{
                flex: '1 0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px 0'
            }}>
                <div style={{
                    maxWidth: 820, 
                    margin: '0 auto', 
                    width: 'calc(100% - 32px)',
                    padding: '32px 24px', 
                    color: '#111827',
                    background: '#ffffff',
                    borderRadius: 16,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    boxSizing: 'border-box'
                }}>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: '0 0 8px 0' }}>Seguimiento público</h1>
                    <p style={{ margin: '0 0 16px 0', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Ingresá tu Tracking ID para consultar el estado de tu envío.</p>

                    <form onSubmit={consultar} style={{
                        display: 'flex', 
                        alignItems: 'center',
                        position: 'relative',
                        marginTop: 12,
                        width: '100%'
                    }}>
                        <input
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            placeholder="Ej: A1B2C3D4"
                            style={{
                                width: '100%', 
                                padding: '12px 50px 12px 14px', 
                                boxSizing: 'border-box',
                                borderRadius: 8,
                                border: '1px solid #D1D5DB',
                                fontSize: 16,
                                outline: 'none'
                            }}
                        />
                        <button type="submit"
                                disabled={cargando}
                                style={{
                                    position: 'absolute',
                                    right: 6,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: cargando ? '#059669' : '#00A86B',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: cargando ? 'not-allowed' : 'pointer',
                                    borderRadius: 6,
                                    width: 36,
                                    height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: "filter 0.15s ease, background 0.15s ease",
                                    filter: cargando ? 'brightness(0.95)' : 'none',
                                }}
                                    onMouseEnter={(e) => {
                                        if(!cargando) e.currentTarget.style.filter = 'brightness(0.92)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.filter = cargando ? 'brightness(0.95)' : 'none';
                                    }}
                                    >
                            {cargando ? (
                                <svg 
                                    width="18" 
                                    height="18" 
                                    viewBox="0 0 24 24" 
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{
                                        animation: 'spin 1s linear infinite',
                                    }}
                                >
                                    <style>{`
                                        @keyframes spin {
                                            0% { transform: rotate(0deg); }
                                            100% { transform: rotate(360deg); }
                                        }
                                    `}</style>
                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
                                    <path d="M4 12a8 8 0 018-8V4a10 10 0 00-10 10h2z" fill="#fff" />
                                </svg>
                            ) : (
                                <Search size={18} />
                            )}
                        </button>
                    </form>
                {error && (
                    <div style={{marginTop: 16, color: '#DC2626'}}>
                        {error}
                    </div>
                )}

                {resultado && (
                    <div style={{ marginTop: 32 }}>
                        <h2 style={{ marginBottom: 24, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>
                            Estado actual: {resultado.estado?.replaceAll('_', ' ')}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
                                {pasosFiltrados.map((p, i) => {
                                    const idxEnOriginal = PASOS.findIndex(orig => orig.key === p.key);
                                    const completado = idxActual !== -1 && idxEnOriginal <= idxActual;
                                    const actual = idxActual !== -1 && idxEnOriginal === idxActual;

                                    const borderCircleColor = actual || completado ? '#00A86B' : '#9CA3AF';
                                    const bgCircleColor = actual ? '#00A86B' : '#ffffff';
                                    const lineBg = completado && idxActual > idxEnOriginal ? '#00A86B' : '#F3F4F6';
                                
                                return(
                                    <div key={p.key} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            gap: 16,
                                            flexWrap: 'wrap'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    border: `3px solid ${borderCircleColor}`,
                                                    background: bgCircleColor,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    boxSizing: 'border-box'
                                                }}
                                                title={p.label}
                                                />

                                                <div style={{ fontSize: 14, fontWeight: actual ? 700 : 500, color: actual ? '#00A86B' : '#111827' }}>
                                                    {p.label}
                                                </div>
                                            </div>

                                            {actual && (
                                                <div style={{ 
                                                    fontSize: 14, 
                                                    color: '#00A86B', 
                                                    fontWeight: 700,
                                                    marginLeft: 'auto',
                                                    paddingLeft: 40
                                                }}>
                                                    {formaUltimaActualizacion(resultado.fechaUltimoEstado, resultado.horaUltimoEstado)}
                                                </div>
                                            )}
                                        </div>

                                        {i < pasosFiltrados.length - 1 && (
                                            <div style={{
                                                width: 2, 
                                                height: 32, 
                                                background: lineBg,
                                                marginLeft: 11,
                                                marginTop: 4,
                                                marginBottom: 4
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                </div>
            </div>

            <footer style={{
                flexShrink: 0,
                width: '100%',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                padding: '24px 16px',
                boxSizing: 'border-box',
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
            }}>
                <div style={{
                    display: 'flex',
                    gap: 24,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 500
                }}>
                    <span 
                        onClick={() => { setModalType('terms'); setIsModalOpen(true); }}
                        style={{ color: '#4B5563', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#00A86B'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}
                    >
                        Términos y Condiciones
                    </span>
                    <span 
                        onClick={() => { setModalType('privacy'); setIsModalOpen(true); }}
                        style={{ color: '#4B5563', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#00A86B'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}
                    >
                        Políticas de Privacidad
                    </span>
                    <span 
                        onClick={() => { setModalType('contact'); setIsModalOpen(true); }}
                        style={{ color: '#4B5563', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#00A86B'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}
                    >
                        Contacto
                    </span>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                    © {new Date().getFullYear()} MediTrack. Todos los derechos reservados.
                </div>
            </footer>

            <LegalModal 
                isOpen={isModalOpen}
                type={modalType}
                onClose={() => setIsModalOpen(false)}
            />
            </div>
        );

    }