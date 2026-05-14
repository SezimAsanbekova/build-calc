'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/app/admin/components/AdminSidebar';
import AdminAuthGuard, { AdminUser } from '@/app/admin/components/AdminAuthGuard';
import {
  Users,
  Package,
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
  Calculator,
  Tag,
} from 'lucide-react';

interface Stats {
  users: number;
  materials: number;
  calculations: number;
  estimates: number;
}

function DashboardContent({ admin }: { admin: AdminUser }) {
  const [stats, setStats] = useState<Stats>({ users: 0, materials: 0, calculations: 0, estimates: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // оставляем нули
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Пользователей',
      value: stats.users,
      icon: Users,
      bg: 'bg-blue-900/30',
      border: 'border-blue-700/40',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Материалов',
      value: stats.materials,
      icon: Package,
      bg: 'bg-purple-900/30',
      border: 'border-purple-700/40',
      text: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
    },
    {
      label: 'Расчётов',
      value: stats.calculations,
      icon: Calculator,
      bg: 'bg-green-900/30',
      border: 'border-green-700/40',
      text: 'text-green-400',
      iconBg: 'bg-green-500/10',
    },
    {
      label: 'Смет',
      value: stats.estimates,
      icon: FileText,
      bg: 'bg-amber-900/30',
      border: 'border-amber-700/40',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
    },
  ];

  const recentActivity = [
    { icon: Users, text: 'Управление пользователями', sub: '/admin/users', color: 'text-blue-400' },
    { icon: Package, text: 'Каталог материалов', sub: '/admin/materials', color: 'text-purple-400' },
    { icon: Tag, text: 'Категории и производители', sub: '/admin/categories', color: 'text-green-400' },
    { icon: BarChart3, text: 'Статистика системы', sub: '/admin/statistics', color: 'text-amber-400' },
  ];

  return (
    <main className="flex-1 overflow-auto">
      {/* Top header */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-slate-400">Обзор системы BuildCalc AI</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Система работает</span>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            Добро пожаловать, {admin.name || 'Администратор'} 👋
          </h2>
          <p className="text-slate-400 text-sm">{admin.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`${card.bg} border ${card.border} rounded-xl p-5`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.text}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                </div>
                <p className={`text-3xl font-bold ${card.text} mb-1`}>
                  {loadingStats ? (
                    <span className="inline-block w-8 h-7 bg-slate-700/50 rounded animate-pulse" />
                  ) : (
                    card.value.toLocaleString('ru-RU')
                  )}
                </p>
                <p className="text-sm text-slate-400">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick access + System info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick access */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-5">
              <Activity className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-white">Быстрый доступ</h3>
            </div>
            <div className="space-y-2">
              {recentActivity.map((item, i) => {
                const Icon = item.icon;
                return (
                  <a
                    key={i}
                    href={item.sub}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700/40 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        {item.text}
                      </p>
                      <p className="text-xs text-slate-500">{item.sub}</p>
                    </div>
                    <TrendingUp className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* System info */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-5">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-white">Информация о системе</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Версия приложения', value: 'BuildCalc AI v0.1.0' },
                { label: 'База данных', value: 'PostgreSQL + Prisma' },
                { label: 'Фреймворк', value: 'Next.js 16.2' },
                { label: 'Роль', value: 'Администратор', highlight: true },
                { label: 'Статус', value: 'Работает', green: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className={`text-xs font-medium ${row.highlight ? 'text-amber-400' : row.green ? 'text-green-400' : 'text-slate-300'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminAuthGuard>
      {(admin) => (
        <>
          <AdminSidebar adminName={admin.name} adminEmail={admin.email} />
          <DashboardContent admin={admin} />
        </>
      )}
    </AdminAuthGuard>
  );
}
