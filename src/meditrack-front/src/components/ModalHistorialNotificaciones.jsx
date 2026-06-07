import React, { useState } from 'react';

const ModalHistorialNotificaciones = ({ notifications, alCerrar, alMarcarLeida }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const totalPages = Math.ceil(notifications.length / itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const paginatedNotifications = notifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatFriendlyDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('T');
            if (parts.length < 2) return dateStr;
            const dateParts = parts[0].split('-');
            const timeParts = parts[1].split(':');
            return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`;
        } catch {
            return dateStr;
        }
    };

    const getTitleStyle = (title) => {
        const norm = title.toUpperCase();
        if (norm.includes('INCIDENTE')) {
            return { bg: '#fee2e2', text: '#ef4444' };
        }
        if (norm.includes('REGISTRO')) {
            return { bg: '#d1fae5', text: '#10b981' };
        }
        if (norm.includes('ASIGNADO')) {
            return { bg: '#e0e7ff', text: '#4338ca' };
        }
        return { bg: '#f3f4f6', text: '#374151' };
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h2 style={titleStyle}>Historial completo de avisos</h2>
                    <button style={closeButtonStyle} onClick={alCerrar}>×</button>
                </div>

                <div style={tableWrapper}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>EVENTO</th>
                                <th style={thStyle}>NOTIFICACIÓN</th>
                                <th style={thStyle}>FECHA / HORA</th>
                                <th style={thStyle}>ESTADO</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedNotifications.length > 0 ? (
                                paginatedNotifications.map((notif) => {
                                    const style = getTitleStyle(notif.titulo);
                                    return (
                                        <tr key={notif.id} style={{ backgroundColor: !notif.leido ? 'rgba(37, 99, 235, 0.02)' : 'transparent' }}>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    backgroundColor: style.bg,
                                                    color: style.text,
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    display: 'inline-block',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {notif.titulo}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ color: '#374151', fontSize: '13px', lineHeight: '1.4' }}>
                                                    {notif.mensaje}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ color: '#4b5563', fontSize: '12px' }}>
                                                    {formatFriendlyDate(notif.fechaCreacion)}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {notif.leido ? (
                                                        <span style={{
                                                            color: '#10b981',
                                                            backgroundColor: '#d1fae5',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: '700'
                                                        }}>
                                                            LEÍDO
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span style={{
                                                                color: '#3b82f6',
                                                                backgroundColor: '#dbeafe',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '700'
                                                            }}>
                                                                NUEVO
                                                            </span>
                                                            <button
                                                                style={actionButtonStyle}
                                                                onClick={() => alMarcarLeida(notif.id)}
                                                            >
                                                                Marcar leído
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }}>
                                        No tenés notificaciones registradas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={paginationContainerStyle}>
                        <button
                            style={{
                                ...pageButtonStyle,
                                opacity: currentPage === 1 ? 0.5 : 1,
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            Anterior
                        </button>
                        
                        <span style={pageIndicatorStyle}>
                            Pág. <strong>{currentPage}</strong> de {totalPages}
                        </span>

                        <button
                            style={{
                                ...pageButtonStyle,
                                opacity: currentPage === totalPages ? 0.5 : 1,
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Siguiente
                        </button>
                    </div>
                )}

                <div style={footerStyle}>
                    <button style={buttonStyle} onClick={alCerrar}>CERRAR</button>
                </div>
            </div>
        </div>
    );
};

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
};

const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '950px',
    maxWidth: '95%',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    fontFamily: "'Inter', sans-serif"
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
};

const titleStyle = {
    fontSize: '22px',
    fontWeight: '800',
    color: '#111827'
};

const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#6B7280'
};

const tableWrapper = {
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    minHeight: '200px'
};

const thStyle = {
    backgroundColor: '#059669',
    color: '#fff',
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.05em'
};

const tdStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid #F3F4F6',
    fontSize: '13px',
    verticalAlign: 'middle'
};

const actionButtonStyle = {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    border: '1px solid #dbeafe',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const paginationContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '20px'
};

const pageButtonStyle = {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s'
};

const pageIndicatorStyle = {
    fontSize: '13px',
    color: '#4b5563'
};

const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '24px'
};

const buttonStyle = {
    backgroundColor: '#e5e7eb',
    color: '#111827',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px'
};

export default ModalHistorialNotificaciones;
