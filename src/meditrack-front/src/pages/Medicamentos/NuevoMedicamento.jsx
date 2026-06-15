import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMedicamento } from '../../services/api';

const PRESENTACIONES = ['Comprimidos', 'Cápsulas', 'Ampollas', 'Solución oral', 'Crema', 'Pomada', 'Parche', 'Supositorio', 'Colirio'];

function NuevoMedicamento() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nombre: '',
        monodroga: '',
        laboratorio: '',
        presentacion: '',
        descripcion: '',
        cantidad: '',
        unidadMedida: '',
        cadenaFrio: false,
        volumenCm3: '0',
        pesoGramos: '0'
    });

    const [error, setError] = useState('');
    const [preview, setPreview] = useState('');
    const [imagen, setImagen] = useState(null);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImagen(file);
        setPreview( URL.createObjectURL(file) );
    };

    const handleGuardar = async () => {
        if (!form.nombre?.trim() || !form.monodroga?.trim()) {
            setError('Nombre y monodroga son obligatorios.');
            return;
        }

        try {
            const formData = new FormData();

            Object.keys(form).forEach(key => {
                if (form[key] != null) 
                    formData.append(key, form[key]);
            });

            if (imagen) 
                formData.append("imagen", imagen);
            
            await createMedicamento(formData);
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


                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: '30px',
                        paddingBottom: '20px',
                        borderBottom: '1px solid #E5E7EB'
                    }}>

                        <div style={{
                            width: '110px',
                            height: '110px',
                            borderRadius: '18px',
                            overflow: 'hidden',
                            border: '1px solid #E5E7EB',
                            background: '#F9FAFB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>

                            <img
                                src={ preview || 'https://placehold.co/200x200?text=%F0%9F%92%8A' }
                                alt="Medicamento"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        <div>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>
                                {form.nombre || 'Nuevo medicamento'}
                            </h2>

                            <p style={{ marginTop: '6px', color: '#6B7280' }}>
                                {form.monodroga || 'Monodroga'}
                            </p>

                            <label
                                style={{
                                    display: 'inline-block',
                                    marginTop: '12px',
                                    padding: '10px 14px',
                                    background: '#10B981',
                                    color: 'white',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}
                            >
                                Subir imagen
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nombre *</label>
                        <input name="nombre" value={form.nombre} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Monodroga *</label>
                        <input name="monodroga" value={form.monodroga} onChange={handleChange} />
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
                        <label>Cantidad</label>
                        <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min="0" />
                    </div>

                    <div className="form-group">
                        <label>Unidad</label>
                        <input name="unidadMedida" value={form.unidadMedida} onChange={handleChange} placeholder="mg, ml, unidades..." />
                    </div>

                    <div className="form-group">
                        <label>Volumen (cm³)</label>
                        <input type="number" name="volumenCm3" value={form.volumenCm3} onChange={handleChange} min="0" placeholder="Ej: 150" />
                    </div>

                    <div className="form-group">
                        <label>Peso (g)</label>
                        <input type="number" name="pesoGramos" value={form.pesoGramos} onChange={handleChange} min="0" placeholder="Ej: 200" />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', height: '42px', marginTop: '24px' }}>
                        <label className="switch" style={{ margin: 0 }}>
                            <input
                                type="checkbox"
                                name="cadenaFrio"
                                checked={form.cadenaFrio}
                                onChange={e => setForm(prev => ({ ...prev, cadenaFrio: e.target.checked }))}
                            />
                            <span className="slider"></span>
                        </label>
                        <span style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Requiere Cadena de Frío</span>
                    </div>

                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>

                    <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Descripción del medicamento..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            resize: 'vertical'
                        }}
                    />
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