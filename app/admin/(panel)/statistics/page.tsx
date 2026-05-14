'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, Package, Calculator, FileText, TrendingUp } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

interface Stats {
  users: number;
  materials: number;
  calculations: number;
  estimates: number;
}

export default function AdminStatisticsPage() {
  return (
    <AdminPageShell title="Статистика" subtitle="Аналитика и показатели системы">
      {() => <StatisticsContent />}
    </AdminPageShell>
  );
}

function StatisticsContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) setStats(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Всего пользователей', key: 'users' as const, icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-700/40' },
    { label: 'Материалов в каталоге', key: 'materials' as const, icon: Package, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-700/40' },
    { label: 'Расчётов выполнено', key: 'calculations' as const, icon: Calculator, color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-700/40' },
    { label: 'Смет создано', key: 'estimates' as const, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-700/40' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className={`${card.bg} border ${card.border} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </div>
              {loading ? (
                <div className="w-16 h-8 bg-slate-700/50 rounded animate-pulse mb-1" />
              ) : (
                <p className={`text-3xl font-bold ${card.color} mb-1`}>
                  {(stats?.[card.key] ?? 0).toLocaleString('ru-RU')}
                </p>
              )}
              <p className="text-sm text-slate-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-900/30 border border-amber-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Детальная аналитика</h3>
        <p className="text-slate-400 text-sm">Графики и детальная статистика будут доступны после накопления данных</p>
      </div>
    </div>
  );
}
