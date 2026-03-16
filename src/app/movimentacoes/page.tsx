'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MovimentacoesRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const produto = searchParams.get('produto');
    router.replace(produto ? `/produtos?produto=${produto}` : '/produtos');
  }, [searchParams, router]);

  return null;
}
