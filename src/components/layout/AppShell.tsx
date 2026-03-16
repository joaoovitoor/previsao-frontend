'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { LoginPage } from './LoginPage';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      {/* Conteúdo principal - margem esquerda do drawer colapsado (56px) + margem top da AppBar (56px) */}
      <main className="ml-14 pt-14 min-h-screen">
        <div className="p-5">
          {children}
        </div>
      </main>
    </div>
  );
}
