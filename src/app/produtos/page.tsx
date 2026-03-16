import { Suspense } from 'react';
import { ProdutosPage } from '@/components/produtos/ProdutosPage';

export default function Produtos() {
  return (
    <Suspense>
      <ProdutosPage />
    </Suspense>
  );
}
