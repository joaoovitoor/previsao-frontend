'use client';

import { useState, useEffect, useCallback } from 'react';
import { produtosService } from '@/services/produtos.service';
import { movimentacoesService } from '@/services/movimentacoes.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, Download, Filter, Package,
  TrendingUp, AlertTriangle, BarChart3,
  Trash2, ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Produto, Movimentacao } from '@/types';

export function RelatorioPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroMinimo, setFiltroMinimo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detalheProduto, setDetalheProduto] = useState<Produto | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await produtosService.list({
        nome: busca || undefined,
        estoqueminimo: filtroMinimo,
      });
      data.sort((a, b) => a.codigo.toUpperCase().localeCompare(b.codigo.toUpperCase()));
      setProdutos(data);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroMinimo]);

  useEffect(() => {
    const timer = setTimeout(carregar, 300);
    return () => clearTimeout(timer);
  }, [carregar]);

  const exportarCsv = async () => {
    try {
      const csv = await produtosService.exportCsv({
        nome: busca || undefined,
        estoqueminimo: filtroMinimo,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado!');
    } catch {
      toast.error('Erro ao exportar CSV');
    }
  };

  const abrirDetalhe = async (produto: Produto) => {
    setDetalheProduto(produto);
    setLoadingMov(true);
    try {
      const data = await movimentacoesService.list({ produto_id: produto.id });
      setMovimentacoes(data);
    } catch {
      toast.error('Erro ao carregar movimentações');
    } finally {
      setLoadingMov(false);
    }
  };

  const excluirMovimentacao = async (mov: Movimentacao) => {
    if (!confirm('Excluir esta movimentação? O saldo será revertido.')) return;
    try {
      await movimentacoesService.delete(mov.id);
      toast.success('Movimentação excluída');
      if (detalheProduto) abrirDetalhe(detalheProduto);
      carregar();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const salvarProvidencia = async (produto: Produto, providencia: string) => {
    try {
      await produtosService.update(produto.id, { providencia });
    } catch {
      toast.error('Erro ao salvar providência');
    }
  };

  const totalProdutos = produtos.length;
  const abaixoMinimo = produtos.filter((p) => p.saldo <= p.estoqueminimo).length;
  const totalItens = produtos.reduce((acc, p) => acc + (p.saldo || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Estoque</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral do inventário</p>
        </div>
        <Button onClick={exportarCsv} variant="outline" className="gap-2 shadow-sm">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center shadow-sm">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalProdutos}</p>
              <p className="text-sm text-gray-500">Produtos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalItens.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Itens em estoque</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{abaixoMinimo}</p>
              <p className="text-sm text-gray-500">Abaixo do mínimo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={filtroMinimo ? 'destructive' : 'outline'}
          onClick={() => setFiltroMinimo(!filtroMinimo)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Abaixo do mínimo
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-white">
                <th className="text-left px-4 py-3 font-semibold text-sm">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Produto</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Mínimo</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Ideal</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Saldo</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Providência</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-gray-300" />
                      <span>Nenhum produto encontrado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                produtos.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.estoqueminimo}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.estoqueideal}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.saldo <= p.estoqueminimo ? 'danger' : p.saldo <= p.estoqueideal ? 'warning' : 'success'}>
                        {p.saldo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full max-w-[200px] px-1 py-0.5 transition-colors"
                        defaultValue={p.providencia}
                        placeholder="—"
                        onBlur={(e) => {
                          if (e.target.value !== p.providencia) {
                            salvarProvidencia(p, e.target.value);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="ghost" onClick={() => abrirDetalhe(p)} className="text-accent hover:text-accent-dark hover:bg-blue-50">
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de detalhe */}
      <Dialog open={!!detalheProduto} onOpenChange={() => setDetalheProduto(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalheProduto?.codigo} - {detalheProduto?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Mínimo</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{detalheProduto?.estoqueminimo}</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ideal</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{detalheProduto?.estoqueideal}</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${
              detalheProduto && detalheProduto.saldo <= detalheProduto.estoqueminimo
                ? 'bg-red-100'
                : detalheProduto && detalheProduto.saldo <= detalheProduto.estoqueideal
                  ? 'bg-amber-100'
                  : 'bg-emerald-100'
            }`}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Saldo</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{detalheProduto?.saldo}</p>
            </div>
          </div>

          <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Histórico de Movimentações
          </h3>

          {loadingMov ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Carregando...</span>
            </div>
          ) : movimentacoes.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nenhuma movimentação</p>
          ) : (
            <div className="space-y-1.5">
              {movimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm border ${
                    mov.tipo === 'entrada'
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : 'bg-red-50/50 border-red-100'
                  }`}
                >
                  {mov.tipo === 'entrada' ? (
                    <ArrowUpCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold capitalize">{mov.tipo}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="font-bold">{mov.quantidade} un.</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {formatDate(mov.created_at)}
                  </span>
                  <button
                    onClick={() => excluirMovimentacao(mov)}
                    className="text-gray-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
