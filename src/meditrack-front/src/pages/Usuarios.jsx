import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsuarios, toggleEstadoUsuario } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ModalHistorialUsuario from '../components/ModalHistorialUsuario';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [historialAbierto, setHistorialAbierto] = useState(false);
    const [usuarioParaHistorial, setUsuarioParaHistorial] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        getUsuarios().then(setUsuarios).catch(console.error);        
    }, []);

    const handleToggleEstado = async (id) => {
        try {
            await toggleEstadoUsuario(id);
            const data = await getUsuarios();
            setUsuarios(data);
        } catch (error) {
            console.error(error);
        }
    };

    const usuariosFiltrados = usuarios.filter(u => {
        const term = busqueda.toLowerCase();
        return u.nombre?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
    });

    return (
        <div className="container">
            <div className="page-header-row">
                <button className="btn btn-secondary" onClick={() => navigate('/')}>VOLVER</button>
                <h1>Gestión del personal</h1>
            </div>

            <div className="card">
                <div className="table-header-actions">
                    <input
                        className="search-input-user"
                        placeholder="🔍 Buscar por Nombre o Email..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    
                    {user?.role === 'ADMINISTRADOR' && (
                        <button className="btn-new-user" onClick={() => navigate('/usuarios/nuevo')}>
                            + NUEVO USUARIO
                        </button>
                    )}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 'bold' }}>{u.nombre}</td>
                                <td>{u.email}</td>
                                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <label className="switch">
                                            <input 
                                                type="checkbox" 
                                                checked={u.estadoActivo} 
                                                onChange={() => handleToggleEstado(u.id)}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                        <span className={`user-status-label ${u.estadoActivo ? 'status-active' : 'status-inactive'}`}>
                                            {u.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button 
                                            className="action-icon-btn" 
                                            title="Editar Usuario"
                                            onClick={() => navigate(`/usuarios/editar/${u.id}`)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                            </svg>
                                        </button>
                                        
                                        <button 
                                            className="action-icon-btn" 
                                            title="Ver Historial"
                                            onClick={() => {
                                                setUsuarioParaHistorial(u);
                                                setHistorialAbierto(true);
                                            }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {historialAbierto && usuarioParaHistorial && (
                <ModalHistorialUsuario
                    usuario={usuarioParaHistorial}
                    alCerrar={() => {
                        setHistorialAbierto(false);
                        setUsuarioParaHistorial(null);
                    }}
                />
            )}
        </div>
    );
}

export default Usuarios;