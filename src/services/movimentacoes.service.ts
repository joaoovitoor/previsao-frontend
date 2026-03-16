import { api } from './api';
import type { Movimentacao } from '@/types';

export const movimentacoesService = {
  list: (params?: { produto_id?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.produto_id) query.set('produto', params.produto_id);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<Movimentacao[]>(`/movimentacoes${qs ? `?${qs}` : ''}`);
  },

  create: (data: { produto_id: string; tipo: 'entrada' | 'saida'; quantidade: number }) =>
    api.post<Movimentacao>('/movimentacoes', data),

  delete: (id: string) => api.delete(`/movimentacoes/${id}`),
};
