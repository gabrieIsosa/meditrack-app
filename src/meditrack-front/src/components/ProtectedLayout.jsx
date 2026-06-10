import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { ChevronLeft, Home, Package, Users, NotepadText } from 'lucide-react';

function ProtectedLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  let mainTabPath = '/envios';
  let mainTabLabel = 'Envíos';
  let MainTabIcon = Package;

  if (user?.role === 'ADMINISTRADOR') {
    mainTabPath = '/usuarios';
    mainTabLabel = 'Usuarios';
    MainTabIcon = Users;
  } else if (user?.role === 'REPARTIDOR') {
    mainTabPath = '/viajes';
    mainTabLabel = 'Asignaciones';
    MainTabIcon = NotepadText;
  }

  return (
    <>
      <Navbar />
      <div className="main-content-wrapper">
        <Outlet />
      </div>

      <div className="mobile-bottom-nav">
        <button className="mobile-nav-item" onClick={() => navigate(-1)} title="Atrás">
          <ChevronLeft size={24} />
          <span>Volver</span>
        </button>
        <button className="mobile-nav-item" onClick={() => navigate('/menu')} title="Menú">
          <Home size={24} />
          <span>Menú</span>
        </button>
        <button 
          className={`mobile-nav-item ${location.pathname === mainTabPath ? 'active' : ''}`} 
          onClick={() => navigate(mainTabPath)} 
          title={mainTabLabel}
        >
          <MainTabIcon size={24} />
          <span>{mainTabLabel}</span>
        </button>
      </div>
    </>
  );
}

export default ProtectedLayout;
