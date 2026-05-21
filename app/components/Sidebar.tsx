'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Calculator,
  ClipboardList,
  BookOpen,
  User,
  LogOut,
  Zap,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Новый расчет', href: '/calculations/new', icon: Calculator },
  { label: 'Мои расчеты', href: '/calculations', icon: ClipboardList },
  { label: 'Каталог', href: '/catalog', icon: BookOpen },
  { label: 'Профиль', href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 leading-tight">BuildCalc</span>
            <span className="block text-[11px] font-medium text-blue-600 leading-tight tracking-wide">AI Platform</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Меню
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/calculations'
              ? pathname === '/calculations'
              : pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                }`}
                size={18}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User block */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {session?.user?.name || 'Пользователь'}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {session?.user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
        >
          <LogOut size={16} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
