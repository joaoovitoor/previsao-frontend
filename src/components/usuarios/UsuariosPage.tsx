'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usuariosService } from '@/services/usuarios.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FormField, FormRow } from '@/components/ui/form-field';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users as UsersIcon, Filter, ArrowUpDown } from 'lucide-react';
import { formatCpf, formatPhone } from '@/lib/utils';
import type { Usuario } from '@/types';

type SortField = 'nome' | 'cpf' | 'role' | 'created_at';
type SortDir = 'asc' | 'desc';

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<'' | 'admin' | 'operador'>('');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
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

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const usuariosFiltrados = useMemo(() => {
    let filtered = [...usuarios];

    if (busca) {
      const search = normalize(busca);
      filtered = filtered.filter(
        (u) =>
          normalize(u.nome || '').includes(search) ||
          normalize(u.email || '').includes(search) ||
          u.cpf?.includes(search.replace(/\D/g, '')),
      );
    }

    if (filtroRole) {
      filtered = filtered.filter((u) => u.role === filtroRole);
    }

    filtered.sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [usuarios, busca, filtroRole, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

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
      telefone: u.telefone ? formatPhoneInput(u.telefone) : '',
      cpf: formatCpfInput(u.cpf),
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

  const capitalize = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cpf) {
      toast.error('Nome e CPF são obrigatórios');
      return;
    }

    try {
      const payload: any = {
        nome: capitalize(form.nome.trim()),
        email: form.email?.trim().toLowerCase() || undefined,
        telefone: form.telefone?.replace(/\D/g, '') || undefined,
        cpf: form.cpf.replace(/\D/g, ''),
        role: form.role,
      };

      if (editando) {
        if (form.senha) {
          if (form.senha.length < 6) {
            toast.error('Senha deve ter no mínimo 6 caracteres');
            return;
          }
          payload.senha = form.senha;
        }
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

  const sortableHeader = (label: string, field: SortField) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer select-none"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-accent' : 'text-gray-300'}`} />
    </button>
  );

  const columns: Column<Usuario>[] = [
    {
      key: 'nome', header: sortableHeader('Nome', 'nome'),
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">{u.nome?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <span className="font-medium text-gray-900 block truncate">{capitalize(u.nome)}</span>
            {u.email && <span className="text-xs text-gray-400 block truncate">{u.email.toLowerCase()}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'telefone', header: 'Telefone',
      render: (u) => <span className="text-gray-500">{u.telefone ? formatPhone(u.telefone) : '—'}</span>,
    },
    {
      key: 'cpf', header: sortableHeader('CPF', 'cpf'),
      render: (u) => <span className="font-mono text-xs text-gray-600">{formatCpf(u.cpf)}</span>,
    },
    {
      key: 'role', header: sortableHeader('Perfil', 'role'), align: 'center',
      render: (u) => (
        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
          {u.role === 'admin' ? 'Administrador' : 'Operador'}
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

  const totalAdmin = usuarios.filter((u) => u.role === 'admin').length;
  const totalOperador = usuarios.filter((u) => u.role === 'operador').length;

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

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          containerClassName="flex-1"
          placeholder="Buscar por nome, email ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            variant={filtroRole === 'admin' ? 'default' : 'outline'}
            onClick={() => setFiltroRole(filtroRole === 'admin' ? '' : 'admin')}
            className="gap-2"
            size="sm"
          >
            <Filter className="h-3.5 w-3.5" />
            Admin ({totalAdmin})
          </Button>
          <Button
            variant={filtroRole === 'operador' ? 'default' : 'outline'}
            onClick={() => setFiltroRole(filtroRole === 'operador' ? '' : 'operador')}
            className="gap-2"
            size="sm"
          >
            <Filter className="h-3.5 w-3.5" />
            Operador ({totalOperador})
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={usuariosFiltrados}
        loading={loading}
        emptyIcon={UsersIcon}
        emptyMessage={busca || filtroRole ? 'Nenhum usuário encontrado com os filtros aplicados' : 'Nenhum usuário cadastrado'}
        keyExtractor={(u) => u.id}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4 mt-4">
            <FormField label="Nome completo *">
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: João da Silva"
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
            <FormField label="CPF *">
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: formatCpfInput(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
                disabled={!!editando}
              />
            </FormField>
            <FormField label={editando ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}>
              <Input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                placeholder={editando ? 'Deixe vazio para manter a atual' : 'Mínimo 6 caracteres'}
              />
            </FormField>
            <FormField label="Perfil *">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </FormField>
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
