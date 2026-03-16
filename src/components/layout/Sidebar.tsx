'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  KeyRound,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Inventário', icon: LayoutDashboard },
  { href: '/produtos', label: 'Movimentações', icon: Package },
  { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
];

const pageTitles: Record<string, string> = {
  '/': 'Inventário',
  '/produtos': 'Movimentações',
  '/usuarios': 'Usuários',
  '/minha-conta': 'Minha Conta',
  '/minha-conta/senha': 'Alterar Senha',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const navigateTo = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  const filteredNav = navItems.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <>
      {/* Top navbar */}
      <header className="fixed top-0 right-0 left-0 z-40 h-14 bg-white border-b border-gray-200/80">
        <div className={cn('flex items-center h-full transition-all duration-200', expanded ? 'ml-56' : 'ml-16')}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center flex-1 px-4 sm:px-5">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-gray-800 truncate">{pageTitle}</h1>
            </div>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user?.nome?.charAt(0)?.toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight max-w-[120px] truncate">{user?.nome}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{user?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                </div>
                <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform hidden sm:block', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
                  <div className="px-4 py-3 bg-gray-50/80">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email || user?.cpf}</p>
                  </div>

                  <div className="p-1.5">
                    <DropdownBtn icon={<User className="h-4 w-4" />} label="Meus Dados" onClick={() => navigateTo('/minha-conta')} />
                    <DropdownBtn icon={<KeyRound className="h-4 w-4" />} label="Alterar Senha" onClick={() => navigateTo('/minha-conta/senha')} />
                    {user?.role === 'admin' && (
                      <DropdownBtn icon={<Settings className="h-4 w-4" />} label="Gerenciar Usuários" onClick={() => navigateTo('/usuarios')} />
                    )}
                  </div>

                  <div className="border-t border-gray-100 p-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 sm:hidden animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 ease-in-out',
          'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950',
          'hidden sm:flex',
          expanded ? 'w-56' : 'w-16',
        )}
      >
        {/* Logo */}
        <Link href="/" className={cn('h-14 flex items-center justify-center shrink-0 overflow-hidden transition-all duration-200', expanded ? 'px-4 gap-2.5' : 'px-0')}>
          <Image
            src="/favicon.png"
            alt="Previsão"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0"
            priority
          />
          {expanded && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight tracking-tight truncate">PREVISÃO</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-tight">Presilhas</p>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!expanded ? item.label : undefined}
                className={cn(
                  'group flex items-center rounded-lg transition-all duration-150',
                  expanded ? 'px-3 py-2.5 gap-3' : 'justify-center py-2.5',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-gray-400 hover:bg-white/8 hover:text-gray-200',
                )}
              >
                <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-accent-light')} />
                {expanded && (
                  <span className="text-[13px] font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user pill */}
        <div className="px-2 pb-3 mt-auto">
          <div
            className={cn(
              'flex items-center rounded-lg bg-white/8 transition-all duration-150',
              expanded ? 'px-3 py-2.5 gap-3' : 'justify-center py-2.5',
            )}
          >
            <div className="w-7 h-7 rounded-full bg-accent/80 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.nome?.charAt(0)?.toUpperCase()}
            </div>
            {expanded && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-200 truncate">{user?.nome}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.role === 'admin' ? 'Admin' : 'Operador'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col sm:hidden transition-transform duration-200',
          'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/favicon.png"
              alt="Previsão"
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
              priority
            />
            <div>
              <p className="text-sm font-bold text-white leading-tight tracking-tight">PREVISÃO</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-tight">Presilhas</p>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 pt-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-gray-400 hover:bg-white/8 hover:text-gray-200',
                )}
              >
                <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-accent-light')} />
                <span className="text-[13px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/8">
            <div className="w-7 h-7 rounded-full bg-accent/80 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.nome?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-200 truncate">{user?.nome}</p>
              <p className="text-[10px] text-gray-500">{user?.role === 'admin' ? 'Admin' : 'Operador'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function DropdownBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left cursor-pointer"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}
