'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Package,
  Tag,
  Factory,
  GitMerge,
  Shuffle,
  Users,
  Calculator,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  {
    section: 'Главная',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    ],
  },
  {
    section: 'Каталог',
    items: [
      { label: 'Материалы', icon: Package, href: '/admin/materials' },
      { label: 'Категории', icon: Tag, href: '/admin/categories' },
      { label: 'Производители', icon: Factory, href: '/admin/manufacturers' },
      { label: 'Совместимость', icon: GitMerge, href: '/admin/compatibility' },
      { label: 'Альтернативы', icon: Shuffle, href: '/admin/alternatives' },
    ],
  },
  {
    section: 'Пользователи',
    items: [
      { label: 'Пользователи', icon: Users, href: '/admin/users' },
    ],
  },
  {
    section: 'Расчёты',
    items: [
      { label: 'Расчёты', icon: Calculator, href: '/admin/calculations' },
      { label: 'Сметы', icon: FileText, href: '/admin/estimates' },
    ],
  },
  {
    section: 'Система',
    items: [
      { label: 'Статистика', icon: BarChart3, href: '/admin/statistics' },
      { label: 'Настройки', icon: Settings, href: '/admin/settings' },
    ],
  },
];

interface AdminSidebarProps {
  adminName?: string | null;
  adminEmail?: string;
}

export default function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-700 flex-shrink-0 bg-slate-800/50 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 leading-none uppercase tracking-widest">BuildCalc AI</p>
            <p className="text-sm font-semibold text-white leading-tight whitespace-nowrap">Администратор</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((group) => (
          <div key={group.section} className="mb-2">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1">
                {group.section}
              </p>
            )}
            {collapsed && <div className="border-t border-slate-700/50 my-2" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg transition-all duration-150 group
                    ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'space-x-3 px-3 py-2.5'}
                    ${active
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
                    }`}
                >
                  <Icon className={`flex-shrink-0 transition-colors ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {active && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Admin info + logout */}
      <div className="flex-shrink-0 border-t border-slate-700 p-3">
        {!collapsed ? (
          <div className="flex items-center space-x-3 px-2 py-2 rounded-lg bg-slate-700/30 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminName || 'Администратор'}</p>
              <p className="text-xs text-slate-400 truncate">{adminEmail}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Выйти' : undefined}
          className={`w-full flex items-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all text-sm
            ${collapsed ? 'justify-center py-2' : 'space-x-2 px-3 py-2'}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Выйти</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-700 transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-700 transition-all duration-300 z-30
          ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Spacer for desktop layout */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`} />
    </>
  );
}
