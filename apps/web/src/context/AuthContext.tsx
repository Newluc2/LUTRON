import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserDto } from '@lutron/shared';
import { api } from '../lib/api';

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('lutron_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      localStorage.removeItem('lutron_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { accessToken, user: loggedUser } = await api.login(email, password);
    localStorage.setItem('lutron_token', accessToken);
    setUser(loggedUser);
  };

  const logout = () => {
    localStorage.removeItem('lutron_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
