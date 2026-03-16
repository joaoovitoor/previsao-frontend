'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCpfInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || !senha) {
      toast.error('Preencha CPF e senha');
      return;
    }

    setLoading(true);
    try {
      await login(cpf, senha);
      toast.success('Login realizado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo - branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gray-100 relative items-center justify-center">
        <div className="relative z-10 text-center px-12">
          <Image
            src="/logo_previsao.png"
            alt="Previsão Presilhas"
            width={400}
            height={125}
            className="mx-auto mb-8"
            priority
          />
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Sistema de controle de estoque integrado
          </p>
        </div>
      </div>

      {/* Painel direito - formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="md:hidden text-center mb-8">
            <Image
              src="/logo_previsao.png"
              alt="Previsão Presilhas"
              width={250}
              height={78}
              className="mx-auto mb-2"
              priority
            />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-surface rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Entrar</h2>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">Acesse o sistema de estoque</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                maxLength={14}
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-surface hover:bg-gray-700 text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Previsão Presilhas &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
