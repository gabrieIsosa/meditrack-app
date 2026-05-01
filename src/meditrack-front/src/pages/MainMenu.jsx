import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Users, 
  Truck, 
  ShieldAlert,
  TriangleRight,
  Pill,
  Hospital,
  NotepadText,
  History
} from 'lucide-react';

const MainMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;

  const menuSections = [
    {
      title: "Logística y Envíos",
      rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR'],
      items: [
        { label: "Panel de Envíos", icon: <Package size={32} />, path: "/envios", color: "#3b82f6" },
        { label: "Rutas Activas", icon: <Truck size={32} />, path: "/rutas", color: "#3b82f6" },
      ]
    },
    {
      title: "Logística Farmacéutica",
      rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR'],
      items: [
        { label: "Medicamentos", icon: <Pill size={32} />, path: "/medicamentos", color: "#00A86B" },
        { label: "Clientes", icon: <Hospital size={32} />, path: "/farmacias", color: "#00A86B" },
      ]
    },
    {
      title: "Administración de Usuarios",
      rolesPermitidos: ['ADMINISTRADOR'],
      items: [
        { label: "Usuarios", icon: <Users size={32} />, path: "/usuarios", color: "#6b7280" },
      ]
    },
    {
      title: "Reportes",
      rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR'],
      items: [
        { label: "Incidencias", icon: <ShieldAlert size={32} />, path: "/incidencias", color: "#4338CA" },
        { label: "Volumen", icon: <TriangleRight size={32} />, path: "/volumen", color: "#4338CA" },
      ]
    },
    {
      title: "Repartidores y Transportes",
      rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR', 'REPARTIDOR'],
      items: [
        { label: "Repartidor", icon: <Users size={32} />, path: "/repartidor", color: "#ec7f35" },
        { label: "Asignaciones", icon: <NotepadText size={32} />, path: "/asignaciones-repartidor", color: "#ec7f35" },
        { label: "Historial", icon: <History size={32} />, path: "/historial-repartidor", color: "#ec7f35" },
        { label: "Transportes", icon: <Truck size={32} />, path: "/transportes", color: "#ec7f35" },
      ]
    }
  ];

  const filteredSections = menuSections.filter(section => 
    section.rolesPermitidos.includes(userRole)
  );

  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f9fafb', 
      minHeight: '100vh',
      fontFamily: 'inherit'
    }}>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '40px', 
        alignItems: 'flex-start'
      }}>
        {filteredSections.map((section, idx) => (
          <div key={idx} style={{ flex: '0 1 auto', marginBottom: '20px' }}>
            <h2 style={{ 
              fontSize: '12px', 
              fontWeight: '800', 
              color: '#374151', 
              textTransform: 'uppercase', 
              marginBottom: '20px',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '4px', height: '16px', backgroundColor: '#00A86B', borderRadius: '2px' }} />
              {section.title}
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, 125px)', 
              gap: '12px',
              width: section.items.length > 1 ? '262px' : '125px'
            }}>
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '125px',
                    height: '125px',
                    backgroundColor: item.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    padding: '15px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>{item.icon}</div>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    textAlign: 'center', 
                    lineHeight: '1.2',
                    textTransform: 'uppercase'
                  }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;