import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DireccionAutocomplete from '../../components/DireccionAutocomplete';
import { createCliente } from '../../services/api';
import { getTipoStyles, iconos, DefaultIcon } from '../../util/Util';

function NuevoCliente() {

    const navigate = useNavigate();

    const [error, setError] = useState('');

    const [form, setForm] = useState({
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: '',
        placeId: '',
        tipoEstablecimiento: ''
    });

    const handleDireccionSeleccionada = (data) => {
        setForm(prev => ({
            ...prev,
            direccion: data.direccion,
            latitud: data.latitud,
            longitud: data.longitud,
            placeId: data.placeId
        }));
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleGuardar = async () => {
        if (!form.nombre?.trim() || !form.direccion?.trim() || !form.tipoEstablecimiento) {
            setError('Nombre, dirección y tipo son obligatorios.');
            return;
        }

        try {
            console.log(form);
            await createCliente(form);

            navigate('/clientes');
        } catch (err) {
            setError(err.message || 'Error al crear cliente.');
        }
    };

    return (

        <div className="container">

            <div className="page-header">
                <h1>Nuevo Cliente</h1>
            </div>

            <div className="card">

                {error && (

                    <div
                        style={{
                            color: '#dc3545',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            padding: '10px',
                            borderRadius: '4px',
                            marginBottom: '15px',
                            fontWeight: 'bold'
                        }}
                    >
                        {error}
                    </div>
                )}

                <div className="form-grid">

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            marginBottom: '30px',
                            paddingBottom: '20px',
                            borderBottom: '1px solid #E5E7EB'
                        }}
                    >

                        <div
                            style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...getTipoStyles(form.tipoEstablecimiento),
                                border: '1px solid #E5E7EB',
                            }}
                        >
                            {(() => {
                                const IconComponent = iconos[form.tipoEstablecimiento] || DefaultIcon;
                                return <IconComponent size={42} />;
                            })()}
                        </div>

                        <div>

                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: '22px',
                                    fontWeight: '700',
                                    color: '#111827'
                                }}
                            >
                                {form.nombre || 'Nuevo cliente'}
                            </h2>

                            <p
                                style={{
                                    marginTop: '6px',
                                    color: '#6B7280'
                                }}
                            >
                                <span
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '999px',
                                        fontWeight: '600',
                                        fontSize: '12px',
                                        ...getTipoStyles(
                                            form.tipoEstablecimiento
                                        )
                                    }}
                                >
                                    {form.tipoEstablecimiento || 'SIN TIPO'}
                                </span>
                            </p>

                        </div>

                    </div>

                    <div className="form-group">

                        <label>
                            Nombre *
                        </label>

                        <input
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Tipo de establecimiento *
                        </label>

                        <select
                            name="tipoEstablecimiento"
                            value={form.tipoEstablecimiento}
                            onChange={handleChange}
                        >

                            <option value="">
                                Seleccione
                            </option>

                            <option value="LABORATORIO">
                                Laboratorio
                            </option>

                            <option value="DEPOSITO">
                                Depósito
                            </option>

                            <option value="HOSPITAL">
                                Hospital
                            </option>

                            <option value="FARMACIA">
                                Farmacia
                            </option>

                        </select>

                    </div>

                    <div
                        className="form-group"
                        style={{ gridColumn: '1 / -1' }}
                    >

                        <label>
                            Dirección *
                        </label>

                        <DireccionAutocomplete onSelect={handleDireccionSeleccionada} />

                        {form.direccion && (
                            <div
                                style={{
                                    marginTop: '10px',
                                    color: '#374151',
                                    fontSize: '14px'
                                }}
                            >
                                {form.direccion}
                            </div>
                        )}

                    </div>

                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '6px',
                        marginTop: '25px',
                        paddingTop: '20px',
                        borderTop: '1px solid #eee'
                    }}
                >

                    <button className="btn btn-secondary" onClick={() => navigate('/clientes')}> CANCELAR</button>
                    <button className="btn btn-primary" onClick={handleGuardar}>GUARDAR </button>
                </div>

            </div>

        </div>
    );
}

export default NuevoCliente;