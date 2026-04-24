import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import NuevoEnvio from './pages/NuevoEnvio';
import DetalleEnvio from './pages/DetalleEnvio';
import EditarEnvio from './pages/EditarEnvio';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/"            element={<Home />} />
            <Route path="/detalle/:id" element={<DetalleEnvio />} />
            <Route path="/nuevo"       element={<ProtectedRoute roles={['SUPERVISOR']}><NuevoEnvio /></ProtectedRoute>} />
            <Route path="/editar/:id"  element={<ProtectedRoute roles={['SUPERVISOR']}><EditarEnvio /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
