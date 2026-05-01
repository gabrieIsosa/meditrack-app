import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEnvio } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FORM_INICIAL = {
  remitente: '',
  destinatario: '',
  origen: '',
  destino: '',
  descripcionCarga: '',
  direccionEntrega: '',
  fechaEstimada: '',
  observaciones: '',
};

function NuevoEnvio() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async () => {
    const camposAValidar = Object.keys(form).filter(key => key !== 'observaciones');
    const hayCamposVacios = camposAValidar.some(key => !form[key]?.trim());

    if (hayCamposVacios) {
      setError('Todos los campos con asterisco (*) son obligatorios.');
      return;
    }

    try {
      const payload = { 
        ...form, 
        usuarioCreador: user?.nombre || 'Sistema' 
      };
      
      await createEnvio(payload); 
      navigate('/envios', { state: { success: true } });
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Nuevo envío</h1>
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
            <label>Remitente *</label>
            <input name="remitente" value={form.remitente} onChange={handleChange} placeholder="Laboratorio o depósito" />
          </div>

          <div className="form-group">
            <label>Destinatario *</label>
            <input name="destinatario" value={form.destinatario} onChange={handleChange} placeholder="Farmacia u hospital de destino" />
          </div>

          <div className="form-group form-full">
            <label>Descripción de la carga *</label>
            <input name="descripcionCarga" value={form.descripcionCarga} onChange={handleChange} />
          </div>

          <div className="form-group form-full">
            <label>Dirección de entrega *</label>
            <input name="direccionEntrega" value={form.direccionEntrega} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Origen *</label>
            <input name="origen" value={form.origen} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Destino *</label>
            <input name="destino" value={form.destino} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Fecha de entrega estimada *</label>
            <input type="date" name="fechaEstimada" value={form.fechaEstimada} onChange={handleChange} />
          </div>

          <div className="form-group form-full">
            <label>Observaciones (Opcional)</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows="3" />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>CANCELAR</button>
          <button className="btn btn-primary" onClick={handleGuardar} style={{ backgroundColor: '#10B981', border: 'none' }}>CREAR ENVÍO</button>
        </div>
      </div>
    </div>
  );
}

export default NuevoEnvio;