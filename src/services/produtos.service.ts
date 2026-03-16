import { api } from './api';
import type { Produto } from '@/types';

export const produtosService = {
  list: (params?: { nome?: string; estoqueminimo?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.nome) query.set('nome', params.nome);
    if (params?.estoqueminimo) query.set('estoqueminimo', 'true');
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<Produto[]>(`/produtos${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => api.get<Produto>(`/produtos/${id}`),

  create: (data: { codigo: string; nome: string; estoqueminimo?: number; estoqueideal?: number }) =>
    api.post<Produto>('/produtos', data),

  update: (id: string, data: Partial<Produto>) =>
    api.patch<Produto>(`/produtos/${id}`, data),

  delete: (id: string) => api.delete(`/produtos/${id}`),

  exportCsv: (params?: { nome?: string; estoqueminimo?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.nome) query.set('nome', params.nome);
    if (params?.estoqueminimo) query.set('estoqueminimo', 'true');
    const qs = query.toString();
    return api.download(`/produtos/csv${qs ? `?${qs}` : ''}`);
  },
};
