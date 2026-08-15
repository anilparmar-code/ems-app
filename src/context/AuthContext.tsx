import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '@/services/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        if (storedToken) {
          setToken(storedToken);
          // Set authorization header manually for this bootstrap request in case interceptor hasn't run yet
          const response = await api.get('/user', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
        }
      } catch (e: any) {
        //console.error('Boot auth check failed:', e);
        // Only delete token if it was explicitly unauthorized (401 or 403)
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          await SecureStore.deleteItemAsync('auth_token');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = response.data;
    await SecureStore.setItemAsync('auth_token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Opt: request backend to revoke token, but always clear locally
      await api.post('/auth/logout').catch(() => {});
    } catch (e) {
      console.warn('Backend logout failed, clearing local session anyway', e);
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
