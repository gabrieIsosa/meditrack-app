import { useState, useRef, useCallback } from 'react';
import './ModalValidacionAptitud.css';

const MAX_INTENTOS = 2;

export function ModalValidacionAptitud({ onAprobado, onBloqueado, onCancelar }) {
    const [fase, setFase] = useState('idle'); // idle | recording | processing | success | error
    const intentosRef = useRef(MAX_INTENTOS);
    const [intentosRestantes, setIntentosRestantes] = useState(MAX_INTENTOS);
    const grabandoRef = useRef(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [ultimoResultado, setUltimoResultado] = useState(null);
    const horaInicioRef = useRef(0);

    const enviarAudio = useCallback(async (audioBlob) => {
        setFase('processing');
        setUltimoResultado(null);

        try {
            const apiBaseUrl = import.meta.env.VITE_FATIGUE_API_URL || 'https://gabrieisosa-meditrack-fatigue-api.hf.space';
            const formData = new FormData();

            formData.append('file', audioBlob, 'recording.wav');

            const response = await fetch(`${apiBaseUrl}/predict`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Error al procesar el audio en el servidor.');
            }

            const data = await response.json();
            console.log("Respuesta del modelo de IA:", data);
            setUltimoResultado(data);

            const aprobado = data.success && data.riesgo !== 'CRÍTICO';

            if (aprobado) {
                setFase('success');
                setTimeout(() => onAprobado(), 1400);
            } else {
                intentosRef.current -= 1;
                setIntentosRestantes(intentosRef.current);
                setFase('error');
                if (intentosRef.current <= 0) {
                    setTimeout(() => onBloqueado(), 1400);
                }
            }
        } catch (error) {
            console.error('Error al enviar el audio:', error);
            setUltimoResultado({
                nivel_fatiga: 'N/A',
                estado: error.message || 'Error de conexión'
            });
            intentosRef.current -= 1;
            setIntentosRestantes(intentosRef.current);
            setFase('error');
            if (intentosRef.current <= 0) {
                setTimeout(() => onBloqueado(), 1400);
            }
        }
    }, [onAprobado, onBloqueado]);

    const iniciarGrabacion = useCallback(async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (fase === 'processing' || fase === 'success') return;
        if (fase === 'error' && intentosRef.current <= 0) return;

        try {
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            let options = {};
            if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                options = { mimeType: 'audio/ogg' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());

                const duracionMs = Date.now() - horaInicioRef.current;
                if (duracionMs < 1500) {
                    alert('La grabación es muy corta. Por favor, di la frase completa: "Confirmo que me encuentro en condiciones de conducir."');
                    setFase('idle');
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mediaRecorder.mimeType || 'audio/webm'
                });
                await enviarAudio(audioBlob);
            };

            horaInicioRef.current = Date.now();
            grabandoRef.current = true;
            setFase('recording');
            mediaRecorder.start();
        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            alert('No se pudo acceder al micrófono. Por favor, habilitá los permisos del micrófono en tu navegador.');
            setFase('idle');
        }
    }, [fase, enviarAudio]);

    const finalizarGrabacion = useCallback((e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!grabandoRef.current || !mediaRecorderRef.current) return;
        grabandoRef.current = false;

        if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const _puedeReintentar = fase === 'error' && intentosRestantes > 0;
    const bloqueadoFinal = fase === 'error' && intentosRestantes <= 0;

    const getMensaje = () => {
        if (fase === 'idle') return 'Para iniciar la ruta debes superar una verificación de aptitud. Pulsa el botón y di en voz alta: "Confirmo que me encuentro en condiciones de conducir."';
        if (fase === 'recording') return 'Estás siendo grabado. Di claramente: "Confirmo que me encuentro en condiciones de conducir."';
        if (fase === 'processing') return 'Procesando tu grabación, por favor espera...';
        if (fase === 'success') return 'Tu aptitud ha sido verificada correctamente. Puedes iniciar la ruta de forma segura.';

        let detalle = '';
        if (ultimoResultado) {
            if (ultimoResultado.nivel_fatiga === 'N/A') {
                detalle = ` (${ultimoResultado.estado})`;
            } else {
                detalle = ` (Fatiga: ${ultimoResultado.nivel_fatiga}% - ${ultimoResultado.estado})`;
            }
        }

        if (bloqueadoFinal) {
            return `No fue posible verificar tu aptitud en ninguno de los intentos${detalle}.`;
        }
        return `No fue posible verificar tu aptitud${detalle}. Te ${intentosRestantes === 1 ? 'queda 1 intento' : `quedan ${intentosRestantes} intentos`}.`;
    };

    return (
        <div className="val-overlay animate-fade-in">
            <div className="val-modal animate-slide-up" onClick={e => e.stopPropagation()}>

                <div className="val-modal-top" style={{ position: 'relative' }}>
                    {fase !== 'success' && !bloqueadoFinal && (
                        <button 
                            onClick={onCancelar}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '20px',
                                background: 'none',
                                border: 'none',
                                fontSize: '28px',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                lineHeight: 1,
                                padding: '4px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#4B5563'}
                            onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
                        >
                            &times;
                        </button>
                    )}
                    <div className={`val-icon-wrapper val-icon-${fase}`}>
                        {fase === 'success' ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : fase === 'error' ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : fase === 'processing' ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        )}
                    </div>
                    <span className="val-label">VERIFICACIÓN DE APTITUD</span>
                    <h2 className="val-title">
                        {fase === 'success' ? '¡Aptitud Verificada!' :
                            bloqueadoFinal ? 'Validación Fallida' :
                                'Validación de voz'}
                    </h2>
                </div>

                <div className="val-modal-body">
                    <div className={`val-intentos-row${fase === 'success' ? ' val-invisible' : ''}`}>
                        <span className="val-intentos-label">Intentos restantes</span>
                        <div className="val-intentos-dots">
                            {Array.from({ length: MAX_INTENTOS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`val-dot ${i < intentosRestantes ? 'val-dot-active' : 'val-dot-used'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <p className="val-description">{getMensaje()}</p>

                    <div className="val-action-area">
                        {fase !== 'processing' && fase !== 'success' && (
                            <button
                                className={`val-mic-btn ${fase === 'recording' ? 'val-mic-recording' : ''} btn-action-hover`}
                                onClick={fase === 'recording' ? finalizarGrabacion : iniciarGrabacion}
                            >
                                <div className={`val-mic-icon-wrap ${fase === 'recording' ? 'val-mic-pulse' : ''}`}>
                                    {fase === 'recording' ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                            <circle cx="12" cy="12" r="8" />
                                        </svg>
                                    ) : (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                            <line x1="12" y1="19" x2="12" y2="23" />
                                            <line x1="8" y1="23" x2="16" y2="23" />
                                        </svg>
                                    )}
                                </div>
                                {fase === 'recording' ? 'Grabando... Pulsa para analizar' : 'Pulsa para hablar'}
                            </button>
                        )}

                        {fase === 'processing' && (
                            <div className="val-processing">
                                <div className="val-spinner" />
                                <span>Analizando grabación...</span>
                            </div>
                        )}

                        {fase === 'success' && (
                            <div className="val-success-row">
                                <div className="val-success-spinner" />
                                <span>Iniciando viaje...</span>
                            </div>
                        )}
                    </div>
                </div>



                <div className="val-sim-row" style={{
                    padding: '12px 24px',
                    background: '#f3f4f6',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px'
                }}>
                    <button
                        style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', background: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => {
                            setFase('success');
                            setTimeout(() => onAprobado(), 1000);
                        }}
                    >
                        🔧 Simular OK
                    </button>
                    <button
                        style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => {
                            intentosRef.current = 0;
                            setIntentosRestantes(0);
                            setFase('error');
                            setTimeout(() => onBloqueado(), 1000);
                        }}
                    >
                        🔧 Simular Bloqueo
                    </button>
                    <button
                        style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', background: '#6B7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => {
                            intentosRef.current = MAX_INTENTOS;
                            setIntentosRestantes(MAX_INTENTOS);
                            setFase('idle');
                            setUltimoResultado(null);
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PantallaBloqueo({ onContactarSupervisor }) {
    return (
        <div className="val-bloqueo-screen animate-fade-in">
            <div className="val-bloqueo-card animate-slide-up">
                <div className="val-bloqueo-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <span className="val-bloqueo-label">VIAJE BLOQUEADO</span>
                <h2 className="val-bloqueo-title">No fue posible validar tu aptitud para iniciar este viaje.</h2>
                <p className="val-bloqueo-desc">
                    Por motivos de seguridad, el recorrido permanecerá bloqueado hasta que un supervisor realice una verificación manual.
                </p>
                <button
                    className="val-bloqueo-btn btn-action-hover"
                    onClick={onContactarSupervisor}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.41 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17z" />
                    </svg>
                    Contactar supervisor
                </button>
            </div>
        </div>
    );
}
