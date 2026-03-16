'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { produtosService } from '@/services/produtos.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FormField, FormRow } from '@/components/ui/form-field';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Barcode } from 'lucide-react';
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

  const columns: Column<Produto>[] = [
    { key: 'codigo', header: 'Código', render: (p) => <span className="font-mono text-xs text-gray-600">{p.codigo}</span> },
    { key: 'nome', header: 'Nome', render: (p) => (
      <Link href={`/movimentacoes?produto=${p.id}`} className="font-medium text-accent hover:text-accent-dark hover:underline">
        {p.nome}
      </Link>
    ) },
    { key: 'min', header: 'Mínimo', align: 'center', render: (p) => <span className="text-gray-600">{p.estoqueminimo}</span> },
    { key: 'ideal', header: 'Ideal', align: 'center', render: (p) => <span className="text-gray-600">{p.estoqueideal}</span> },
    {
      key: 'saldo', header: 'Saldo', align: 'center',
      render: (p) => (
        <span className={`font-bold ${p.saldo <= p.estoqueminimo ? 'text-red-600' : p.saldo <= p.estoqueideal ? 'text-amber-600' : 'text-emerald-600'}`}>
          {p.saldo}
        </span>
      ),
    },
    {
      key: 'acoes', header: 'Ações', align: 'right',
      render: (p) => (
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
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produtos"
        subtitle={`${produtos.length} produtos cadastrados`}
        actions={
          <Button onClick={abrirNovo} className="gap-2 shadow-md bg-accent hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        }
      />

      <SearchInput
        placeholder="Buscar por nome ou código..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <DataTable
        columns={columns}
        data={produtos}
        loading={loading}
        emptyMessage="Nenhum produto encontrado"
        keyExtractor={(p) => p.id}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4 mt-4">
            <FormField label="Código">
              <Input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ex: PRE-001"
              />
            </FormField>
            <FormField label="Nome">
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Presilha Aço Inox 25mm"
              />
            </FormField>
            <FormRow>
              <FormField label="Estoque Mínimo">
                <Input
                  type="number"
                  value={form.estoqueminimo}
                  onChange={(e) => {
                    const min = Number(e.target.value);
                    setForm({ ...form, estoqueminimo: min, estoqueideal: min * 3 });
                  }}
                  min={0}
                />
              </FormField>
              <FormField label="Estoque Ideal" hint="(auto: mín. × 3)">
                <Input
                  type="number"
                  value={form.estoqueideal}
                  onChange={(e) => setForm({ ...form, estoqueideal: Number(e.target.value) })}
                  min={0}
                />
              </FormField>
            </FormRow>
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
          <div className="flex justify-center py-4 overflow-x-auto">
            <canvas ref={barcodeCanvas} className="max-w-full" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
