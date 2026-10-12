import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, removeToken, getToken } from '../lib/api.js';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  timezone: string;
  theme: string;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  settings?: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    soundEnabled: boolean;
    browserNotifications: boolean;
    emailReminders: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = getToken();
        // Even if no token in localStorage, try cookie-based restore
        const res = await api.get<User>('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        // Not authenticated
        removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/register', { email, password, name });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      removeToken();
      setUser(null);
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
