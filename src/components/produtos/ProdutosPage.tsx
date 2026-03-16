'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { produtosService } from '@/services/produtos.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Plus, Pencil, Trash2, Barcode } from 'lucide-react';
import type { Produto } from '@/types';

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [barcodeDialog, setBarcodeDialog] = useState<Produto | null>(null);
  const barcodeCanvas = useRef<HTMLCanvasElement>(null);

  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    estoqueminimo: 0,
    estoqueideal: 0,
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await produtosService.list({ nome: busca || undefined });
      data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setProdutos(data);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const timer = setTimeout(carregar, 300);
    return () => clearTimeout(timer);
  }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ codigo: '', nome: '', estoqueminimo: 0, estoqueideal: 0 });
    setDialogOpen(true);
  };

  const abrirEditar = (p: Produto) => {
    setEditando(p);
    setForm({
      codigo: p.codigo,
      nome: p.nome,
      estoqueminimo: p.estoqueminimo,
      estoqueideal: p.estoqueideal,
    });
    setDialogOpen(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo || !form.nome) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    try {
      if (editando) {
        await produtosService.update(editando.id, form);
        toast.success('Produto atualizado');
      } else {
        await produtosService.create(form);
        toast.success('Produto criado');
      }
      setDialogOpen(false);
      carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  const excluir = async (p: Produto) => {
    if (!confirm(`Excluir "${p.nome}"? Todas as movimentações serão removidas.`)) return;
    try {
      await produtosService.delete(p.id);
      toast.success('Produto excluído');
      carregar();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const mostrarBarcode = (p: Produto) => {
    setBarcodeDialog(p);
    setTimeout(async () => {
      if (barcodeCanvas.current) {
        try {
          const bwipjs = await import('bwip-js/browser');
          bwipjs.toCanvas(barcodeCanvas.current, {
            bcid: 'code128',
            text: p.codigo,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center',
          });
        } catch {
          toast.error('Erro ao gerar código de barras');
        }
      }
    }, 100);
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">{produtos.length} produtos cadastrados</p>
        </div>
        <Button onClick={abrirNovo} className="gap-2 shadow-md bg-accent hover:bg-accent-dark">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-white">
                <th className="text-left px-4 py-3 font-semibold text-sm">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Nome</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Mínimo</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Ideal</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Saldo</th>
                <th className="text-right px-4 py-3 font-semibold text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Nenhum produto encontrado</td>
                </tr>
              ) : (
                produtos.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.estoqueminimo}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.estoqueideal}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${p.saldo <= p.estoqueminimo ? 'text-red-600' : p.saldo <= p.estoqueideal ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {p.saldo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => mostrarBarcode(p)} title="Código de barras" className="h-8 w-8">
                          <Barcode className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => abrirEditar(p)} title="Editar" className="h-8 w-8 text-accent hover:text-accent-dark hover:bg-blue-50">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => excluir(p)} title="Excluir" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <Input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ex: PRE-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Presilha Aço Inox 25mm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                <Input
                  type="number"
                  value={form.estoqueminimo}
                  onChange={(e) => {
                    const min = Number(e.target.value);
                    setForm({ ...form, estoqueminimo: min, estoqueideal: min * 3 });
                  }}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Ideal
                  <span className="text-xs text-gray-400 ml-1">(auto: mín. × 3)</span>
                </label>
                <Input
                  type="number"
                  value={form.estoqueideal}
                  onChange={(e) => setForm({ ...form, estoqueideal: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="success">
                {editando ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!barcodeDialog} onOpenChange={() => setBarcodeDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{barcodeDialog?.codigo} - {barcodeDialog?.nome}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <canvas ref={barcodeCanvas} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
