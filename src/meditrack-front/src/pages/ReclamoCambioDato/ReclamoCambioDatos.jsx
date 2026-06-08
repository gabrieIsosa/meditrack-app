import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { crearReclamoCambioDatos } from '../../services/api';

function ReclamoCambioDatos() {
    const location = useLocation();
    const [trackingId, setTrackingId] = useState(location.state?.trackingId || '');
    const [campoReclamado, setCampoReclamado] = useState('');
    const [valorSolicitado, setValorSolicitado] = useState('');
    const [motivo, setMotivo] = useState('');
    const [contacto, setContacto] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!trackingId || !campoReclamado || !valorSolicitado || !motivo) {
            setError('Completá todos los campos obligatorios');
            return;
        }

        setError('');
        setMensaje('');
        setEnviando(true);

        try {
            const res = await crearReclamoCambioDatos({
                trackingId,
                campoReclamado,
                valorSolicitado,
                motivo,
                contacto,
            });

            setMensaje(res.mensaje || 'Reclamo registrado correctamente');
            setTrackingId('');
            setCampoReclamado('');
            setValorSolicitado('');
            setMotivo('');
            setContacto('');
        } catch (err) {
            setError(err.message || 'Error al registrar el reclamo');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                    Reclamo por cambio de datos
                </h1>
                <p style={{ color: '#6B7280', marginBottom: '20px' }}>
                    Si detectaste un error en los datos de tu envío, completá este formulario.
                </p>

                {mensaje && (
                    <div style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Número de envío / Tracking ID *</label>
                        <input
                            type="text"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            placeholder="Ej. ENV-123"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Dato a corregir *</label>
                        <select
                            value={campoReclamado}
                            onChange={(e) => setCampoReclamado(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            <option value="remitente">Remitente</option>
                            <option value="destinatario">Destinatario</option>
                            <option value="origen">Origen</option>
                            <option value="destino">Destino</option>
                            <option value="fechaEstimada">Fecha estimada</option>
                            <option value="observaciones">Observaciones</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Nuevo valor solicitado *</label>
                        <input
                            type="text"
                            value={valorSolicitado}
                            onChange={(e) => setValorSolicitado(e.target.value)}
                            placeholder="Ingresá el valor correcto"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Motivo del reclamo *</label>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            rows={4}
                            placeholder="Describí el problema encontrado"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>Contacto (opcional)</label>
                        <input
                            type="text"
                            value={contacto}
                            onChange={(e) => setContacto(e.target.value)}
                            placeholder="Mail o teléfono"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={enviando}
                    >
                        {enviando ? 'ENVIANDO...' : 'ENVIAR RECLAMO'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ReclamoCambioDatos;