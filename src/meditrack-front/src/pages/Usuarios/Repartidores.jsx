import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getUsuarios } from '../../services/api';
import ModalHistorialUsuario from '../../components/ModalHistorialUsuario';

function Repartidores() {
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [historialAbierto, setHistorialAbierto] = useState(false);
    const [usuarioParaHistorial, setUsuarioParaHistorial] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        getUsuarios()
            .then(data => {
                setUsuarios(
                    data.filter(u => u.role === 'REPARTIDOR')
                );
            })
            .catch(console.error);
    }, []);

    const repartidoresFiltrados = usuarios.filter(u => {
        const term = busqueda.toLowerCase();

        const cumpleBusqueda =
            u.nombre?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            String(u.dni || '').toLowerCase().includes(term);

        const cumpleEstado =
            filtroEstado === 'TODOS'
                ? true
                : filtroEstado === 'ACTIVO'
                    ? u.estadoActivo
                    : !u.estadoActivo;

        return cumpleBusqueda && cumpleEstado;
    });

    return (
        <div className="container">

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '24px'
                }}
            >
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    VOLVER
                </button>

                <h1
                    style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#111827',
                        margin: 0
                    }}
                >
                    Gestión de Repartidores
                </h1>
            </div>

            <div
                style={{
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    marginBottom: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <span style={{ fontSize: '18px' }}>🚚</span>
                <strong>{usuarios.length}</strong>
                <span>Repartidores</span>
            </div>

            <div
                className="card"
                style={{
                    padding: '20px',
                    marginBottom: '24px'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            minWidth: '250px',
                            position: 'relative'
                        }}
                    >
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#6b7280'
                            }}
                        />

                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar repartidor..."
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db'
                            }}
                        />
                    </div>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #d1d5db',
                            minWidth: '180px'
                        }}
                    >
                        <option value="TODOS">Todos</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                    </select>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px'
                }}
            >
                {repartidoresFiltrados.map(u => (
                    <div
                        key={u.id}
                        style={{
                            background: '#fff',
                            borderRadius: '20px',
                            padding: '20px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            transition: '0.2s'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                marginBottom: '20px'
                            }}
                        >
                            <div
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '24px'
                                }}
                            >
                                {u.nombre?.charAt(0)?.toUpperCase()}
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontWeight: '700',
                                        fontSize: '18px',
                                        color: '#111827'
                                    }}
                                >
                                    {u.nombre}
                                </div>

                                <div
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px'
                                    }}
                                >
                                    {u.email}
                                </div>
                            </div>
                        </div>

                        {u.dni && (
                            <div
                                style={{
                                    marginBottom: '15px',
                                    color: '#4b5563'
                                }}
                            >
                                <strong>DNI:</strong> {u.dni}
                            </div>
                        )}

                        <div
                            style={{
                                marginBottom: '20px'
                            }}
                        >
                            <span
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    backgroundColor: u.estadoActivo
                                        ? '#DCFCE7'
                                        : '#FEE2E2',
                                    color: u.estadoActivo
                                        ? '#166534'
                                        : '#991B1B'
                                }}
                            >
                                {u.estadoActivo ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                        </div>

                        <button
                            style={{
                                width: '100%',
                                border: 'none',
                                background: '#2563eb',
                                color: 'white',
                                padding: '12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                            onClick={() => {
                                setUsuarioParaHistorial(u);
                                setHistorialAbierto(true);
                            }}
                        >
                            Ver historial
                        </button>
                    </div>
                ))}
            </div>

            {repartidoresFiltrados.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '50px',
                        color: '#6b7280'
                    }}
                >
                    No se encontraron repartidores.
                </div>
            )}

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

export default Repartidores;