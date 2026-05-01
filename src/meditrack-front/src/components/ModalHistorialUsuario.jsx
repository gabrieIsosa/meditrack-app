import React from 'react';

const ESTADO_STYLE = {
    'Activo': { bg: '#d1fae5', text: '#10b981' },
    'Inactivo': { bg: '#fee2e2', text: '#ef4444' },
    'PENDIENTE': { bg: '#f3f4f6', text: '#6b7280' },
    'ASIGNADO': { bg: '#e0e7ff', text: '#4338ca' },
    'EN_PREPARACION': { bg: '#fef3c7', text: '#f59e0b' },
    'EN_TRANSITO': { bg: '#dbeafe', text: '#3b82f6' },
    'ENTREGADO': { bg: '#d1fae5', text: '#10b981' },
    'CANCELADO': { bg: '#f3f4f6', text: '#111827' }
};

const CAMPO_STYLE = {
    'estadoActivo': { bg: '#dcfce7', text: '#166534', label: 'CAMBIO ESTADO' },
    'Estado': { bg: '#dcfce7', text: '#166534', label: 'CAMBIO ESTADO' },
    'default': { bg: '#dbeafe', text: '#1e40af', label: 'EDICION' }
};

const ModalHistorialUsuario = ({ usuario, alCerrar }) => {
    const historial = usuario.historial;

    const renderBadgeCampo = (campo) => {
        const style = CAMPO_STYLE[campo] || CAMPO_STYLE['default'];
        const texto = style.label === 'EDICION' ? campo.toUpperCase() : style.label;

        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.text,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '800',
                display: 'inline-block'
            }}>
                {texto}
            </span>
        );
    };

    const renderValor = (campo, valor) => {
        const normalizedValue = String(valor).toUpperCase();
        const style = ESTADO_STYLE[valor] || ESTADO_STYLE[normalizedValue];

        if (style && (campo === 'Estado' || campo === 'estadoActivo' || campo === 'estado')) {
            return (
                <span style={{
                    color: style.text,
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                }}>
                    {valor}
                </span>
            );
        }
        return <span style={{ color: '#374151' }}>{valor || '(vacío)'}</span>;
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h2 style={titleStyle}>Historial de Operaciones</h2>
                    <button style={closeButtonStyle} onClick={alCerrar}>×</button>
                </div>

                <div style={tableWrapper}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>EVENTO</th>
                                <th style={thStyle}>DETALLE</th>
                                <th style={thStyle}>FECHA / HORA</th>
                                <th style={thStyle}>RESPONSABLE</th>
                            </tr>
                        </thead>

                        <tbody>
                            {historial && historial.length > 0 ? (
                                [...historial]
                                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td style={tdStyle}>
                                                {renderBadgeCampo(item.campoModificado)}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {renderValor(item.campoModificado, item.valorAnterior)}
                                                    <span style={{ color: '#9ca3af' }}>→</span>
                                                    {renderValor(item.campoModificado, item.valorActual)}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ color: '#4b5563' }}>
                                                    {new Date(item.fecha).toLocaleDateString()} 
                                                </span>
                                                <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
                                                    {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ color: '#4b5563' }}>{item.autor}</span>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }}>
                                        No hay registros en el historial
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={footerStyle}>
                    <button style={buttonStyle} onClick={alCerrar}>Cerrar historial</button>
                </div>
            </div>
        </div>
    )
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
    width: '900px',
    maxWidth: '95%',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
};

const titleStyle = {
    fontSize: '24px',
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
    maxHeight: '500px',
    overflowY: 'auto'
};

const thStyle = {
    backgroundColor: '#059669',
    color: '#fff',
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.05em',
    position: 'sticky',
    top: 0,
    zIndex: 2
};

const tdStyle = {
    padding: '16px',
    borderBottom: '1px solid #F3F4F6',
    fontSize: '14px'
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

export default ModalHistorialUsuario;