import React from 'react';

const DetalleMail = ({ mail, onClose }) => {
    if (!mail) return null;

    const isMobile = window.innerWidth < 768;

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'Enviado':
                return { bg: '#dcfce7', text: '#166534' };
            case 'Pendiente':
                return { bg: '#fef3c7', text: '#92400e' };
            case 'Error':
                return { bg: '#fee2e2', text: '#991b1b' };
            default:
                return { bg: '#dbeafe', text: '#1d4ed8' };
        }
    };

    const colores = obtenerColorEstado(mail.estado);

    return (
        <div className="dm-overlay" onClick={onClose}>
            <style>{`
                .dm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: ${isMobile ? 'flex-end' : 'center'};
                    justify-content: center;
                    z-index: 9999;
                    padding: ${isMobile ? '0' : '20px'};
                    animation: dmFadeIn 0.2s ease-out;
                }
                .dm-modal {
                    width: ${isMobile ? '100%' : '650px'};
                    max-width: 100%;
                    height: ${isMobile ? '85vh' : 'auto'};
                    max-height: 85vh;
                    background: #ffffff;
                    border-radius: ${isMobile ? '24px 24px 0 0' : '20px'};
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: dmSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .dm-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    background-color: #ffffff;
                    z-index: 10;
                }
                .dm-title-container {
                    flex: 1;
                    min-width: 0;
                }
                .dm-title-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 4px;
                    flex-wrap: wrap;
                }
                .dm-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                    color: #0f172a;
                    word-break: break-word;
                    line-height: 1.3;
                }
                .dm-status-badge {
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 800;
                    background-color: ${colores.bg};
                    color: ${colores.text};
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                    display: inline-block;
                }
                .dm-subtitle {
                    margin: 0;
                    color: #64748b;
                    font-size: 12.5px;
                }
                .dm-close-btn {
                    border: none;
                    background: #f1f5f9;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 800;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                }
                .dm-close-btn:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }
                .dm-body {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .dm-meta-grid {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 16px 20px;
                    display: grid;
                    grid-template-columns: ${isMobile ? '1fr' : '1fr 1fr'};
                    gap: 14px 20px;
                }
                .dm-content-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .dm-content-label {
                    font-size: 11px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .dm-content-box {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 20px;
                    line-height: 1.7;
                    font-size: 14px;
                    color: #334155;
                    white-space: pre-wrap;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
                }
                .dm-attachment-box {
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    color: #1d4ed8;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-weight: 700;
                    font-size: 13.5px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    word-break: break-all;
                }
                @keyframes dmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes dmSlideUp {
                    from { transform: translateY(${isMobile ? '100%' : '20px'}); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @media (max-width: 768px) {
                    .dm-body {
                        padding-bottom: 50px;
                    }
                }
            `}</style>
            <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
                {/* Cabecera Estática */}
                <div className="dm-header">
                    <div className="dm-title-container">
                        <div className="dm-title-row">
                            <h2 className="dm-title">{mail.asunto}</h2>
                            <span className="dm-status-badge">{mail.estado}</span>
                        </div>
                        <p className="dm-subtitle">Visualización del detalle del correo interno</p>
                    </div>
                    <button className="dm-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Cuerpo Desplazable */}
                <div className="dm-body">
                    {/* Panel de Metadatos Unificado */}
                    <div className="dm-meta-grid">
                        <CampoDetalle titulo="ID de Correo" valor={mail.id} />
                        <CampoDetalle titulo="Estado de Envío" valor={mail.estado} />
                        <CampoDetalle titulo="Remitente" valor={mail.remitente} />
                        <CampoDetalle titulo="Destinatario" valor={mail.destinatario} />
                        <CampoDetalle titulo="Fecha de Envío" valor={mail.fechaEnvio} />
                        <CampoDetalle titulo="Usuario Creador" valor={mail.usuarioCreacion} />
                        <CampoDetalle titulo="Fecha Creación" valor={mail.fechaCreacion} />
                        <CampoDetalle titulo="Hora Creación" valor={mail.horaCreacion} />
                    </div>

                    {/* Contenido del Mail */}
                    <div className="dm-content-section">
                        <div className="dm-content-label">Contenido del Correo</div>
                        <div className="dm-content-box">
                            {mail.contenido}
                        </div>
                    </div>

                    {/* Adjunto si existe */}
                    {mail.adjunto && (
                        <div className="dm-content-section">
                            <div className="dm-content-label">Adjunto</div>
                            <div className="dm-attachment-box">
                                <span>📎</span>
                                <span>{mail.nombreAdjunto}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CampoDetalle = ({ titulo, valor }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{
            fontSize: '10px',
            fontWeight: '800',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
        }}>
            {titulo}
        </span>
        <span style={{
            fontSize: '13px',
            color: '#1e293b',
            fontWeight: '600',
            wordBreak: 'break-all'
        }}>
            {valor || '-'}
        </span>
    </div>
);

export default DetalleMail;