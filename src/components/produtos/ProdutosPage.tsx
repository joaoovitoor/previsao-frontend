'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { FormField, FormRow } from '@/components/ui/form-field';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowUpCircle, ArrowDownCircle,
  Package, Send, Trash2, Search, X, Plus,
  Pencil, Barcode,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Produto, Movimentacao } from '@/types';

export function ProdutosPage() {
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
  const [loadingMov, setLoadingMov] = useState(false);
  const [loadingProduto, setLoadingProduto] = useState(!!produtoIdParam);
  const [showDropdown, setShowDropdown] = useState(false);

  // Product CRUD state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [barcodeDialog, setBarcodeDialog] = useState<Produto | null>(null);
  const barcodeCanvas = useRef<HTMLCanvasElement>(null);
  const [form, setForm] = useState({ codigo: '', nome: '', estoqueminimo: 0, estoqueideal: 0 });

  // Load product from URL
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
        router.replace('/produtos');
      } finally {
        setLoadingProduto(false);
      }
    })();
  }, [produtoIdParam, router]);

  // Search products
  const buscarProdutos = useCallback(async () => {
    if (!buscaProduto || produtoSelecionado) {
      setProdutosBusca([]);
      return;
    }
    try {
      const data = await produtosService.list({ nome: buscaProduto, limit: 50 });
      setProdutosBusca(data);
      setShowDropdown(true);
    } catch { /* ignore */ }
  }, [buscaProduto, produtoSelecionado]);

  useEffect(() => {
    const timer = setTimeout(buscarProdutos, 300);
    return () => clearTimeout(timer);
  }, [buscarProdutos]);

  // Load movements for selected product
  const carregarMovimentacoes = useCallback(async () => {
    if (!produtoSelecionado) return;
    setLoadingMov(true);
    try {
      const data = await movimentacoesService.list({ produto_id: produtoSelecionado.id });
      setMovimentacoes(data);
    } catch { /* ignore */ }
    finally { setLoadingMov(false); }
  }, [produtoSelecionado]);

  useEffect(() => {
    if (!loadingProduto) carregarMovimentacoes();
  }, [carregarMovimentacoes, loadingProduto]);

  const selecionarProduto = (p: Produto) => {
    setProdutoSelecionado(p);
    setBuscaProduto(`${p.codigo} - ${p.nome}`);
    setShowDropdown(false);
    setMovimentacoes([]);
  };

  const limparProduto = () => {
    setProdutoSelecionado(null);
    setBuscaProduto('');
    setMovimentacoes([]);
    if (produtoIdParam) router.replace('/produtos');
  };

  // Movement registration
  const registrar = async () => {
    if (!produtoSelecionado) return;
    const qtd = parseInt(quantidade);
    if (!qtd || qtd <= 0) { toast.error('Quantidade inválida'); return; }

    setSaving(true);
    try {
      const result = await movimentacoesService.create({
        produto_id: produtoSelecionado.id, tipo, quantidade: qtd,
      });
      toast.success(
        `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!${result.saldo_atual != null ? ` Saldo: ${result.saldo_atual}` : ''}`,
      );
      setQuantidade('');
      const p = await produtosService.getById(produtoSelecionado.id);
      setProdutoSelecionado(p);
      setBuscaProduto(`${p.codigo} - ${p.nome}`);
      carregarMovimentacoes();
    } catch (err: any) { toast.error(err.message || 'Erro ao registrar'); }
    finally { setSaving(false); }
  };

  const excluirMovimentacao = async (mov: Movimentacao) => {
    if (!confirm('Excluir esta movimentação? O saldo será revertido.')) return;
    try {
      await movimentacoesService.delete(mov.id);
      toast.success('Movimentação excluída');
      if (produtoSelecionado) {
        const p = await produtosService.getById(produtoSelecionado.id);
        setProdutoSelecionado(p);
        setBuscaProduto(`${p.codigo} - ${p.nome}`);
      }
      carregarMovimentacoes();
    } catch { toast.error('Erro ao excluir'); }
  };

  // Product CRUD
  const abrirNovo = () => {
    setEditando(null);
    setForm({ codigo: '', nome: '', estoqueminimo: 0, estoqueideal: 0 });
    setDialogOpen(true);
  };

  const abrirEditar = () => {
    if (!produtoSelecionado) return;
    setEditando(produtoSelecionado);
    setForm({
      codigo: produtoSelecionado.codigo,
      nome: produtoSelecionado.nome,
      estoqueminimo: produtoSelecionado.estoqueminimo,
      estoqueideal: produtoSelecionado.estoqueideal,
    });
    setDialogOpen(true);
  };

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo || !form.nome) { toast.error('Código e nome são obrigatórios'); return; }
    try {
      if (editando) {
        await produtosService.update(editando.id, form);
        toast.success('Produto atualizado');
        const p = await produtosService.getById(editando.id);
        setProdutoSelecionado(p);
        setBuscaProduto(`${p.codigo} - ${p.nome}`);
      } else {
        const novo = await produtosService.create(form);
        toast.success('Produto criado');
        setProdutoSelecionado(novo);
        setBuscaProduto(`${novo.codigo} - ${novo.nome}`);
        setMovimentacoes([]);
      }
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.message || 'Erro ao salvar'); }
  };

  const excluirProduto = async () => {
    if (!produtoSelecionado) return;
    if (!confirm(`Excluir "${produtoSelecionado.nome}"? Todas as movimentações serão removidas.`)) return;
    try {
      await produtosService.delete(produtoSelecionado.id);
      toast.success('Produto excluído');
      limparProduto();
    } catch { toast.error('Erro ao excluir'); }
  };

  const mostrarBarcode = () => {
    if (!produtoSelecionado) return;
    setBarcodeDialog(produtoSelecionado);
    setTimeout(async () => {
      if (barcodeCanvas.current) {
        try {
          const bwipjs = await import('bwip-js/browser');
          bwipjs.toCanvas(barcodeCanvas.current, {
            bcid: 'code128', text: produtoSelecionado.codigo,
            scale: 3, height: 10, includetext: true, textxalign: 'center',
          });
        } catch { toast.error('Erro ao gerar código de barras'); }
      }
    }, 100);
  };

  const isEntrada = tipo === 'entrada';

  const movimentacoesComSaldo = produtoSelecionado
    ? (() => {
        const sorted = [...movimentacoes].sort((a, b) => a.created_at.localeCompare(b.created_at));
        let saldo = 0;
        return sorted.map((mov) => {
          saldo += mov.tipo === 'entrada' ? mov.quantidade : -mov.quantidade;
          return { ...mov, saldo_acumulado: saldo };
        }).reverse();
      })()
    : [];

  const movColumns: Column<Movimentacao & { saldo_acumulado?: number }>[] = [
    {
      key: 'tipo', header: 'Tipo',
      render: (mov) => (
        <div className="flex items-center gap-2">
          {mov.tipo === 'entrada'
            ? <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
            : <ArrowDownCircle className="h-4 w-4 text-red-500" />}
          <span className="capitalize text-sm">{mov.tipo}</span>
        </div>
      ),
    },
    {
      key: 'qtd', header: 'Qtd', align: 'center',
      render: (mov) => (
        <Badge variant={mov.tipo === 'entrada' ? 'success' : 'danger'}>
          {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
        </Badge>
      ),
    },
    {
      key: 'saldo_acum', header: 'Saldo', align: 'center',
      render: (mov) => <span className="font-bold text-sm text-gray-700">{mov.saldo_acumulado ?? '—'}</span>,
    },
    {
      key: 'data', header: 'Data', align: 'right',
      render: (mov) => <span className="text-gray-500 text-xs">{formatDate(mov.created_at)}</span>,
    },
    {
      key: 'acoes', header: '', align: 'center', width: 'w-12',
      render: (mov) => (
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

  if (loadingProduto) return <LoadingOverlay isLoading message="Carregando produto..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações"
        subtitle="Gerencie produtos, entradas e saídas de estoque"
        actions={
          <Button onClick={abrirNovo} className="gap-2 shadow-md bg-accent hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        }
      />

      {/* Product search - always visible */}
      <div className="relative">
        <div className="bg-white rounded shadow-sm border border-gray-200 p-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Buscar Produto
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchInput
                placeholder="Buscar por código ou nome..."
                value={buscaProduto}
                onChange={(e) => {
                  setBuscaProduto(e.target.value);
                  if (produtoSelecionado) limparProduto();
                }}
                onFocus={() => produtosBusca.length > 0 && setShowDropdown(true)}
                className="h-11"
              />
              {showDropdown && produtosBusca.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded border shadow-xl max-h-60 overflow-y-auto">
                  {produtosBusca.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selecionarProduto(p)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-sm transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <Package className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="font-mono text-xs text-gray-500 shrink-0">{p.codigo}</span>
                      <span className="font-medium truncate flex-1">{p.nome}</span>
                      <span className="text-xs text-gray-400 shrink-0">Saldo: {p.saldo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {produtoSelecionado && (
              <button
                onClick={limparProduto}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors"
                title="Limpar produto"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* No product selected */}
      {!produtoSelecionado && (
        <div className="bg-white rounded shadow-sm border border-gray-200 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Selecione um produto</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Busque pelo código ou nome acima para ver detalhes, movimentações e registrar entradas ou saídas.
          </p>
        </div>
      )}

      {/* Product selected */}
      {produtoSelecionado && (
        <>
          {/* Product info cards + action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
            {/* Product actions */}
            <div className="bg-white rounded shadow-sm border border-gray-200 p-4 flex items-center justify-center gap-2">
              <Button size="icon" variant="ghost" onClick={mostrarBarcode} title="Código de barras" className="h-9 w-9">
                <Barcode className="h-5 w-5 text-gray-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={abrirEditar} title="Editar produto" className="h-9 w-9 text-accent hover:text-accent-dark hover:bg-blue-50">
                <Pencil className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={excluirProduto} title="Excluir produto" className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Movement form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded shadow-sm border border-gray-200 p-5 space-y-4 sticky top-[76px]">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Novo Lançamento</h3>
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
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Quantidade</label>
                  <Input
                    type="number" placeholder="0" value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    min={1} className="h-12 text-2xl font-bold text-center"
                  />
                </div>
                <Button
                  onClick={registrar} disabled={saving}
                  className={`w-full h-11 font-bold gap-2 ${isEntrada ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <Send className="h-4 w-4" />
                  {saving ? 'Registrando...' : `Registrar ${isEntrada ? 'Entrada' : 'Saída'}`}
                </Button>
              </div>
            </div>

            {/* Movement history */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Histórico de Movimentações</h2>
              <DataTable
                columns={movColumns}
                data={movimentacoesComSaldo}
                loading={loadingMov}
                emptyMessage="Nenhuma movimentação para este produto"
                keyExtractor={(mov) => mov.id}
              />
            </div>
          </div>
        </>
      )}

      {/* Create/Edit product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvarProduto} className="space-y-4 mt-4">
            <FormField label="Código">
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex: PRE-001" />
            </FormField>
            <FormField label="Nome">
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Presilha Aço Inox 25mm" />
            </FormField>
            <FormRow>
              <FormField label="Estoque Mínimo">
                <Input
                  type="number" value={form.estoqueminimo}
                  onChange={(e) => { const min = Number(e.target.value); setForm({ ...form, estoqueminimo: min, estoqueideal: min * 3 }); }}
                  min={0}
                />
              </FormField>
              <FormField label="Estoque Ideal" hint="(auto: mín. × 3)">
                <Input type="number" value={form.estoqueideal} onChange={(e) => setForm({ ...form, estoqueideal: Number(e.target.value) })} min={0} />
              </FormField>
            </FormRow>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="success">{editando ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Barcode dialog */}
      <Dialog open={!!barcodeDialog} onOpenChange={() => setBarcodeDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{barcodeDialog?.codigo} - {barcodeDialog?.nome}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4 overflow-x-auto">
            <canvas ref={barcodeCanvas} className="max-w-full" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
