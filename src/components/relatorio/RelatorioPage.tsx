'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { produtosService } from '@/services/produtos.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { toast } from 'sonner';
import {
  Download, Filter, Package,
  TrendingUp, AlertTriangle, BarChart3,
} from 'lucide-react';
import type { Produto } from '@/types';

export function RelatorioPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [summary, setSummary] = useState({ totalProdutos: 0, totalItens: 0, abaixoMinimo: 0 });
  const [busca, setBusca] = useState('');
  const [filtroMinimo, setFiltroMinimo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    produtosService.summary().then(setSummary).catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await produtosService.list({
        nome: busca || undefined,
        estoqueminimo: filtroMinimo,
        limit: 0,
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

  const salvarProvidencia = async (produto: Produto, providencia: string) => {
    try {
      await produtosService.update(produto.id, { providencia });
    } catch {
      toast.error('Erro ao salvar providência');
    }
  };

  const { totalProdutos, totalItens, abaixoMinimo } = summary;

  const columns: Column<Produto>[] = [
    { key: 'codigo', header: 'Código', render: (p) => <span className="font-mono text-xs text-gray-600">{p.codigo}</span> },
    {
      key: 'nome', header: 'Produto',
      render: (p) => (
        <Link
          href={`/produtos?produto=${p.id}`}
          className="font-medium text-accent hover:text-accent-dark hover:underline"
        >
          {p.nome}
        </Link>
      ),
    },
    { key: 'min', header: 'Mínimo', align: 'center', render: (p) => <span className="text-gray-600">{p.estoqueminimo}</span> },
    { key: 'ideal', header: 'Ideal', align: 'center', render: (p) => <span className="text-gray-600">{p.estoqueideal}</span> },
    {
      key: 'saldo', header: 'Saldo', align: 'center',
      render: (p) => (
        <Badge variant={p.saldo <= p.estoqueminimo ? 'danger' : p.saldo <= p.estoqueideal ? 'warning' : 'success'}>
          {p.saldo}
        </Badge>
      ),
    },
    {
      key: 'providencia', header: 'Providência',
      render: (p) => (
        <input
          className="text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-accent outline-none w-full max-w-[200px] px-1 py-0.5 transition-colors"
          defaultValue={p.providencia}
          placeholder="—"
          onBlur={(e) => {
            if (e.target.value !== p.providencia) salvarProvidencia(p, e.target.value);
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatório de Estoque"
        subtitle="Visão geral do inventário"
        actions={
          <Button onClick={exportarCsv} variant="outline" className="gap-2 shadow-sm">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Package} iconColor="bg-accent" value={totalProdutos} label="Produtos" />
        <StatCard icon={TrendingUp} iconColor="bg-emerald-600" value={totalItens.toLocaleString()} label="Itens em estoque" />
        <StatCard icon={AlertTriangle} iconColor="bg-amber-500" value={abaixoMinimo} label="Abaixo do mínimo" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          containerClassName="flex-1"
          placeholder="Buscar por nome ou código..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Button
          variant={filtroMinimo ? 'destructive' : 'outline'}
          onClick={() => setFiltroMinimo(!filtroMinimo)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Abaixo do mínimo
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={produtos}
        loading={loading}
        emptyIcon={BarChart3}
        emptyMessage="Nenhum produto encontrado"
        keyExtractor={(p) => p.id}
      />
    </div>
  );
}
