import { api } from './api';
import type { Usuario } from '@/types';

export const usuariosService = {
  list: () => api.get<Usuario[]>('/usuarios'),

  getById: (id: string) => api.get<Usuario>(`/usuarios/${id}`),

  create: (data: {
    nome: string;
    email?: string;
    telefone?: string;
    cpf: string;
    senha: string;
    role?: string;
  }) => api.post<Usuario>('/usuarios', data),

  update: (id: string, data: Partial<Usuario & { senha?: string }>) =>
    api.patch<Usuario>(`/usuarios/${id}`, data),

  delete: (id: string) => api.delete(`/usuarios/${id}`),
};
