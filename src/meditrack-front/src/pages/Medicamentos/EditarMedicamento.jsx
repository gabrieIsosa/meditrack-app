import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMedicamentoById, updateMedicamento } from '../../services/api';

const PRESENTACIONES = ['Comprimidos', 'Cápsulas', 'Ampollas', 'Solución oral', 'Crema', 'Pomada', 'Parche', 'Supositorio', 'Colirio'];

function EditarMedicamento() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        getMedicamentoById(id)
            .then(setForm)
            .catch(() => setError('Error al cargar datos del medicamento.'));
    }, [id]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);

        setPreview(imageUrl);
        setForm({ ...form, imagen: file });
    };

    const handleGuardar = async () => {
        try {
            const formData = new FormData();

            Object.keys(form).forEach(key => {
                formData.append(key, form[key]);
            });

            if (form.imagen) 
                formData.append("imagen", form.imagen);
            
            await updateMedicamento(id, formData);
            navigate('/medicamentos');
        } catch (err) {
            setError(err.message);
        }
    };

    if (!form) return <div className="container">Cargando...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Editar medicamento</h1>
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
                            src={
                                preview ||
                                (form.imagenUrl
                                    ? `http://localhost:8080${form.imagenUrl}`
                                    : 'https://placehold.co/200x200?text=%F0%9F%92%8A')
                            }
                            alt="Medicamento"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </div>

                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#111827'
                        }}>
                            {form.nombre || 'Nuevo medicamento'}
                        </h2>

                        <p style={{
                            marginTop: '6px',
                            color: '#6B7280'
                        }}>
                            {form.principioActivo || 'Principio activo'}
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
                            Cambiar imagen
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group form-full">
                        <label>ID</label>
                        <input value={form.id} disabled className="input-locked" />
                    </div>

                    <div className="form-group">
                        <label>Nombre *</label>
                        <input name="nombre" value={form.nombre || ''} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Principio Activo *</label>
                        <input name="principioActivo" value={form.principioActivo || ''} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Laboratorio</label>
                        <input name="laboratorio" value={form.laboratorio || ''} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Presentación</label>
                        <select name="presentacion" value={form.presentacion || ''} onChange={handleChange}>
                            <option value="">-- Seleccionar --</option>
                            {PRESENTACIONES.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Stock</label>
                        <input type="number" name="stock" value={form.stock ?? ''} onChange={handleChange} min="0" />
                    </div>

                    <div className="form-group">
                        <label>Unidad</label>
                        <input name="unidad" value={form.unidadMedida || ''} onChange={handleChange} placeholder="mg, ml, unidades..." />
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
                    <button className="btn btn-secondary" onClick={() => navigate('/medicamentos')}>CANCELAR</button>
                    <button className="btn btn-primary" onClick={handleGuardar}>GUARDAR</button>
                </div>
            </div>
        </div>
    );
}

export default EditarMedicamento;
