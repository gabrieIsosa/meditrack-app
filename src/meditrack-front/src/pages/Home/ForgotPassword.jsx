import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword, verifyCode, resetPassword } from '../../services/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validarPassword = (pass) => pass.length >= 4;

  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyCode(email, codigo);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarPassword(nuevaPassword)) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, codigo, nuevaPassword);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">MediTrack</h1>
        <p className="login-subtitle">Recuperación de contraseña</p>

        {/* Indicador de pasos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              width: '28px', height: '6px', borderRadius: '3px',
              background: step >= n ? 'var(--primary-emerald)' : 'var(--border-color)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {/* Paso 1 — Email */}
        {step === 1 && (
          <form className="login-form" onSubmit={handleSolicitarCodigo}>
            <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '20px', textAlign: 'left' }}>
              Ingresá el correo vinculado a tu cuenta y te enviaremos un código de verificación.
            </p>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@meditrack.com"
                required
                autoFocus
              />
            </div>
            {error && <p className="error-msg" style={{ margin: '0 0 12px' }}>{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-gray)', fontSize: '13px', cursor: 'pointer', width: '100%' }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* Paso 2 — Código */}
        {step === 2 && (
          <form className="login-form" onSubmit={handleVerificarCodigo}>
            <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '20px', textAlign: 'left' }}>
              Ingresá el código de 6 dígitos enviado a <strong>{email}</strong>. Válido por 30 minutos.
            </p>
            <div className="form-group">
              <label>Código de verificación</label>
              <input
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            {error && <p className="error-msg" style={{ margin: '0 0 12px' }}>{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setCodigo(''); }}
              style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-gray)', fontSize: '13px', cursor: 'pointer', width: '100%' }}
            >
              Volver
            </button>
          </form>
        )}

        {/* Paso 3 — Nueva contraseña */}
        {step === 3 && (
          <form className="login-form" onSubmit={handleResetPassword}>
            <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '20px', textAlign: 'left' }}>
              Elegí una nueva contraseña para tu cuenta.
            </p>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                placeholder="••••"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Repetir contraseña</label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={e => setConfirmarPassword(e.target.value)}
                placeholder="••••"
                required
              />
            </div>
            {error && <p className="error-msg" style={{ margin: '0 0 12px' }}>{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'GUARDANDO...' : 'CAMBIAR CONTRASEÑA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
