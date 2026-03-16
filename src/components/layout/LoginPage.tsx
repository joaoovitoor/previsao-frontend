'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Package, Lock } from 'lucide-react';

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
      {/* Left panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gray-800 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
        <div className="relative z-10 text-center px-12">
          <div className="h-20 w-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/10">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Previsão Presilhas
          </h2>
          <p className="text-lg text-gray-400 max-w-md mx-auto">
            Sistema de controle de estoque integrado
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 text-gray-500 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-white/80">3500+</div>
              <div className="mt-1">Produtos</div>
            </div>
            <div className="h-8 w-px bg-gray-600" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white/80">126k+</div>
              <div className="mt-1">Movimentações</div>
            </div>
            <div className="h-8 w-px bg-gray-600" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white/80">10+</div>
              <div className="mt-1">Anos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <div className="h-14 w-14 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Previsão Presilhas</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 bg-gray-800 rounded-xl flex items-center justify-center">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Entrar</h2>
                <p className="text-sm text-gray-500">Acesse sua conta</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CPF
                </label>
                <Input
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                  maxLength={14}
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Senha
                </label>
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
                className="w-full h-11 bg-gray-800 hover:bg-gray-900 text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Previsão Presilhas &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
