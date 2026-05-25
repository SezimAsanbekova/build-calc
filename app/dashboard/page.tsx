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
  Clock,
  ArrowRight,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTranslation } from '@/app/i18n/useTranslation';

interface DashboardStats {
  materialCount: number;
  calculationCount: number;
  estimateCount: number;
}

interface ActivityItem {
  id: string;
  projectName: string | null;
  roomType: string;
  surfaceType: string;
  repairLevel: string;
  budget: string | null;
  area: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');

  useEffect(() => {
    const fetchAll = () => {
      fetch('/api/dashboard/stats').then((r) => {
        if (r.ok) r.json().then((data) => setStats(data));
      }).catch(() => {});
      fetch('/api/dashboard/activity').then((r) => {
        if (r.ok) r.json().then((data) => {
          setActivity(data.calculations ?? []);
          setActivityLoading(false);
        });
      }).catch(() => setActivityLoading(false));
    };

    if (status === 'authenticated') {
      fetchAll();
    } else if (status === 'unauthenticated') {
      fetch('/api/auth/me').then((r) => {
        if (r.ok) {
          fetchAll();
        } else {
          router.push('/login');
        }
      }).catch(() => router.push('/login'));
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{tc('buttons.loading')}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { labelKey: 'stats.calculations', value: stats ? stats.calculationCount.toLocaleString('ru-RU') : '—', icon: Calculator, color: 'blue' },
    { labelKey: 'stats.estimates',    value: stats ? stats.estimateCount.toLocaleString('ru-RU') : '—',    icon: FileText,   color: 'purple' },
    { labelKey: 'stats.materials',    value: stats ? stats.materialCount.toLocaleString('ru-RU') : '—',    icon: Package,    color: 'green' },
  ];

  const quickActions = [
    { labelKey: 'actions.newCalc',   icon: Calculator, href: '/calculations/new', color: 'blue' },
    { labelKey: 'actions.estimates', icon: FileText,   href: '/estimates',        color: 'purple' },
    { labelKey: 'actions.history',   icon: History,    href: '/calculations',     color: 'green' },
    { labelKey: 'actions.settings',  icon: Settings,   href: '/profile',          color: 'gray' },
  ];

  const SURFACE_LABEL: Record<string, string> = { wall: 'Стены', floor: 'Пол', ceiling: 'Потолок', full_room: 'Весь ремонт' };
  const REPAIR_LABEL: Record<string, string> = { econom: 'Эконом', standard: 'Стандарт', premium: 'Премиум' };

  const openCalculation = async (id: string) => {
    setOpeningId(id);
    try {
      const res = await fetch(`/api/calculations/${id}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      sessionStorage.setItem('calc_result', JSON.stringify(data));
      router.push('/calculations/result');
    } catch {
      setOpeningId(null);
    }
  };

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
            <span className="text-sm font-medium text-gray-700">{session?.user?.name || tc('nav.user')}</span>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('title')}, {session?.user?.name || tc('nav.user')}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
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
                <p className="text-sm text-gray-600">{t(stat.labelKey)}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('quickActions')}</h2>
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
                    {t(action.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('activity.title')}</h2>
            {activity.length > 0 && (
              <button
                onClick={() => router.push('/calculations')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Все расчёты <ArrowRight size={14} />
              </button>
            )}
          </div>

          {activityLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">{t('activity.empty')}</p>
              <button
                onClick={() => router.push('/calculations/new')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                {t('activity.firstCalc')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3.5 hover:bg-gray-50/70 rounded-xl px-2 -mx-2 transition-colors cursor-pointer group"
                  onClick={() => openCalculation(item.id)}
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calculator size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.projectName || `Расчёт — ${item.roomType}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {SURFACE_LABEL[item.surfaceType] ?? item.surfaceType}
                      {' · '}{REPAIR_LABEL[item.repairLevel] ?? item.repairLevel}
                      {' · '}{item.area.toFixed(1)} м²
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.budget && (
                      <p className="text-sm font-bold text-gray-900">
                        {Math.round(parseFloat(item.budget)).toLocaleString('ru-RU')} сом
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                      <Clock size={10} />
                      {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {openingId === item.id ? (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        </main>
      </div>
    </div>
  );
}
