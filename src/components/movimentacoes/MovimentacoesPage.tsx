'use client';

import { useState, useEffect, useCallback } from 'react';
import { produtosService } from '@/services/produtos.service';
import { movimentacoesService } from '@/services/movimentacoes.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowUpCircle, ArrowDownCircle,
  Search, Package, Send,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Produto, Movimentacao } from '@/types';

export function MovimentacoesPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const buscarProdutos = useCallback(async () => {
    if (!buscaProduto) {
      setProdutos([]);
      return;
    }
    try {
      const data = await produtosService.list({ nome: buscaProduto, limit: 10 });
      setProdutos(data);
      setShowDropdown(true);
    } catch {
      /* ignore */
    }
  }, [buscaProduto]);

  useEffect(() => {
    const timer = setTimeout(buscarProdutos, 300);
    return () => clearTimeout(timer);
  }, [buscarProdutos]);

  const carregarRecentes = useCallback(async () => {
    try {
      const data = await movimentacoesService.list({ limit: 20 });
      setMovimentacoes(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    carregarRecentes();
  }, [carregarRecentes]);

  const selecionarProduto = (p: Produto) => {
    setProdutoSelecionado(p);
    setBuscaProduto(`${p.codigo} - ${p.nome}`);
    setShowDropdown(false);
  };

  const registrar = async () => {
    if (!produtoSelecionado) {
      toast.error('Selecione um produto');
      return;
    }
    const qtd = parseInt(quantidade);
    if (!qtd || qtd <= 0) {
      toast.error('Quantidade inválida');
      return;
    }

    setSaving(true);
    try {
      const result = await movimentacoesService.create({
        produto_id: produtoSelecionado.id,
        tipo,
        quantidade: qtd,
      });
      toast.success(
        `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!${result.saldo_atual != null ? ` Saldo: ${result.saldo_atual}` : ''}`,
      );
      setProdutoSelecionado(null);
      setBuscaProduto('');
      setQuantidade('');
      carregarRecentes();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar');
    } finally {
      setSaving(false);
    }
  };

  const bgColor = tipo === 'entrada'
    ? 'from-emerald-500 to-emerald-700'
    : 'from-red-500 to-red-700';

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Movimentação de Estoque</h1>
        <p className="text-sm text-gray-500 mt-1">Registrar entradas e saídas</p>
      </div>

      {/* Formulário com fundo colorido como o antigo */}
      <div className={`rounded-2xl bg-gradient-to-br ${bgColor} p-1 shadow-lg transition-all duration-500`}>
        <div className="bg-white rounded-xl p-6">
          {/* Tipo - botões grandes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Movimentação</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl text-lg font-bold transition-all cursor-pointer border-2 ${
                  tipo === 'entrada'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ArrowUpCircle className={`h-8 w-8 ${tipo === 'entrada' ? 'text-white' : 'text-emerald-500'}`} />
                ENTRADA
              </button>
              <button
                type="button"
                onClick={() => setTipo('saida')}
                className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl text-lg font-bold transition-all cursor-pointer border-2 ${
                  tipo === 'saida'
                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
              >
                <ArrowDownCircle className={`h-8 w-8 ${tipo === 'saida' ? 'text-white' : 'text-red-500'}`} />
                SAÍDA
              </button>
            </div>
          </div>

          {/* Produto */}
          <div className="relative mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produto por nome ou código..."
                value={buscaProduto}
                onChange={(e) => {
                  setBuscaProduto(e.target.value);
                  setProdutoSelecionado(null);
                }}
                onFocus={() => produtos.length > 0 && setShowDropdown(true)}
                className="pl-10 h-11"
              />
            </div>

            {showDropdown && produtos.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border shadow-xl max-h-52 overflow-y-auto">
                {produtos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selecionarProduto(p)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-sm transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <Package className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="font-mono text-xs text-gray-500 shrink-0">{p.codigo}</span>
                    <span className="font-medium truncate">{p.nome}</span>
                    <span className="ml-auto text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full bg-gray-100">
                      Saldo: {p.saldo}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {produtoSelecionado && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 border ${
              tipo === 'entrada'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <Package className={`h-5 w-5 shrink-0 ${tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {produtoSelecionado.codigo} - {produtoSelecionado.nome}
                </p>
                <p className="text-xs text-gray-600">Saldo atual: <span className="font-bold">{produtoSelecionado.saldo}</span></p>
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <Input
              type="number"
              placeholder="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              min={1}
              className="h-12 text-xl font-bold text-center"
            />
          </div>

          <Button
            onClick={registrar}
            disabled={saving}
            className={`w-full h-12 text-base font-bold gap-2 shadow-md ${
              tipo === 'entrada'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <Send className="h-5 w-5" />
            {saving ? 'Registrando...' : `Registrar ${tipo === 'entrada' ? 'Entrada' : 'Saída'}`}
          </Button>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Últimas Movimentações</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {movimentacoes.length === 0 ? (
            <p className="text-sm text-gray-400 py-12 text-center">Nenhuma movimentação recente</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-white">
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold">Produto</th>
                  <th className="text-center px-4 py-3 font-semibold">Qtd</th>
                  <th className="text-right px-4 py-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((mov, i) => (
                  <tr key={mov.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {mov.tipo === 'entrada' ? (
                          <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="capitalize font-medium">{mov.tipo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]">{mov.produto_nome}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={mov.tipo === 'entrada' ? 'success' : 'danger'}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatDate(mov.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
