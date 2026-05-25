const DetalleMail = ({ mail, onClose }) => {

    if (!mail) return null;

    const isMobile = window.innerWidth < 768;

    const obtenerColorEstado = (estado) => {

        switch (estado) {

            case 'Enviado':
                return {
                    bg: '#dcfce7',
                    text: '#166534'
                };

            case 'Pendiente':
                return {
                    bg: '#fef3c7',
                    text: '#92400e'
                };

            case 'Error':
                return {
                    bg: '#fee2e2',
                    text: '#991b1b'
                };

            default:
                return {
                    bg: '#dbeafe',
                    text: '#1d4ed8'
                };
        }
    };

    const colores = obtenerColorEstado(mail.estado);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.55)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: isMobile ? 'flex-end' : 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: isMobile ? '0px' : '20px'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: isMobile ? '100%' : '850px',
                    maxWidth: '100%',
                    maxHeight: isMobile ? '95vh' : '90vh',
                    overflowY: 'auto',
                    background: 'white',
                    borderRadius:
                        isMobile
                            ? '28px 28px 0 0'
                            : '28px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                }}
            >
                <div style={{
                    padding: isMobile ? '22px' : '30px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '20px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '15px',
                            flexWrap: 'wrap'
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize:
                                    isMobile
                                        ? '24px'
                                        : '30px',
                                fontWeight: '800',
                                color: '#111827',
                                wordBreak: 'break-word'
                            }}>
                                {mail.asunto}
                            </h2>

                            <span style={{
                                padding: '7px 14px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: '800',
                                background: colores.bg,
                                color: colores.text
                            }}>
                                {mail.estado}
                            </span>
                        </div>

                        <p style={{
                            margin: 0,
                            color: '#6b7280',
                            fontSize: '14px'
                        }}>
                            Visualización del detalle del mail interno
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: '#f3f4f6',
                            width: '46px',
                            minWidth: '46px',
                            height: '46px',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: '800',
                            color: '#374151'
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{
                    padding: isMobile ? '22px' : '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '25px'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns:
                            isMobile
                                ? '1fr'
                                : '1fr 1fr',
                        gap: '20px'
                    }}>
                        <CampoDetalle
                            titulo="ID"
                            valor={mail.id}
                        />

                        <CampoDetalle
                            titulo="Estado"
                            valor={mail.estado}
                        />
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns:
                            isMobile
                                ? '1fr'
                                : '1fr 1fr',
                        gap: '20px'
                    }}>
                        <CampoDetalle
                            titulo="Remitente"
                            valor={mail.remitente}
                        />

                        <CampoDetalle
                            titulo="Destinatario"
                            valor={mail.destinatario}
                        />
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns:
                            isMobile
                                ? '1fr'
                                : '1fr 1fr',
                        gap: '20px'
                    }}>
                        <CampoDetalle
                            titulo="Fecha Envío"
                            valor={mail.fechaEnvio}
                        />

                        <CampoDetalle
                            titulo="Usuario Creación"
                            valor={mail.usuarioCreacion}
                        />
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns:
                            isMobile
                                ? '1fr'
                                : '1fr 1fr',
                        gap: '20px'
                    }}>
                        <CampoDetalle
                            titulo="Fecha Creación"
                            valor={mail.fechaCreacion}
                        />

                        <CampoDetalle
                            titulo="Hora Creación"
                            valor={mail.horaCreacion}
                        />
                    </div>

                    <div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#6b7280',
                            marginBottom: '10px',
                            textTransform: 'uppercase'
                        }}>
                            Contenido del Mail
                        </div>

                        <div style={{
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '18px',
                            padding: isMobile ? '18px' : '24px',
                            lineHeight: '1.8',
                            fontSize: isMobile ? '14px' : '15px',
                            color: '#374151',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {mail.contenido}
                        </div>
                    </div>

                    {
                        mail.adjunto && (
                            <div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: '800',
                                    color: '#6b7280',
                                    marginBottom: '10px',
                                    textTransform: 'uppercase'
                                }}>
                                    Adjunto
                                </div>

                                <div style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: '#1d4ed8',
                                    borderRadius: '14px',
                                    padding: '16px',
                                    fontWeight: '700',
                                    wordBreak: 'break-word'
                                }}>
                                    📎 {mail.nombreAdjunto}
                                </div>
                            </div>
                        )
                    }

                    <div style={{
                        display: 'flex',
                        justifyContent:
                            isMobile
                                ? 'stretch'
                                : 'flex-end',
                        gap: '12px'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                border: 'none',
                                background: '#111827',
                                color: 'white',
                                width:
                                    isMobile
                                        ? '100%'
                                        : 'auto',
                                padding: '14px 22px',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '14px'
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CampoDetalle = ({ titulo, valor }) => (
    <div>
        <div style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#6b7280',
            marginBottom: '8px',
            textTransform: 'uppercase'
        }}>
            {titulo}
        </div>

        <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '14px',
            color: '#111827',
            fontWeight: '600',
            wordBreak: 'break-word'
        }}>
            {valor || '-'}
        </div>
    </div>
);

export default DetalleMail;