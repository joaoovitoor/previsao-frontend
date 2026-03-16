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
  TrendingUp, TrendingDown, AlertTriangle,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Estoque</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral do inventário</p>
        </div>
        <Button onClick={exportarCsv} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalProdutos}</p>
              <p className="text-xs text-gray-500">Produtos cadastrados</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalItens.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Itens em estoque</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{abaixoMinimo}</p>
              <p className="text-xs text-gray-500">Abaixo do mínimo</p>
            </div>
          </div>
        </div>
      </div>

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
          variant={filtroMinimo ? 'default' : 'outline'}
          onClick={() => setFiltroMinimo(!filtroMinimo)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Abaixo do mínimo
        </Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Produto</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Mínimo</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Ideal</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Saldo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Providência</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">Nenhum produto encontrado</td>
                </tr>
              ) : (
                produtos.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium">{p.nome}</td>
                    <td className="px-4 py-3 text-center">{p.estoqueminimo}</td>
                    <td className="px-4 py-3 text-center">{p.estoqueideal}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.saldo <= p.estoqueminimo ? 'danger' : p.saldo <= p.estoqueideal ? 'warning' : 'success'}>
                        {p.saldo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full max-w-[200px] px-1 py-0.5"
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
                      <Button size="sm" variant="ghost" onClick={() => abrirDetalhe(p)}>
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

      <Dialog open={!!detalheProduto} onOpenChange={() => setDetalheProduto(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalheProduto?.codigo} - {detalheProduto?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Mínimo</p>
              <p className="text-lg font-bold">{detalheProduto?.estoqueminimo}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Ideal</p>
              <p className="text-lg font-bold">{detalheProduto?.estoqueideal}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Saldo</p>
              <p className="text-lg font-bold">{detalheProduto?.saldo}</p>
            </div>
          </div>

          <h3 className="font-semibold text-sm text-gray-700 mb-2">Histórico de Movimentações</h3>

          {loadingMov ? (
            <p className="text-sm text-gray-400 py-4 text-center">Carregando...</p>
          ) : movimentacoes.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma movimentação</p>
          ) : (
            <div className="space-y-2">
              {movimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-sm"
                >
                  {mov.tipo === 'entrada' ? (
                    <ArrowUpCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium capitalize">{mov.tipo}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="font-semibold">{mov.quantidade} un.</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDate(mov.created_at)}
                  </span>
                  <button
                    onClick={() => excluirMovimentacao(mov)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
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
