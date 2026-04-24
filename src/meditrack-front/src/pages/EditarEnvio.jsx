import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEnvio, updateEnvio } from '../services/api';

function EditarEnvio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getEnvio(id)
      .then(data => setForm(data))
      .catch(() => setError('Envío no encontrado.'));
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async () => {
    if (!form.remitente?.trim() || !form.destinatario?.trim()) {
      setError('Remitente y Destinatario son obligatorios.');
      return;
    }
    try {
      await updateEnvio(id, form);
      navigate('/');
    } catch {
      setError('Error al actualizar el envío.');
    }
  };

  if (!form) {
    return (
      <div className="container">
        <p style={{ color: error ? '#c62828' : '#666', marginTop: '24px' }}>
          {error || 'Cargando...'}
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Editar envío</h1>
      </div>

      <div className="card">
        <div className="form-actions-top">
          <button className="btn btn-primary" onClick={handleGuardar}>GUARDAR</button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>CANCELAR</button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="form-grid">
          <div className="form-group form-full">
            <label>Tracking Id</label>
            <input value={form.id} disabled />
          </div>

          <div className="form-group">
            <label>Remitente *</label>
            <input name="remitente" value={form.remitente || ''} onChange={handleChange} placeholder="Laboratorio o depósito de origen" />
          </div>

          <div className="form-group">
            <label>Destinatario *</label>
            <input name="destinatario" value={form.destinatario || ''} onChange={handleChange} placeholder="Farmacia u hospital de destino" />
          </div>

          <div className="form-group form-full">
            <label>Descripción de la carga</label>
            <input name="descripcionCarga" value={form.descripcionCarga || ''} onChange={handleChange} placeholder="Medicamento, lote, cantidad, condiciones de temperatura..." />
          </div>

          <div className="form-group form-full">
            <label>Dirección de entrega</label>
            <input name="direccionEntrega" value={form.direccionEntrega || ''} onChange={handleChange} placeholder="Calle, número, localidad..." />
          </div>

          <div className="form-group">
            <label>Origen</label>
            <input name="origen" value={form.origen || ''} onChange={handleChange} placeholder="Ciudad o provincia de origen" />
          </div>

          <div className="form-group">
            <label>Destino</label>
            <input name="destino" value={form.destino || ''} onChange={handleChange} placeholder="Ciudad o provincia de destino" />
          </div>

          <div className="form-group">
            <label>Fecha estimada de entrega</label>
            <input type="date" name="fechaEstimada" value={form.fechaEstimada || ''} onChange={handleChange} />
          </div>

          <div className="form-group form-full">
            <label>Observaciones</label>
            <textarea name="observaciones" value={form.observaciones || ''} onChange={handleChange} rows="3" placeholder="Cadena de frío, manipulación especial, instrucciones adicionales..." />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditarEnvio;
