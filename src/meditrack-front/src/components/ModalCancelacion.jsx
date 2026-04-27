import { useState } from 'react';

function ModalCancelacion({ onConfirmar, onCerrar }) {
  const [motivo, setMotivo] = useState('');
  const [firma, setFirma] = useState('');
  const [error, setError] = useState('');

  const handleConfirmar = () => {
    if (!motivo.trim()) {
      setError('El motivo es obligatorio');
      return;
    }
    if (!firma.trim()) {
      setError('La firma es obligatoria');
      return;
    }
    setError('');
    onConfirmar(motivo, firma);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cancelar envío</h2>

        <div className="form-group">
          <label>Motivo de cancelación *</label>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ingrese el motivo de la cancelación..."
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div className="form-group">
          <label>Firma del responsable *</label>
          <input
            type="text"
            value={firma}
            onChange={e => setFirma(e.target.value)}
            placeholder="Nombre completo del responsable"
          />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={handleConfirmar}
            style={{ backgroundColor: '#DC2626', border: 'none' }}
          >
            CONFIRMAR CANCELACIÓN
          </button>
          <button className="btn btn-secondary" onClick={onCerrar}>
            VOLVER
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCancelacion;