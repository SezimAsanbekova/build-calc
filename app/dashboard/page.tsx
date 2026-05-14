'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  History, 
  Settings,
  TrendingUp,
  Package,
  Users
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
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

  const stats = [
    { label: 'Всего расчетов', value: '0', icon: Calculator, color: 'blue' },
    { label: 'Сохраненные сметы', value: '0', icon: FileText, color: 'purple' },
    { label: 'Материалов в базе', value: '1,234', icon: Package, color: 'green' },
    { label: 'Активных пользователей', value: '567', icon: Users, color: 'orange' },
  ];

  const quickActions = [
    { label: 'Новый расчет', icon: Calculator, href: '/calculations/new', color: 'blue' },
    { label: 'Мои сметы', icon: FileText, href: '/estimates', color: 'purple' },
    { label: 'История', icon: History, href: '/history', color: 'green' },
    { label: 'Настройки', icon: Settings, href: '/settings', color: 'gray' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Добро пожаловать, {session.user?.name || 'Пользователь'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Управляйте своими расчетами и сметами
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
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
    </div>
  );
}
