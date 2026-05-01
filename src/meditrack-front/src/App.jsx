import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import NuevoEnvio from './pages/NuevoEnvio';
import DetalleEnvio from './pages/DetalleEnvio';
import EditarEnvio from './pages/EditarEnvio';
import Usuarios from './pages/Usuarios';
import NuevoUsuario from './pages/NuevoUsuario';
import EditarUsuario from './pages/EditarUsuario';
import MainMenu from './pages/MainMenu';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<MainMenu />} />
            <Route path="/envios" element={<Home />} />
            <Route path="/detalle/:id" element={<DetalleEnvio />} />
            <Route path="/envios/nuevo" element={<ProtectedRoute roles={['SUPERVISOR','ADMINISTRADOR']}><NuevoEnvio /></ProtectedRoute>} />
            <Route path="/envios/editar/:id" element={<ProtectedRoute roles={['SUPERVISOR','ADMINISTRADOR']}><EditarEnvio /></ProtectedRoute>} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/usuarios/nuevo" element={<NuevoUsuario />} />
            <Route path="/usuarios/editar/:id" element={<ProtectedRoute roles={['SUPERVISOR','ADMINISTRADOR']}><EditarUsuario /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;