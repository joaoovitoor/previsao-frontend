'use client';

import { useState, useEffect, useCallback } from 'react';
import { produtosService } from '@/services/produtos.service';
import { movimentacoesService } from '@/services/movimentacoes.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowUpCircle, ArrowDownCircle, Plus,
  Search, Package,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Movimentação de Estoque</h1>
        <p className="text-sm text-gray-500 mt-1">Registrar entradas e saídas</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="relative">
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
              className="pl-10"
            />
          </div>

          {showDropdown && produtos.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border shadow-lg max-h-48 overflow-y-auto">
              {produtos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selecionarProduto(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-sm transition-colors cursor-pointer"
                >
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-xs text-gray-500">{p.codigo}</span>
                  <span className="font-medium">{p.nome}</span>
                  <span className="ml-auto text-xs text-gray-400">Saldo: {p.saldo}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tipo === 'entrada' ? 'success' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setTipo('entrada')}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Entrada
              </Button>
              <Button
                type="button"
                variant={tipo === 'saida' ? 'destructive' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setTipo('saida')}
              >
                <ArrowDownCircle className="h-4 w-4" />
                Saída
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <Input
              type="number"
              placeholder="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              min={1}
            />
          </div>
        </div>

        <Button onClick={registrar} disabled={saving} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          {saving ? 'Registrando...' : 'Registrar Movimentação'}
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Últimas Movimentações</h2>
        <div className="bg-white rounded-xl border divide-y">
          {movimentacoes.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nenhuma movimentação recente</p>
          ) : (
            movimentacoes.map((mov) => (
              <div key={mov.id} className="flex items-center gap-4 px-4 py-3">
                {mov.tipo === 'entrada' ? (
                  <ArrowUpCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mov.produto_nome}</p>
                  <p className="text-xs text-gray-400">{formatDate(mov.created_at)}</p>
                </div>
                <Badge variant={mov.tipo === 'entrada' ? 'success' : 'danger'}>
                  {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
