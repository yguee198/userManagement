import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        // Fetch permissions
        try {
          const perms = await authService.getPermissions();
          setPermissions(perms.user_permissions || []);
        } catch (e) {
          // If permissions endpoint fails, derive from role
          if (userData.role === 'admin' || userData.is_staff) {
            setPermissions(['can_manage_users', 'can_view_users', 'can_edit_users', 'can_delete_users']);
          } else if (userData.role === 'user') {
            setPermissions(['can_view_users']);
          }
        }
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUser(data.user);
    // Set permissions from login response
    if (data.user.role === 'admin' || data.user.is_staff) {
      setPermissions(['can_manage_users', 'can_view_users', 'can_edit_users', 'can_delete_users']);
    } else if (data.user.role === 'user') {
      setPermissions(['can_view_users']);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API fails
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setPermissions([]);
  };

  const updateUser = async (data) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  // Permission helpers
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;
  const isGuest = user?.role === 'guest';

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      login,
      register,
      logout,
      updateUser,
      loading,
      hasPermission,
      isAdmin,
      isGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};