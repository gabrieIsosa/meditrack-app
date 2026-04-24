import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as apiLogout } from '../services/api';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await apiLogout();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="navbar">
      <span className="navbar-brand">MediTrack</span>
      <div className="navbar-user">
        <span>{user.nombre}</span>
        <span className={`badge-role badge-role-${user.role.toLowerCase()}`}>{user.role}</span>
        <button
          className="btn btn-secondary"
          onClick={handleLogout}
        >
          SALIR
        </button>
      </div>
    </div>
  );
}

export default Navbar;
