import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMedicamento } from '../../services/api';

const PRESENTACIONES = ['Comprimidos', 'Cápsulas', 'Ampollas', 'Solución oral', 'Crema', 'Pomada', 'Parche', 'Supositorio', 'Colirio'];

function NuevoMedicamento() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nombre: '',
        principioActivo: '',
        laboratorio: '',
        presentacion: '',
        stock: '',
        unidadMedida: ''
    });

    const [error, setError] = useState('');

    const handleChange = e =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleGuardar = async () => {
        if (!form.nombre?.trim() || !form.principioActivo?.trim()) {
            setError('Nombre y principio activo son obligatorios.');
            return;
        }

        try {
            await createMedicamento(form);
            navigate('/medicamentos');
        } catch (err) {
            setError(err.message || 'Error al crear medicamento.');
        }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1>Nuevo medicamento</h1>
            </div>

            <div className="card">
                {error && (
                    <div style={{
                        color: '#dc3545',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        fontWeight: 'bold'
                    }}>
                        {error}
                    </div>
                )}

                <div className="form-grid">

                    <div className="form-group">
                        <label>Nombre *</label>
                        <input name="nombre" value={form.nombre} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Principio Activo *</label>
                        <input name="principioActivo" value={form.principioActivo} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Laboratorio</label>
                        <input name="laboratorio" value={form.laboratorio} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Presentación</label>
                        <select name="presentacion" value={form.presentacion} onChange={handleChange}>
                            <option value="">-- Seleccionar --</option>
                            {PRESENTACIONES.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Stock</label>
                        <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" />
                    </div>

                    <div className="form-group">
                        <label>Unidad</label>
                        <input name="unidadMedida" value={form.unidadMedida} onChange={handleChange} placeholder="mg, ml, unidades..." />
                    </div>

                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '6px',
                    marginTop: '25px',
                    paddingTop: '20px',
                    borderTop: '1px solid #eee'
                }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/medicamentos')}>
                        CANCELAR
                    </button>
                    <button className="btn btn-primary" onClick={handleGuardar}>
                        GUARDAR
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NuevoMedicamento;