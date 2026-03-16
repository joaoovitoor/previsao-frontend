'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usuariosService } from '@/services/usuarios.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormRow } from '@/components/ui/form-field';
import { toast } from 'sonner';
import { User, Mail, Phone, CreditCard, Shield, Pencil, X, Check } from 'lucide-react';
import { formatCpf, formatPhone } from '@/lib/utils';
import Link from 'next/link';

export default function MinhaContaPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
  });

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const startEditing = () => {
    setForm({
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      await usuariosService.updateMe({
        nome: form.nome,
        email: form.email || undefined,
        telefone: form.telefone?.replace(/\D/g, '') || undefined,
      });
      toast.success('Dados atualizados');
      setEditing(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user.nome?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{user.nome}</h2>
            <p className="text-sm text-gray-500 truncate">{user.email || formatCpf(user.cpf)}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">
              <Shield className="h-3 w-3" />
              {user.role === 'admin' ? 'Administrador' : 'Operador'}
            </span>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5 shrink-0">
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Dados */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Dados Pessoais</h3>
          {editing && (
            <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={salvar} className="space-y-4">
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
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={cancelEditing}>
                Cancelar
              </Button>
              <Button type="submit" variant="success" disabled={saving} className="gap-1.5">
                <Check className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <ProfileRow icon={User} label="Nome" value={user.nome} />
            <ProfileRow icon={Mail} label="Email" value={user.email || '—'} />
            <ProfileRow icon={Phone} label="Telefone" value={user.telefone ? formatPhone(user.telefone) : '—'} />
            <ProfileRow icon={CreditCard} label="CPF" value={formatCpf(user.cpf)} />
          </div>
        )}
      </div>

      {/* Segurança */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Segurança</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Senha</p>
            <p className="text-xs text-gray-400">Altere sua senha de acesso</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/minha-conta/senha">Alterar Senha</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <Icon className="h-4 w-4 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}
