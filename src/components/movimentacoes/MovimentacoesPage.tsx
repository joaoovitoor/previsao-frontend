'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { produtosService } from '@/services/produtos.service';
import { movimentacoesService } from '@/services/movimentacoes.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type Column } from '@/components/ui/data-table';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { toast } from 'sonner';
import {
  ArrowUpCircle, ArrowDownCircle,
  Package, Send, Trash2, Check, X, ArrowLeft,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Produto, Movimentacao } from '@/types';

export function MovimentacoesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const produtoIdParam = searchParams.get('produto');

  const [produtosBusca, setProdutosBusca] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMov, setLoadingMov] = useState(true);
  const [loadingProduto, setLoadingProduto] = useState(!!produtoIdParam);
  const [showDropdown, setShowDropdown] = useState(false);

  const isProdutoMode = !!produtoSelecionado && !!produtoIdParam;

  // Carrega produto via query param
  useEffect(() => {
    if (!produtoIdParam) {
      setLoadingProduto(false);
      return;
    }
    (async () => {
      try {
        const p = await produtosService.getById(produtoIdParam);
        setProdutoSelecionado(p);
        setBuscaProduto(`${p.codigo} - ${p.nome}`);
      } catch {
        toast.error('Produto não encontrado');
        router.replace('/movimentacoes');
      } finally {
        setLoadingProduto(false);
      }
    })();
  }, [produtoIdParam, router]);

  const buscarProdutos = useCallback(async () => {
    if (!buscaProduto || produtoSelecionado) {
      setProdutosBusca([]);
      return;
    }
    try {
      const data = await produtosService.list({ nome: buscaProduto, limit: 10 });
      setProdutosBusca(data);
      setShowDropdown(true);
    } catch {
      /* ignore */
    }
  }, [buscaProduto, produtoSelecionado]);

  useEffect(() => {
    const timer = setTimeout(buscarProdutos, 300);
    return () => clearTimeout(timer);
  }, [buscarProdutos]);

  const carregarMovimentacoes = useCallback(async () => {
    setLoadingMov(true);
    try {
      const params: { produto_id?: string; limit?: number } = {};
      if (produtoSelecionado && produtoIdParam) {
        params.produto_id = produtoSelecionado.id;
      } else {
        params.limit = 20;
      }
      const data = await movimentacoesService.list(params);
      setMovimentacoes(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingMov(false);
    }
  }, [produtoSelecionado, produtoIdParam]);

  useEffect(() => {
    if (!loadingProduto) carregarMovimentacoes();
  }, [carregarMovimentacoes, loadingProduto]);

  const selecionarProduto = (p: Produto) => {
    setProdutoSelecionado(p);
    setBuscaProduto(`${p.codigo} - ${p.nome}`);
    setShowDropdown(false);
  };

  const limparProduto = () => {
    setProdutoSelecionado(null);
    setBuscaProduto('');
    if (produtoIdParam) {
      router.replace('/movimentacoes');
    }
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
      setQuantidade('');
      // Refresh produto info + movimentações
      if (produtoIdParam) {
        const p = await produtosService.getById(produtoSelecionado.id);
        setProdutoSelecionado(p);
      } else {
        setProdutoSelecionado(null);
        setBuscaProduto('');
      }
      carregarMovimentacoes();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar');
    } finally {
      setSaving(false);
    }
  };

  const excluirMovimentacao = async (mov: Movimentacao) => {
    if (!confirm('Excluir esta movimentação? O saldo será revertido.')) return;
    try {
      await movimentacoesService.delete(mov.id);
      toast.success('Movimentação excluída');
      if (produtoSelecionado && produtoIdParam) {
        const p = await produtosService.getById(produtoSelecionado.id);
        setProdutoSelecionado(p);
      }
      carregarMovimentacoes();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const isEntrada = tipo === 'entrada';

  // Calcula saldo acumulado para modo produto (do mais antigo ao mais recente)
  const movimentacoesComSaldo = isProdutoMode
    ? (() => {
        const sorted = [...movimentacoes].sort((a, b) => a.created_at.localeCompare(b.created_at));
        let saldo = 0;
        return sorted.map((mov) => {
          saldo += mov.tipo === 'entrada' ? mov.quantidade : -mov.quantidade;
          return { ...mov, saldo_acumulado: saldo };
        }).reverse();
      })()
    : movimentacoes;

  const movColumns: Column<Movimentacao & { saldo_acumulado?: number }>[] = [
    {
      key: 'tipo', header: 'Tipo',
      render: (mov) => (
        <div className="flex items-center gap-2">
          {mov.tipo === 'entrada' ? (
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="capitalize text-sm">{mov.tipo}</span>
        </div>
      ),
    },
    ...(!isProdutoMode ? [{
      key: 'produto', header: 'Produto',
      render: (mov: Movimentacao) => <span className="text-gray-700">{mov.produto_nome}</span>,
    }] : []),
    {
      key: 'qtd', header: 'Qtd', align: 'center' as const,
      render: (mov: Movimentacao) => (
        <Badge variant={mov.tipo === 'entrada' ? 'success' : 'danger'}>
          {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
        </Badge>
      ),
    },
    ...(isProdutoMode ? [{
      key: 'saldo_acum', header: 'Saldo', align: 'center' as const,
      render: (mov: Movimentacao & { saldo_acumulado?: number }) => (
        <span className="font-bold text-sm text-gray-700">{mov.saldo_acumulado ?? '—'}</span>
      ),
    }] : []),
    {
      key: 'data', header: 'Data', align: 'right' as const,
      render: (mov: Movimentacao) => <span className="text-gray-500 text-xs">{formatDate(mov.created_at)}</span>,
    },
    {
      key: 'acoes', header: '', align: 'center' as const, width: 'w-12',
      render: (mov: Movimentacao) => (
        <button
          onClick={() => excluirMovimentacao(mov)}
          className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded hover:bg-red-50"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (loadingProduto) {
    return <LoadingOverlay isLoading={true} message="Carregando produto..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isProdutoMode
          ? `${produtoSelecionado.codigo} - ${produtoSelecionado.nome}`
          : 'Movimentação de Estoque'
        }
        subtitle={isProdutoMode
          ? 'Histórico completo e lançamentos'
          : 'Registrar entradas e saídas'
        }
        actions={isProdutoMode ? (
          <Button variant="outline" onClick={limparProduto} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : undefined}
      />

      {/* Info card do produto quando em modo produto */}
      {isProdutoMode && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Mínimo</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{produtoSelecionado.estoqueminimo}</p>
          </div>
          <div className="bg-white rounded shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Ideal</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{produtoSelecionado.estoqueideal}</p>
          </div>
          <div className={`rounded shadow-sm border p-4 text-center ${
            produtoSelecionado.saldo <= produtoSelecionado.estoqueminimo
              ? 'bg-red-50 border-red-200'
              : produtoSelecionado.saldo <= produtoSelecionado.estoqueideal
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
          }`}>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Saldo Atual</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{produtoSelecionado.saldo}</p>
          </div>
          <div className="bg-white rounded shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Movimentos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{movimentacoes.length}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário - 1/3 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded shadow-sm border border-gray-200 p-5 space-y-4 sticky top-[76px]">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                  isEntrada
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <ArrowUpCircle className="h-5 w-5" />
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipo('saida')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                  !isEntrada
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                }`}
              >
                <ArrowDownCircle className="h-5 w-5" />
                Saída
              </button>
            </div>

            {!isProdutoMode && (
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Produto</label>
                <SearchInput
                  placeholder="Buscar produto..."
                  value={buscaProduto}
                  onChange={(e) => {
                    setBuscaProduto(e.target.value);
                    setProdutoSelecionado(null);
                  }}
                  onFocus={() => produtosBusca.length > 0 && setShowDropdown(true)}
                />

                {showDropdown && produtosBusca.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded border shadow-xl max-h-52 overflow-y-auto">
                    {produtosBusca.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selecionarProduto(p)}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center gap-2 text-sm transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono text-xs text-gray-500 shrink-0">{p.codigo}</span>
                        <span className="font-medium truncate flex-1">{p.nome}</span>
                        <span className="text-xs text-gray-400 shrink-0">({p.saldo})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {produtoSelecionado && !isProdutoMode && (
              <div className={`p-3 rounded border flex items-center gap-2 ${
                isEntrada ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                <Check className={`h-4 w-4 shrink-0 ${isEntrada ? 'text-emerald-600' : 'text-red-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{produtoSelecionado.codigo} - {produtoSelecionado.nome}</p>
                  <p className="text-xs text-gray-500">Saldo: <span className="font-bold">{produtoSelecionado.saldo}</span></p>
                </div>
                <button onClick={limparProduto} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Quantidade</label>
              <Input
                type="number"
                placeholder="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                min={1}
                className="h-12 text-2xl font-bold text-center"
              />
            </div>

            <Button
              onClick={registrar}
              disabled={saving}
              className={`w-full h-11 font-bold gap-2 ${
                isEntrada
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Send className="h-4 w-4" />
              {saving ? 'Registrando...' : `Registrar ${isEntrada ? 'Entrada' : 'Saída'}`}
            </Button>
          </div>
        </div>

        {/* Tabela - 2/3 */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {isProdutoMode ? 'Histórico de Movimentações' : 'Últimas Movimentações'}
          </h2>
          <LoadingOverlay isLoading={loadingMov} message="Carregando movimentações..." />
          <DataTable
            columns={movColumns}
            data={movimentacoesComSaldo}
            emptyMessage={isProdutoMode ? 'Nenhuma movimentação para este produto' : 'Nenhuma movimentação recente'}
            keyExtractor={(mov) => mov.id}
          />
        </div>
      </div>
    </div>
  );
}
