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
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Relatório', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 bg-surface text-white rounded-lg shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col transition-transform lg:translate-x-0 shadow-xl lg:shadow-md border-r border-gray-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header com logo da empresa */}
        <div className="bg-surface px-4 py-4 flex items-center gap-3">
          <Image
            src="/logo_previsao.png"
            alt="Previsão Presilhas"
            width={160}
            height={50}
            className="h-[42px] w-auto"
            priority
          />
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden ml-auto text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-2">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
            Controle de Estoque
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
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
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-surface text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive && 'text-accent-light')} />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="h-9 w-9 rounded-full bg-surface flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-white">
                {user?.nome?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
              <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand hover:bg-red-50 w-full transition-colors cursor-pointer font-medium"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
