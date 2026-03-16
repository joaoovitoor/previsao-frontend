'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usuariosService } from '@/services/usuarios.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AlterarSenhaPage() {
  const { user } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const senhaValida = novaSenha.length >= 6;
  const senhasConferem = novaSenha === confirmar && confirmar.length > 0;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!senhaAtual) {
      toast.error('Informe a senha atual');
      return;
    }
    if (!senhaValida) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (!senhasConferem) {
      toast.error('As senhas não conferem');
      return;
    }

    setSaving(true);
    try {
      await usuariosService.changePassword(senhaAtual, novaSenha);
      setSuccess(true);
      toast.success('Senha alterada com sucesso');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Senha alterada!</h2>
          <p className="text-sm text-gray-500 mb-6">Sua senha foi atualizada com sucesso.</p>
          <Button asChild variant="outline">
            <Link href="/minha-conta">Voltar para Minha Conta</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/minha-conta" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Alterar Senha</h2>
            <p className="text-xs text-gray-400">Escolha uma senha forte com no mínimo 6 caracteres</p>
          </div>
        </div>

        <form onSubmit={salvar} className="space-y-4">
          <FormField label="Senha Atual">
            <div className="relative">
              <Input
                type={showAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowAtual(!showAtual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Nova Senha">
            <div className="relative">
              <Input
                type={showNova ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNova(!showNova)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {novaSenha.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      novaSenha.length < 6 ? 'w-1/3 bg-red-400' : novaSenha.length < 10 ? 'w-2/3 bg-amber-400' : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${novaSenha.length < 6 ? 'text-red-500' : novaSenha.length < 10 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {novaSenha.length < 6 ? 'Fraca' : novaSenha.length < 10 ? 'Média' : 'Forte'}
                </span>
              </div>
            )}
          </FormField>

          <FormField label="Confirmar Nova Senha">
            <div className="relative">
              <Input
                type={showConfirmar ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmar.length > 0 && (
              <p className={`text-xs mt-1 ${senhasConferem ? 'text-emerald-600' : 'text-red-500'}`}>
                {senhasConferem ? '✓ As senhas conferem' : '✗ As senhas não conferem'}
              </p>
            )}
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving || !senhaValida || !senhasConferem}
              className="w-full h-11 bg-surface hover:bg-gray-700 text-base font-semibold"
            >
              {saving ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
