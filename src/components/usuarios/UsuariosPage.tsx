'use client';

import { useState, useEffect, useCallback } from 'react';
import { usuariosService } from '@/services/usuarios.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { formatCpf, formatPhone } from '@/lib/utils';
import type { Usuario } from '@/types';

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    senha: '',
    role: 'operador',
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usuariosService.list();
      setUsuarios(data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ nome: '', email: '', telefone: '', cpf: '', senha: '', role: 'operador' });
    setDialogOpen(true);
  };

  const abrirEditar = (u: Usuario) => {
    setEditando(u);
    setForm({
      nome: u.nome,
      email: u.email || '',
      telefone: u.telefone || '',
      cpf: u.cpf,
      senha: '',
      role: u.role,
    });
    setDialogOpen(true);
  };

  const formatCpfInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cpf) {
      toast.error('Nome e CPF são obrigatórios');
      return;
    }

    try {
      const payload: any = {
        nome: form.nome,
        email: form.email || undefined,
        telefone: form.telefone?.replace(/\D/g, '') || undefined,
        cpf: form.cpf.replace(/\D/g, ''),
        role: form.role,
      };

      if (editando) {
        if (form.senha) payload.senha = form.senha;
        await usuariosService.update(editando.id, payload);
        toast.success('Usuário atualizado');
      } else {
        if (!form.senha || form.senha.length < 6) {
          toast.error('Senha deve ter no mínimo 6 caracteres');
          return;
        }
        payload.senha = form.senha;
        await usuariosService.create(payload);
        toast.success('Usuário criado');
      }
      setDialogOpen(false);
      carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  const excluir = async (u: Usuario) => {
    if (!confirm(`Excluir "${u.nome}"?`)) return;
    try {
      await usuariosService.delete(u.id);
      toast.success('Usuário excluído');
      carregar();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">{usuarios.length} usuários cadastrados</p>
        </div>
        <Button onClick={abrirNovo} className="gap-2 shadow-md bg-accent hover:bg-accent-dark">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-white">
                <th className="text-left px-4 py-3 font-semibold text-sm">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Telefone</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">CPF</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Perfil</th>
                <th className="text-right px-4 py-3 font-semibold text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <UsersIcon className="h-8 w-8 text-gray-300" />
                      <span>Nenhum usuário encontrado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-white">{u.nome?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{u.telefone ? formatPhone(u.telefone) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{formatCpf(u.cpf)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? 'Admin' : 'Operador'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => abrirEditar(u)} className="h-8 w-8 text-accent hover:text-accent-dark hover:bg-blue-50">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => excluir(u)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: formatPhoneInput(e.target.value) })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: formatCpfInput(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editando ? 'Nova Senha (opcional)' : 'Senha'}
                </label>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder={editando ? 'Deixe vazio para manter' : 'Mínimo 6 caracteres'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="success">
                {editando ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
