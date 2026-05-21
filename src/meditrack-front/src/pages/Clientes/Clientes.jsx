import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cambiarEstadoCliente, getClientes } from '../../services/api';
import { getTipoStyles, iconos } from '../../util/Util';

function Clientes() {

    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        getClientes()
            .then(setClientes)
            .catch(console.error);
    }, []);

    const handleInactivar = async (id) => {
        try {
            await cambiarEstadoCliente(id);

            const data = await getClientes();
            setClientes(data);
        } catch (error) {
            console.error(error);
        }
    };

    const filtrados = clientes.filter(c => {
        const term = busqueda.toLowerCase();
        return (
            c.nombre?.toLowerCase().includes(term) ||
            c.tipoEstablecimiento?.toLowerCase().includes(term) ||
            c.direccion?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="container">
            <div className="page-header-row">

                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/')}
                >
                    VOLVER
                </button>

                <h1
                    style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        color: '#111827'
                    }}
                >
                    Gestión de clientes
                </h1>

            </div>

            <div className="card">

                <div className="table-header-actions">

                    <input
                        className="search-input-user"
                        placeholder="Buscar por nombre, tipo o dirección..."
                        value={busqueda}
                        onChange={e =>
                            setBusqueda(e.target.value)
                        }
                    />

                    <button
                        className="btn-new-shipment"
                        onClick={() =>
                            navigate('/clientes/nuevo')
                        }
                    >
                        + NUEVO CLIENTE
                    </button>

                </div>

                <table>

                    <thead>

                        <tr>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Estado</th>

                            <th
                                style={{
                                    textAlign: 'center'
                                }}
                            >
                                Acciones
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {filtrados.map(c => (

                            <tr
                                key={c.id}
                                style={{
                                    transition:
                                        'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        'white';
                                }}
                            >

                                <td>

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                    >

                                        <div
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius:
                                                    '50%',
                                                background:
                                                    '#DCFCE7',
                                                display: 'flex',
                                                alignItems:
                                                    'center',
                                                justifyContent:
                                                    'center',
                                                fontWeight:
                                                    '700',
                                                ...getTipoStyles(
                                                    c.tipoEstablecimiento
                                                ),
                                                border: '1px solid #E5E7EB',
                                            }}
                                        >
                                            {iconos[c.tipoEstablecimiento] || '🏢'}
                                        </div>

                                        <div>

                                            <div
                                                style={{
                                                    fontWeight:
                                                        '700',
                                                    color:
                                                        '#111827'
                                                }}
                                            >
                                                {c.nombre}
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#6B7280',
                                                    maxWidth: '320px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {c.direccion}
                                            </div>

                                        </div>

                                    </div>

                                </td>

                                <td>

                                    <span
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '999px',
                                            fontWeight: '600',
                                            fontSize: '12px',
                                            ...getTipoStyles(
                                                c.tipoEstablecimiento
                                            )
                                        }}
                                    >
                                        {c.tipoEstablecimiento}
                                    </span>

                                </td>

                                <td>

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems:
                                                'center',
                                            gap: '10px'
                                        }}
                                    >

                                        <label className="switch">

                                            <input
                                                type="checkbox"
                                                checked={
                                                    c.estadoActivo
                                                }
                                                onChange={() =>
                                                    handleInactivar(
                                                        c.id
                                                    )
                                                }
                                            />

                                            <span className="slider"></span>

                                        </label>

                                        <span
                                            className={`user-status-label ${c.estadoActivo
                                                ? 'status-active'
                                                : 'status-inactive'
                                                }`}
                                        >
                                            {c.estadoActivo
                                                ? 'ACTIVO'
                                                : 'INACTIVO'}
                                        </span>

                                    </div>

                                </td>

                                <td>

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            justifyContent:
                                                'center'
                                        }}
                                    >

                                        <button
                                            className="action-icon-btn"
                                            title="Editar cliente"
                                            onClick={() =>
                                                navigate(
                                                    `/clientes/editar/${c.id}`
                                                )
                                            }
                                        >

                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#2563EB"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
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

                                <td
                                    colSpan="5"
                                    style={{
                                        textAlign: 'center',
                                        color: '#6B7280',
                                        padding: '30px'
                                    }}
                                >
                                    No se encontraron clientes.
                                </td>

                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Clientes;