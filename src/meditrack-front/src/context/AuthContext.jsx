import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('meditrack_user')) || null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem('meditrack_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('meditrack_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...userData } : userData;
      localStorage.setItem('meditrack_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
