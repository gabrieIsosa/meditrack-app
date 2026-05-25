import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  logout as apiLogout,
  getNotificaciones,
  getNotificacionesUnreadCount,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas
} from '../services/api';
import logo from '../assets/logo.png';
import ModalHistorialNotificaciones from './ModalHistorialNotificaciones';

function Navbar({ publicMode = false, buttonText, buttonRoute }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const countData = await getNotificacionesUnreadCount();
      setUnreadCount(countData.cantidad);
    } catch (error) {
      console.error("Error al obtener conteo de notificaciones:", error);
    }
  };

  const fetchNotificationList = async () => {
    if (!user) return;
    try {
      const data = await getNotificaciones();
      setNotifications(data);
    } catch (error) {
      console.error("Error al obtener listado de notificaciones:", error);
    }
  };

  // Consultar el conteo de no leídas una sola vez al iniciar sesión o cargar la página (cero consumo en reposo)
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Cargar el listado detallado únicamente cuando el usuario despliega la campanita o abre el modal de historial
  useEffect(() => {
    if (user && (isOpen || showHistoryModal)) {
      fetchNotificationList();
    }
  }, [user, isOpen, showHistoryModal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await marcarNotificacionLeida(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await marcarTodasNotificacionesLeidas();
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('T');
      if (parts.length < 2) return dateStr;
      const dateParts = parts[0].split('-');
      const timeParts = parts[1].split(':');
      return `${dateParts[2]}/${dateParts[1]} ${timeParts[0]}:${timeParts[1]}`;
    } catch {
      return dateStr;
    }
  };

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
                  color: 'var(--text-black)'
                }}>
                  {user.nombre}
                </span>

                <span className={`badge badge-${user.role}`} style={{ fontSize: '10px' }}>
                  {user.role}
                </span>
              </div>
            )}

            <div className="notification-bell-container" onClick={() => setIsOpen(!isOpen)} ref={dropdownRef} style={{ marginLeft: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-black)' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <div className="notification-badge">
                  {unreadCount}
                </div>
              )}

              {isOpen && (
                <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="notification-header">
                    <h3>Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button className="notification-mark-all-btn" onClick={handleMarkAllAsRead}>
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-gray)', opacity: 0.6 }}>
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span className="notification-empty-text">No tenés notificaciones</span>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${!notif.leido ? 'unread' : ''}`}>
                          <div className="notification-item-header">
                            <span className="notification-item-title">{notif.titulo}</span>
                            <span className="notification-item-time">{formatFriendlyDate(notif.fechaCreacion)}</span>
                          </div>
                          <div className="notification-item-body">{notif.mensaje}</div>
                          {!notif.leido && (
                            <button className="notification-item-action" onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}>
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowHistoryModal(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--secondary-blue)',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        width: '100%',
                        padding: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Ver Historial Completo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showHistoryModal && (
              <ModalHistorialNotificaciones
                notifications={notifications}
                alCerrar={() => setShowHistoryModal(false)}
                alMarcarLeida={handleMarkAsRead}
              />
            )}

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ marginLeft: '15px' }}
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