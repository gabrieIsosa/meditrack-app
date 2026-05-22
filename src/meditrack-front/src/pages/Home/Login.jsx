import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin, verify2fa } from '../../services/api';
import Navbar from '../../components/Navbar';
import bg from '../../assets/bg.png';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  if (user) return <Navigate to="/menu" replace />;

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
    <div style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100vw',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box'
    }}>
      <Navbar buttonText="VOLVER" buttonRoute="/tracking" />
      
      <div style={{
          maxWidth: 450, 
          margin: '40px auto', 
          padding: '32px 24px', 
          color: '#111827',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          width: 'calc(100% - 32px)',
          boxSizing: 'border-box'
      }}>
        <h1 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: 8, color:'#00A86B'}}>MediTrack</h1>
        <p style={{ textAlign: 'center', marginBottom: 24, color: '#6b7280' }}>Gestión logística farmacéutica</p>

        <form onSubmit={handleFormSubmit}>
          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Correo electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@meditrack.com"
                  autoFocus
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Contraseña</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '40px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e3a8a', fontWeight: 'bold' }}>Autenticación de Dos Factores</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6' }}>
                  Código: <span style={{ fontWeight: '900', fontSize: '16px' }}>{tempData?.mockCode}</span>
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ marginBottom: '10px', display: 'block', textAlign: 'center' }}>Ingresa el código</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }} onPaste={handleOtpPaste}>
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={data}
                      ref={(el) => (inputRefs.current[index] = el)}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      style={{ width: '40px', height: '45px', textAlign: 'center', fontSize: '20px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none' }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p style={{ color: '#DC2626', marginBottom: 16, textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ 
              width: '100%', padding: 12, background: '#00A86B', color: '#fff', border: 'none', 
              borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' 
          }}>
            {loading ? 'PROCESANDO...' : (step === 1 ? 'INGRESAR' : 'VERIFICAR Y ENTRAR')}
          </button>

          {step === 2 && (
            <button type="button" onClick={() => { setStep(1); setError(''); setOtp(new Array(6).fill("")); }}
              style={{ marginTop: '15px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', width: '100%' }}>
              ← Volver al inicio
            </button>
          )}

          {step === 1 && (
            <button type="button" onClick={() => navigate('/forgot-password')}
              style={{ marginTop: '15px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', width: '100%' }}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>

        {step === 1 && (
          <div style={{ marginTop: 32, fontSize: '12px', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: 16, textAlign: 'center' }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Usuarios de prueba:</strong>
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