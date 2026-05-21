import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin, verify2fa } from '../../services/api';

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '' });
  const [tempData, setTempData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  if (user) return <Navigate to="/" replace />;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (step === 1) {
        const responseData = await apiLogin(form.email, form.password);
        
        if (responseData.require2fa) {
          setTempData(responseData);
          setOtp(new Array(6).fill(""));
          setStep(2);
        } else {
          login(responseData);
          navigate('/');
        }
      } else if (step === 2) {
        const fullCode = otp.join("");
        if (fullCode.length !== 6) {
          setError("Por favor, ingresa los 6 dígitos completos.");
          setLoading(false);
          return;
        }

        const responseData = await verify2fa(tempData.email, fullCode);
        login(responseData);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false; 

    setOtp([...otp.map((d, id) => (id === index ? element.value : d))]);

    if (element.value !== "" && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const pasteArray = pasteData.split('').slice(0, 6);
    const newOtp = [...otp];
    
    pasteArray.forEach((char, index) => {
      if (!isNaN(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    
    const focusIndex = Math.min(pasteArray.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">MediTrack</h1>
        <p className="login-subtitle">Gestión logística farmacéutica</p>

        <form className="login-form" onSubmit={handleFormSubmit}>
          
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@meditrack.com"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  Autenticación de Dos Factores
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6' }}>
                  Simulación SMS enviado. Tu código es: <span style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '16px', color: '#1d4ed8' }}>{tempData?.mockCode}</span>
                </p>
              </div>

              <div className="form-group">
                <label style={{ marginBottom: '10px', display: 'block', textAlign: 'center' }}>Ingresa el código de 6 dígitos</label>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }} onPaste={handleOtpPaste}>
                  {otp.map((data, index) => {
                    return (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={data}
                        ref={(el) => (inputRefs.current[index] = el)}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        style={{
                          width: '45px',
                          height: '50px',
                          textAlign: 'center',
                          fontSize: '22px',
                          fontWeight: 'bold',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          outline: 'none',
                          color: '#111827',
                          margin: 0
                        }}
                        autoFocus={index === 0}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {error && <p className="error-msg" style={{ margin: step === 2 ? '10px 0' : '0' }}>{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? 'PROCESANDO...' : (step === 1 ? 'INGRESAR' : 'VERIFICAR Y ENTRAR')}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setOtp(new Array(6).fill("")); }}
              style={{ marginTop: '10px', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
            >
              ← Volver al inicio de sesión
            </button>
          )}

          {step === 1 && (
            <>
              <button
                className="btn btn-secondary btn-full"
                type="button"
                onClick={() => navigate('/tracking')}
                style={{ marginTop: '10px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                BUSCAR ENVÍO
              </button>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--text-gray)', fontSize: '13px', cursor: 'pointer', width: '100%' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}
        </form>

        {step === 1 && (
          <div className="login-hint">
            <strong>Usuarios de prueba:</strong><br />
            supervisor@meditrack.com · 1234<br />
            repartidor@meditrack.com · 1234<br />
            operador@meditrack.com · 1234<br />
            admin@meditrack.com · admin123
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;