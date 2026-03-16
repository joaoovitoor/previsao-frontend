import { api } from './api';
import type { AuthResponse, Usuario } from '@/types';

export const authService = {
  login: (cpf: string, senha: string) =>
    api.post<AuthResponse>('/auth/login', { cpf, senha }),

  me: () => api.get<Usuario>('/auth/me'),
};
