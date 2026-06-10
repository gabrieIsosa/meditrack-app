import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadScript } from '@react-google-maps/api';
import ProtectedLayout from './components/ProtectedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Home/Login';
import Home from './pages/Home/Home';
import NuevoEnvio from './pages/Envio/NuevoEnvio';
import DetalleEnvio from './pages/Envio/DetalleEnvio';
import EditarEnvio from './pages/Envio/EditarEnvio';
import Usuarios from './pages/Usuarios/Usuarios';
import NuevoUsuario from './pages/Usuarios/NuevoUsuario';
import EditarUsuario from './pages/Usuarios/EditarUsuario';
import MainMenu from './pages/Home/MainMenu';
import ForgotPassword from './pages/Home/ForgotPassword';
import Medicamentos from './pages/Medicamentos/Medicamentos';
import EditarMedicamento from './pages/Medicamentos/EditarMedicamento';
import NuevoMedicamento from './pages/Medicamentos/NuevoMedicamento';
import TrackingPublico from './pages/Envio/TrackingPublico';
import Rutas from './pages/Rutas/Rutas';
import NuevaRuta from './pages/Rutas/NuevaRuta';
import DetalleRuta from './pages/Rutas/DetalleRuta';
import Viajes from './pages/Viajes/Viajes';
import DetalleViaje from './pages/Viajes/DetalleViaje';
import Clientes from './pages/Clientes/Clientes';
import NuevoCliente from './pages/Clientes/NuevoCliente';
import EditarCliente from './pages/Clientes/EditarCliente';
import Transportes from './pages/Transportes/Transportes';
import Reportes from './pages/Reportes/Reportes';
import DashboardKPI from './pages/Reportes/DashboardKPI';
import Mails from './pages/Mails/Mails';
import ReclamoCambioDatos from './pages/ReclamoCambioDato/ReclamoCambioDatos';
import Repartidores from './pages/Usuarios/Repartidores';



function App() {
  return (
    <LoadScript
      googleMapsApiKey={ import.meta.env.VITE_GOOGLE_MAPS_API_KEY }
      libraries={["places"]}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TrackingPublico />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reclamo-cambio-datos" element={ <ReclamoCambioDatos />}/>
            <Route element={<ProtectedLayout />}>
              <Route path="/menu" element={<MainMenu />} />
              <Route path="/envios" element={<Home />} />
              <Route path="/detalle/:id" element={<DetalleEnvio />} />
              <Route path="/envios/nuevo" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><NuevoEnvio /></ProtectedRoute>} />
              <Route path="/envios/editar/:id" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><EditarEnvio /></ProtectedRoute>} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/usuarios/nuevo" element={<NuevoUsuario />} />
              <Route path="/usuarios/editar/:id" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><EditarUsuario /></ProtectedRoute>} />
              <Route path="/rutas" element={<Rutas />} />
              <Route path="/rutas/nueva" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><NuevaRuta /></ProtectedRoute>} />
              <Route path="/rutas/:id" element={<DetalleRuta />} />
              <Route path="/medicamentos" element={<Medicamentos />} />
              <Route path="/medicamentos/editar/:id" element={<EditarMedicamento />} />
              <Route path="/medicamentos/nuevoMedicamento" element={<NuevoMedicamento />} />
              <Route path="/viajes" element={<ProtectedRoute roles={['REPARTIDOR']}><Viajes /></ProtectedRoute>} />
              <Route path="/viajes/detalle" element={<ProtectedRoute roles={['REPARTIDOR']}><DetalleViaje /></ProtectedRoute>} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/nuevo" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><NuevoCliente /></ProtectedRoute>} />
              <Route path="/clientes/editar/:id" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}> <EditarCliente /></ProtectedRoute>} />
              <Route path="/reportes" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><Reportes /></ProtectedRoute>} />
              <Route path="/kpis" element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><DashboardKPI /></ProtectedRoute>} />
              <Route path="/transportes" element={<ProtectedRoute roles={['ADMINISTRADOR']}><Transportes /></ProtectedRoute>} />
              <Route path="/mails" element={ <ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><Mails /></ProtectedRoute> }/>
              <Route path="/repartidor" element={ <ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><Repartidores /></ProtectedRoute> }/>
            </Route>
            <Route path="*" element={<Navigate to="/menu" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LoadScript>

  );
}

export default App;