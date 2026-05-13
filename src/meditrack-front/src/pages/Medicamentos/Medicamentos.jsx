import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inactivarMedicamento, getMedicamentos } from '../../services/api';

function Medicamentos() {
    const [medicamentos, setMedicamentos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        getMedicamentos().then(setMedicamentos).catch(console.error);
    }, []);

    const handleInactivar = async (id) => {
        try {
            await inactivarMedicamento(id);
            const data = await getMedicamentos();
            setMedicamentos(data);
        } catch (error) {
            console.error(error);
        }
    };

    const filtrados = medicamentos.filter(m => {
        const term = busqueda.toLowerCase();
        return (
            m.nombre?.toLowerCase().includes(term) ||
            m.principioActivo?.toLowerCase().includes(term) ||
            m.laboratorio?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="container">
            <div className="page-header-row">
                <button className="btn btn-secondary" onClick={() => navigate('/')}>VOLVER</button>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Gestión de medicamentos</h1>
            </div>

            <div className="card">
                <div className="table-header-actions">
                    <input
                        className="search-input-user"
                        placeholder="Buscar por nombre, principio activo o laboratorio..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    <button className="btn-new-shipment" onClick={() => navigate('/medicamentos/nuevoMedicamento')}>
                        + NUEVO MEDICAMENTO
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Medicamento</th>
                            <th>Laboratorio</th>
                            <th>Presentación</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map(m => (
                            <tr key={m.id}
                                style={{ transition: 'background 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#deffe4'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                                <td>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <img
                                            src={
                                                m.imagenUrl
                                                    ? `http://localhost:8080${m.imagenUrl}`
                                                    : '/placeholder-medicamento.png'
                                            }
                                            alt={m.nombre}
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '10px',
                                                objectFit: 'cover',
                                                border: '1px solid #E5E7EB',
                                                background: '#F9FAFB'
                                            }}
                                        />
                                        <div>
                                            <div style={{
                                                fontWeight: '700',
                                                color: '#111827'
                                            }}>
                                                {m.nombre}
                                            </div>

                                            <div style={{
                                                fontSize: '13px',
                                                color: '#6B7280'
                                            }}>
                                                {m.principioActivo}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>{m.laboratorio}</td>
                                <td>{m.presentacion}</td>
                                <td>{m.stock} {m.unidad}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={m.estadoActivo}
                                                onChange={() => handleInactivar(m.id)}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                        <span className={`user-status-label ${m.estadoActivo ? 'status-active' : 'status-inactive'}`}>
                                            {m.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button
                                            className="action-icon-btn"
                                            title="Editar medicamento"
                                            onClick={() => navigate(`/medicamentos/editar/${m.id}`)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: '#6B7280', padding: '30px' }}>
                                    No se encontraron medicamentos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Medicamentos;
