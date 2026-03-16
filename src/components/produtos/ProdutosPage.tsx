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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">{produtos.length} produtos cadastrados</p>
        </div>
        <Button onClick={abrirNovo} className="gap-2">
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

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Mínimo</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Ideal</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Saldo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Nenhum produto encontrado</td>
                </tr>
              ) : (
                produtos.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium">{p.nome}</td>
                    <td className="px-4 py-3 text-center">{p.estoqueminimo}</td>
                    <td className="px-4 py-3 text-center">{p.estoqueideal}</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.saldo}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => mostrarBarcode(p)} title="Código de barras">
                          <Barcode className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => abrirEditar(p)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => excluir(p)} title="Excluir" className="text-red-500 hover:text-red-700">
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
                  onChange={(e) => setForm({ ...form, estoqueminimo: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Ideal</label>
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
              <Button type="submit">
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
