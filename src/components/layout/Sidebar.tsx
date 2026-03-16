'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Relatório Estoque', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
];

const pageTitles: Record<string, string> = {
  '/': 'Relatório Estoque',
  '/produtos': 'Produtos',
  '/movimentacoes': 'Movimentações',
  '/usuarios': 'Usuários',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const pageTitle = pageTitles[pathname] || 'Previsão Presilhas';

  return (
    <>
      {/* AppBar - barra superior fixa como o antigo */}
      <header
        className={cn(
          'fixed top-0 right-0 z-40 h-14 bg-surface flex items-center px-4 transition-all duration-200',
          open ? 'left-60' : 'left-14',
        )}
      >
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 text-white/80 hover:text-white rounded transition-colors mr-3 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-white text-base font-medium flex-1 truncate">
          {pageTitle}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm hidden sm:block">{user?.nome}</span>
          <button
            onClick={logout}
            className="p-1.5 text-white/70 hover:text-white rounded transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Drawer lateral - colapsável como o antigo */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 overflow-hidden',
          open ? 'w-60' : 'w-14',
        )}
      >
        {/* Logo + botão colapsar */}
        <div className="h-14 flex items-center bg-surface px-2 shrink-0">
          {open ? (
            <>
              <Image
                src="/logo_previsao.png"
                alt="Previsão Presilhas"
                width={140}
                height={44}
                className="h-9 w-auto ml-1"
                priority
              />
              <button
                onClick={() => setOpen(false)}
                className="ml-auto p-1.5 text-white/70 hover:text-white rounded transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Image
              src="/favicon.png"
              alt="Previsão"
              width={32}
              height={32}
              className="h-8 w-8 mx-auto"
              priority
            />
          )}
        </div>

        <div className="border-b border-gray-200" />

        {/* Navegação */}
        <nav className="flex-1 py-2">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'admin')
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    'flex items-center h-11 transition-colors',
                    open ? 'px-4 gap-3' : 'justify-center',
                    isActive
                      ? 'bg-accent/10 text-accent border-r-3 border-accent'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {open && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
        </nav>
      </aside>
    </>
  );
}
