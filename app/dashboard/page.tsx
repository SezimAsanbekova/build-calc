'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  History, 
  Settings,
  TrendingUp,
  Package,
  ChevronRight,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface DashboardStats {
  materialCount: number;
  calculationCount: number;
  estimateCount: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetch('/api/dashboard/stats')
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(() => {});
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statCards = [
    {
      label: 'Всего расчетов',
      value: stats ? stats.calculationCount.toLocaleString('ru-RU') : '—',
      icon: Calculator,
      color: 'blue',
    },
    {
      label: 'Сохраненные сметы',
      value: stats ? stats.estimateCount.toLocaleString('ru-RU') : '—',
      icon: FileText,
      color: 'purple',
    },
    {
      label: 'Материалов в базе',
      value: stats ? stats.materialCount.toLocaleString('ru-RU') : '—',
      icon: Package,
      color: 'green',
    },
  ];

  const quickActions = [
    { label: 'Новый расчет', icon: Calculator, href: '/calculations/new', color: 'blue' },
    { label: 'Мои сметы', icon: FileText, href: '/estimates', color: 'purple' },
    { label: 'История', icon: History, href: '/history', color: 'green' },
    { label: 'Настройки', icon: Settings, href: '/settings', color: 'gray' },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">Главная</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{session.user?.name || 'Пользователь'}</span>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Добро пожаловать, {session.user?.name || 'Пользователь'}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">Управляйте своими расчетами и сметами</p>
          </div>

          <div className="">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => router.push(action.href)}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className={`w-14 h-14 bg-${action.color}-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Последняя активность</h2>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">Пока нет активности</p>
            <button
              onClick={() => router.push('/calculations/new')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Создать первый расчет
            </button>
          </div>
        </div>
        </div>
        </main>
      </div>
    </div>
  );
}
