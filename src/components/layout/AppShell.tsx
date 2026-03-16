'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { LoginPage } from './LoginPage';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay isLoading={true} message="Carregando sistema..." />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="ml-14 pt-14 min-h-screen">
        <div className="p-5">
          {children}
        </div>
      </main>
    </div>
  );
}
