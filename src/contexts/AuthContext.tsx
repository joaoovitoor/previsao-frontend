'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import type { Usuario } from '@/types';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (cpf: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .me()
      .then((u) => setUser(u))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (cpf: string, senha: string) => {
    const res = await authService.login(cpf, senha);
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.usuario));
    try {
      const profile = await authService.me();
      setUser(profile);
    } catch {
      logout();
      throw new Error('Erro ao carregar perfil. Tente novamente.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
