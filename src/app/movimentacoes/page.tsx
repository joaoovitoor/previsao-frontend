import { Suspense } from 'react';
import { MovimentacoesPage } from '@/components/movimentacoes/MovimentacoesPage';

export default function Movimentacoes() {
  return (
    <Suspense>
      <MovimentacoesPage />
    </Suspense>
  );
}
