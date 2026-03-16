'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronDown,
  User,
  KeyRound,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

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
  '/minha-conta': 'Minha Conta',
  '/minha-conta/senha': 'Alterar Senha',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[pathname] || 'Previsão Presilhas';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const navigateTo = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* AppBar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-surface flex items-center px-4">
        <div className={cn('shrink-0 transition-all duration-200', open ? 'w-60' : 'w-14')} />
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

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
              {user?.nome?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-white/80 text-sm hidden sm:block max-w-[120px] truncate">{user?.nome}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-white/50 transition-transform hidden sm:block', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.nome}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || user?.cpf}</p>
              </div>

              <div className="p-2">
                <DropdownBtn icon={<User className="h-4 w-4" />} label="Meus Dados" onClick={() => navigateTo('/minha-conta')} />
                <DropdownBtn icon={<KeyRound className="h-4 w-4" />} label="Alterar Senha" onClick={() => navigateTo('/minha-conta/senha')} />
                {user?.role === 'admin' && (
                  <DropdownBtn icon={<Settings className="h-4 w-4" />} label="Gerenciar Usuários" onClick={() => navigateTo('/usuarios')} />
                )}
              </div>

              <div className="border-t border-gray-50 p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white shadow-md flex flex-col transition-all duration-200 overflow-hidden',
          open ? 'w-60' : 'w-14',
        )}
      >
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

function DropdownBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}
