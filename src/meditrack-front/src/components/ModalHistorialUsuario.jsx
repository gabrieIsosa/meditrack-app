import React from 'react';

const ESTADO_STYLE = {
    'Activo': { bg: '#d1fae5', text: '#065f46' },
    'Inactivo': { bg: '#fee2e2', text: '#991b1b' },
    'true': { bg: '#d1fae5', text: '#065f46' },
    'false': { bg: '#fee2e2', text: '#991b1b' },
    'PENDIENTE': { bg: '#f3f4f6', text: '#374151' },
    'ASIGNADO': { bg: '#e0e7ff', text: '#3730a3' },
    'EN_PREPARACION': { bg: '#fef3c7', text: '#92400e' },
    'EN_TRANSITO': { bg: '#dbeafe', text: '#1e40af' },
    'ENTREGADO': { bg: '#d1fae5', text: '#065f46' },
    'CANCELADO': { bg: '#f3f4f6', text: '#111827' }
};

const CAMPO_STYLE = {
    'estadoActivo': { bg: '#dcfce7', text: '#166534', label: 'ESTADO ACTIVACIÓN' },
    'Estado': { bg: '#dcfce7', text: '#166534', label: 'ESTADO ACTIVACIÓN' },
    'nombre': { bg: '#e0e7ff', text: '#3730a3', label: 'NOMBRE' },
    'email': { bg: '#f3e8ff', text: '#6b21a8', label: 'CORREO ELECTRÓNICO' },
    'role': { bg: '#fef3c7', text: '#92400e', label: 'ROL / PERMISO' },
    'default': { bg: '#dbeafe', text: '#1e40af', label: 'EDICIÓN' }
};

const ModalHistorialUsuario = ({ usuario, alCerrar }) => {
    const historial = usuario.historial;

    const renderBadgeCampo = (campo) => {
        const style = CAMPO_STYLE[campo] || CAMPO_STYLE['default'];
        const texto = style.label === 'EDICIÓN' ? (campo ? campo.toUpperCase() : 'EDICIÓN') : style.label;

        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.text,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '800',
                display: 'inline-block',
                letterSpacing: '0.02em'
            }}>
                {texto}
            </span>
        );
    };

    const renderValor = (campo, valor) => {
        // Convert to string safely
        const stringVal = String(valor === null || valor === undefined ? '' : valor);
        const normalizedValue = stringVal.toUpperCase();
        
        let style = ESTADO_STYLE[stringVal] || ESTADO_STYLE[normalizedValue];

        // Fallback translation for boolean values
        let displayVal = stringVal;
        if (stringVal === 'true') displayVal = 'Activo';
        if (stringVal === 'false') displayVal = 'Inactivo';

        if (style && (campo === 'Estado' || campo === 'estadoActivo' || campo === 'estado' || campo === 'estadoUsuario')) {
            return (
                <span style={{
                    color: style.text,
                    backgroundColor: style.bg,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    display: 'inline-block'
                }}>
                    {displayVal}
                </span>
            );
        }
        return <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>{displayVal || '(vacío)'}</span>;
    };

    return (
        <div className="mhu-overlay">
            <style>{`
                .mhu-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(15, 23, 42, 0.6);
                    display: flex;
                    justify-content: center;
                    alignItems: center;
                    z-index: 9999;
                    backdrop-filter: blur(8px);
                    animation: mhuFadeIn 0.25s ease-out;
                }
                .mhu-modal {
                    background-color: #ffffff;
                    border-radius: 20px;
                    width: 780px;
                    max-width: 95%;
                    padding: 28px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: mhuScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                }
                .mhu-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 16px;
                }
                .mhu-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                }
                .mhu-close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #94a3b8;
                    transition: color 0.15s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                }
                .mhu-close-btn:hover {
                    color: #475569;
                    background-color: #f1f5f9;
                }
                .mhu-table-container {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    background-color: #ffffff;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .mhu-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .mhu-th {
                    background-color: #059669;
                    color: #ffffff;
                    padding: 12px 16px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .mhu-tr {
                    border-bottom: 1px solid #f1f5f9;
                    transition: background-color 0.15s ease;
                }
                .mhu-tr:hover {
                    background-color: #f8fafc;
                }
                .mhu-td {
                    padding: 14px 16px;
                    font-size: 13.5px;
                    color: #334155;
                }
                .mhu-mobile-list {
                    display: none;
                }
                .mhu-footer {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 24px;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 16px;
                }
                .mhu-btn-close {
                    background-color: #f1f5f9;
                    color: #334155;
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 13.5px;
                    transition: all 0.15s ease;
                }
                .mhu-btn-close:hover {
                    background-color: #e2e8f0;
                    color: #0f172a;
                }
                
                @keyframes mhuFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes mhuScaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .mhu-table-container {
                        display: none !important;
                    }
                    .mhu-mobile-list {
                        display: flex !important;
                        flex-direction: column;
                        gap: 12px;
                        max-height: 420px;
                        overflow-y: auto;
                        padding-right: 2px;
                    }
                    .mhu-modal {
                        padding: 20px 16px;
                        border-radius: 16px;
                    }
                    .mhu-mobile-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 14px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        position: relative;
                        overflow: hidden;
                    }
                    .mhu-card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #f1f5f9;
                        padding-bottom: 8px;
                    }
                    .mhu-card-body {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-wrap: wrap;
                        padding: 2px 0;
                    }
                    .mhu-card-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 11px;
                        color: #64748b;
                        border-top: 1px solid #f1f5f9;
                        padding-top: 8px;
                        margin-top: 4px;
                    }
                }
            `}</style>
            <div className="mhu-modal">
                <div className="mhu-header">
                    <h2 className="mhu-title">Historial de operaciones</h2>
                    <button className="mhu-close-btn" onClick={alCerrar}>×</button>
                </div>

                {/* Vista Desktop */}
                <div className="mhu-table-container">
                    <table className="mhu-table">
                        <thead>
                            <tr>
                                <th className="mhu-th">EVENTO</th>
                                <th className="mhu-th">DETALLE DE CAMBIO</th>
                                <th className="mhu-th">FECHA / HORA</th>
                                <th className="mhu-th">RESPONSABLE</th>
                            </tr>
                        </thead>

                        <tbody>
                            {historial && historial.length > 0 ? (
                                [...historial]
                                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                                    .map((item, index) => (
                                        <tr key={index} className="mhu-tr">
                                            <td className="mhu-td">
                                                {renderBadgeCampo(item.campoModificado)}
                                            </td>
                                            <td className="mhu-td">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {renderValor(item.campoModificado, item.valorAnterior)}
                                                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>→</span>
                                                    {renderValor(item.campoModificado, item.valorActual)}
                                                </div>
                                            </td>
                                            <td className="mhu-td">
                                                <span style={{ color: '#334155', fontWeight: '600' }}>
                                                    {new Date(item.fecha).toLocaleDateString()} 
                                                </span>
                                                <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '12.5px' }}>
                                                    {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="mhu-td">
                                                <span style={{ color: '#475569', fontWeight: '500' }}>{item.autor?.nombre || 'Sistema'}</span>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                        No hay registros en el historial
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Vista Móvil Responsiva */}
                <div className="mhu-mobile-list">
                    {historial && historial.length > 0 ? (
                        [...historial]
                            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                            .map((item, index) => {
                                const style = CAMPO_STYLE[item.campoModificado] || CAMPO_STYLE['default'];
                                return (
                                    <div key={index} className="mhu-mobile-card" style={{ borderLeft: `4px solid ${style.text}` }}>
                                        <div className="mhu-card-header">
                                            {renderBadgeCampo(item.campoModificado)}
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                                {new Date(item.fecha).toLocaleDateString()} {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        
                                        <div className="mhu-card-body">
                                            {renderValor(item.campoModificado, item.valorAnterior)}
                                            <span style={{ color: '#94a3b8', fontWeight: 'bold', margin: '0 4px' }}>→</span>
                                            {renderValor(item.campoModificado, item.valorActual)}
                                        </div>
                                        
                                        <div className="mhu-card-footer">
                                            <span>Por: <strong>{item.autor?.nombre || 'Sistema'}</strong></span>
                                        </div>
                                    </div>
                                );
                            })
                    ) : (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            No hay registros en el historial
                        </div>
                    )}
                </div>

                <div className="mhu-footer">
                    <button className="mhu-btn-close" onClick={alCerrar}>CERRAR</button>
                </div>
            </div>
        </div>
    );
};

export default ModalHistorialUsuario;
