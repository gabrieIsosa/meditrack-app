import { useEffect, useState } from 'react';
import {
    Mail,
    Search,
    Eye,
    Send,
    CalendarDays,
    UserRound
} from 'lucide-react';
import DetalleMail from './DetalleMail';
import { getMails } from '../../services/api';

const Mails = () => {

    const [mails, setMails] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [mailSeleccionado, setMailSeleccionado] = useState(null);

    const isMobile = window.innerWidth < 768;

    const obtenerMails = async () => {
        try {
            setLoading(true);
            const data = await getMails();
            setMails(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        obtenerMails();
    }, []);

    const mailsFiltrados = mails.filter(x =>
        x.asunto?.toLowerCase().includes(busqueda.toLowerCase()) ||
        x.remitente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        x.destinatario?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const mailsVisibles =
        filtroEstado === 'TODOS'
            ? mailsFiltrados
            : mailsFiltrados.filter(x => x.estado === filtroEstado);

    const obtenerColorEstado = (estado) => {

        switch (estado) {

            case 'Enviado':
                return {
                    bg: '#dcfce7',
                    text: '#166534',
                    button: '#22c55e'
                };

            case 'Pendiente':
                return {
                    bg: '#fef3c7',
                    text: '#92400e',
                    button: '#f59e0b'
                };

            case 'Error':
                return {
                    bg: '#fee2e2',
                    text: '#991b1b',
                    button: '#ef4444'
                };

            default:
                return {
                    bg: '#dbeafe',
                    text: '#1d4ed8',
                    button: '#3b82f6'
                };
        }
    };

    return (
        <div style={{
            padding: isMobile ? '18px' : '35px',
            background: '#f4f7fb',
            minHeight: '100vh',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
        }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                marginBottom: '30px',
                gap: '20px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? '26px' : '34px',
                        fontWeight: '800',
                        color: '#111827',
                        marginBottom: '6px'
                    }}>
                        Mails Internos
                    </h1>

                    <p style={{
                        color: '#6b7280',
                        fontSize: '15px'
                    }}>
                        Gestión y visualización de comunicaciones internas
                    </p>
                </div>

                <div style={{
                    background: '#7c3aed',
                    color: 'white',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    fontWeight: '800',
                    fontSize: '14px',
                    boxShadow: '0 10px 25px rgba(124,58,237,0.25)',
                    alignSelf: isMobile ? 'flex-start' : 'auto'
                }}>
                    {mailsVisibles.length} mails
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns:
                    isMobile
                        ? '1fr 1fr'
                        : 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '25px'
            }}>
                <CardResumen
                    titulo="Total"
                    valor={mails.length}
                    color="#7c3aed"
                />

                <CardResumen
                    titulo="Enviados"
                    valor={
                        mails.filter(x => x.estado === 'Enviado').length
                    }
                    color="#22c55e"
                />

                <CardResumen
                    titulo="Pendientes"
                    valor={
                        mails.filter(x => x.estado === 'Pendiente').length
                    }
                    color="#f59e0b"
                />

                <CardResumen
                    titulo="Errores"
                    valor={
                        mails.filter(x => x.estado === 'Error').length
                    }
                    color="#ef4444"
                />
            </div>

            <div style={{
                background: 'white',
                borderRadius: '22px',
                padding: isMobile ? '18px' : '25px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    gap: '20px',
                    marginBottom: '25px'
                }}>
                    <div style={{
                        position: 'relative',
                        maxWidth: isMobile ? '100%' : '450px',
                        width: '100%'
                    }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '14px',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af'
                            }}
                        />

                        <input
                            type="text"
                            placeholder="Buscar asunto, remitente o destinatario..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 14px 14px 45px',
                                borderRadius: '14px',
                                border: '1px solid #e5e7eb',
                                outline: 'none',
                                fontSize: '14px',
                                background: '#f9fafb',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        paddingBottom: '5px'
                    }}>
                        {['TODOS', 'Enviado', 'Pendiente', 'Error', 'Programado'].map((estado) => (
                            <button
                                key={estado}
                                onClick={() => setFiltroEstado(estado)}
                                style={{
                                    border: 'none',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    transition: '0.2s',
                                    whiteSpace: 'nowrap',
                                    background:
                                        filtroEstado === estado
                                            ? '#7c3aed'
                                            : '#f3f4f6',
                                    color:
                                        filtroEstado === estado
                                            ? 'white'
                                            : '#374151'
                                }}
                            >
                                {estado}
                            </button>
                        ))}
                    </div>
                </div>

                {
                    loading && (
                        <div style={{
                            padding: '60px',
                            textAlign: 'center',
                            color: '#6b7280'
                        }}>
                            Cargando mails...
                        </div>
                    )
                }

                {
                    !loading && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            {mailsVisibles.map((mail) => {

                                const colores =
                                    obtenerColorEstado(mail.estado);

                                return (
                                    <div
                                        key={mail.id}
                                        style={{
                                            border: '1px solid #ececf1',
                                            borderRadius: '18px',
                                            padding: isMobile ? '16px' : '20px',
                                            transition: '0.2s',
                                            background: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: isMobile ? 'column' : 'row',
                                            justifyContent: 'space-between',
                                            gap: '20px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: isMobile ? 'flex-start' : 'center',
                                                gap: '18px',
                                                flex: 1
                                            }}>
                                                <div style={{
                                                    width: '52px',
                                                    height: '52px',
                                                    minWidth: '52px',
                                                    borderRadius: '14px',
                                                    background: colores.bg,
                                                    color: colores.text,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '800',
                                                    fontSize: '18px'
                                                }}>
                                                    {
                                                        mail.remitente
                                                            ?.charAt(0)
                                                            ?.toUpperCase()
                                                    }
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        marginBottom: '8px',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        <h3 style={{
                                                            margin: 0,
                                                            fontSize: isMobile ? '16px' : '18px',
                                                            fontWeight: '800',
                                                            color: '#111827'
                                                        }}>
                                                            {mail.asunto}
                                                        </h3>

                                                        <span style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '999px',
                                                            fontSize: '11px',
                                                            fontWeight: '800',
                                                            backgroundColor: colores.bg,
                                                            color: colores.text
                                                        }}>
                                                            {mail.estado}
                                                        </span>
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '8px',
                                                        color: '#6b7280',
                                                        fontSize: '14px'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            <Send size={15} />

                                                            <strong>
                                                                Remitente:
                                                            </strong>

                                                            {mail.remitente}
                                                        </div>

                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            <UserRound size={15} />

                                                            <strong>
                                                                Destinatario:
                                                            </strong>

                                                            {mail.destinatario}
                                                        </div>

                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <CalendarDays size={15} />

                                                            {mail.fechaEnvio}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setMailSeleccionado(mail)}
                                                style={{
                                                    border: 'none',
                                                    background: colores.button,
                                                    color: 'white',
                                                    width: isMobile ? '100%' : '48px',
                                                    height: '48px',
                                                    borderRadius: '14px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    alignSelf: isMobile ? 'stretch' : 'center',
                                                    boxShadow: '0 10px 20px rgba(0,0,0,0.12)'
                                                }}
                                            >
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {
                                mailsVisibles.length === 0 && (
                                    <div style={{
                                        padding: '70px 20px',
                                        textAlign: 'center',
                                        color: '#6b7280'
                                    }}>
                                        <Mail
                                            size={60}
                                            style={{
                                                marginBottom: '15px'
                                            }}
                                        />

                                        <h3 style={{
                                            fontSize: '20px',
                                            marginBottom: '8px',
                                            color: '#374151'
                                        }}>
                                            No se encontraron mails
                                        </h3>

                                        <p>
                                            Intentá buscar por asunto,
                                            remitente o destinatario
                                        </p>
                                    </div>
                                )
                            }
                        </div>
                    )
                }
            </div>

            <DetalleMail
                mail={mailSeleccionado}
                onClose={() => setMailSeleccionado(null)}
            />
        </div>
    );
};

const CardResumen = ({ titulo, valor, color }) => (
    <div style={{
        background: 'white',
        borderRadius: '18px',
        padding: '20px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
        borderTop: `4px solid ${color}`
    }}>
        <div style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#6b7280',
            marginBottom: '10px'
        }}>
            {titulo}
        </div>

        <div style={{
            fontSize: '30px',
            fontWeight: '800',
            color: '#111827'
        }}>
            {valor}
        </div>
    </div>
);

export default Mails;