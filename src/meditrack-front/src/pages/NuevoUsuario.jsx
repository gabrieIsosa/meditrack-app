import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createUsuario, updateUsuario, getUsuarioById } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FORM_INICIAL = {
    nombre: '',
    email: '',
    password: '',
    role: ''
};

function NuevoUsuario() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [form, setForm] = useState(FORM_INICIAL);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
        getUsuarioById(id).then(data => {
            setForm({ ...data, password: '' });
        }).catch(() => setError('Error al cargar datos del usuario.'));
        }
    }, [id, isEditing]);

    const getRolesPermitidos = (currentUserRole) => {
        switch (currentUserRole) {
        case 'ADMINISTRADOR': return ['SUPERVISOR', 'OPERADOR', 'REPARTIDOR'];
        case 'SUPERVISOR': return ['OPERADOR', 'REPARTIDOR'];
        case 'OPERADOR': return ['REPARTIDOR'];
        default: return [];
        }
    };

    const rolesPermitidos = getRolesPermitidos(user?.role);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleGuardar = async () => {
        if (!form.nombre.trim() || !form.email.trim() || !form.role) {
        setError('Nombre, Email y Rol son obligatorios.');
        return;
        }

        try {
        if (isEditing) {
            await updateUsuario(id, form);
        } else {
            await createUsuario(form);
        }
        navigate('/usuarios');
        } catch (err) {
        setError(err.message || 'Error de conexión con el servidor.');
        }
    };

    return (
        <div className="container">
        <div className="page-header">
            <h1>{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</h1>
        </div>

        <div className="card">
            {error && (
            <div style={{ color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 'bold' }}>
                {error}
            </div>
            )}

            <div className="form-grid">
            <div className="form-group">
                <label>Nombre completo *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Juan Pérez" />
            </div>

            <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
            </div>

            <div className="form-group">
                <label>DNI *</label>
                <input name="dni" value={form.dni || ''} onChange={handleChange} placeholder="Sin puntos ni espacios"/>
            </div>
            
            <div className="form-group">
                <label>Rol *</label>
                <select name="role" value={form.role} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                <option value="">-- Seleccionar Rol --</option>
                {rolesPermitidos.map(rol => (
                    <option key={rol} value={rol}>{rol}</option>
                ))}
                </select>
            </div>

            <div className="form-group">
                <label>{isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal *'}</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} />
            </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/usuarios')}>CANCELAR</button>
            <button className="btn btn-primary" onClick={handleGuardar}>GUARDAR</button>
            </div>
        </div>
        </div>
    );
}

export default NuevoUsuario;
