import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as apiLogout } from '../services/api';
import logo from '../assets/logo.png';

function Navbar({ publicMode = false, buttonText, buttonRoute }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      logout();
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div
        className="navbar-brand"
        onClick={() => navigate('/menu')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <img
          src={logo}
          alt="MediTrack Logo"
          style={{
            height: '35px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
        <span style={{ fontWeight: 'bold', fontSize: '20px' }}>
          MediTrack
        </span>
      </div>

      <div className="navbar-user-section">
        {!user ? (
          <button
            className="btn btn-secondary"
            onClick={() => navigate(buttonRoute || '/login')}
            style={{ 
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              cursor: 'pointer',
              marginRight: '10px' }}
          >
            {buttonText || 'EMPLEADOS'}
          </button>
        ) : (
          <>
            {!publicMode && (
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '13px', fontWeight: 'bold', display: 'block',
                  color: 'var(--text black)'
                }}>
                  {user.nombre}
                </span>

                <span className={`badge badge-${user.role}`} style={{ fontSize: '10px' }}>
                  {user.role}
                </span>
              </div>
            )}

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ marginLeft: '10px' }}
            >
              SALIR
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;