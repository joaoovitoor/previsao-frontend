'use client';

import { useState, useEffect, useCallback } from 'react';
import { usuariosService } from '@/services/usuarios.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FormField, FormRow } from '@/components/ui/form-field';
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

  const columns: Column<Usuario>[] = [
    {
      key: 'nome', header: 'Nome',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">{u.nome?.charAt(0)?.toUpperCase()}</span>
          </div>
          <span className="font-medium text-gray-900">{u.nome}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => <span className="text-gray-500">{u.email || '—'}</span> },
    { key: 'telefone', header: 'Telefone', render: (u) => <span className="text-gray-500">{u.telefone ? formatPhone(u.telefone) : '—'}</span> },
    { key: 'cpf', header: 'CPF', render: (u) => <span className="font-mono text-xs text-gray-600">{formatCpf(u.cpf)}</span> },
    {
      key: 'role', header: 'Perfil', align: 'center',
      render: (u) => (
        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
          {u.role === 'admin' ? 'Admin' : 'Operador'}
        </Badge>
      ),
    },
    {
      key: 'acoes', header: 'Ações', align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => abrirEditar(u)} className="h-8 w-8 text-accent hover:text-accent-dark hover:bg-blue-50">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => excluir(u)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários"
        subtitle={`${usuarios.length} usuários cadastrados`}
        actions={
          <Button onClick={abrirNovo} className="gap-2 shadow-md bg-accent hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={usuarios}
        loading={loading}
        emptyIcon={UsersIcon}
        emptyMessage="Nenhum usuário encontrado"
        keyExtractor={(u) => u.id}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4 mt-4">
            <FormField label="Nome">
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </FormField>
            <FormRow>
              <FormField label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </FormField>
              <FormField label="Telefone">
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: formatPhoneInput(e.target.value) })}
                  placeholder="(11) 99999-9999"
                />
              </FormField>
            </FormRow>
            <FormField label="CPF">
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: formatCpfInput(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </FormField>
            <FormRow>
              <FormField label={editando ? 'Nova Senha (opcional)' : 'Senha'}>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder={editando ? 'Deixe vazio para manter' : 'Mínimo 6 caracteres'}
                />
              </FormField>
              <FormField label="Perfil">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </FormField>
            </FormRow>
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
