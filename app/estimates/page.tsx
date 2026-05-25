'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FileText, ChevronRight, ArrowLeft, Calculator, Clock,
  Package, ExternalLink, Inbox,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface EstimateItem { id: string; }

interface EstimateCalc {
  id: string;
  projectName: string | null;
  roomType: string;
  surfaceType: string;
  repairLevel: string;
  area: number;
}

interface Estimate {
  id: string;
  totalPrice: string;
  status: string;
  createdAt: string;
  calculation: EstimateCalc;
  items: EstimateItem[];
}

const SURFACE_LABEL: Record<string, string> = {
  wall: 'Стены', floor: 'Пол', ceiling: 'Потолок', full_room: 'Весь ремонт',
};
const REPAIR_LABEL: Record<string, string> = {
  econom: 'Эконом', standard: 'Стандарт', premium: 'Премиум',
};

export default function EstimatesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      fetch('/api/auth/me').then((r) => {
        if (!r.ok) router.push('/login');
        else loadEstimates();
      }).catch(() => router.push('/login'));
    } else if (status === 'authenticated') {
      loadEstimates();
    }
  }, [status]);

  const loadEstimates = () => {
    fetch('/api/estimates')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setEstimates(data.estimates ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const openCalculation = async (calcId: string, estimateId: string) => {
    setOpeningId(estimateId);
    try {
      const res = await fetch(`/api/calculations/${calcId}`);
      if (!res.ok) throw new Error();
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
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={14} /> Dashboard
            </button>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">Мои сметы</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {estimates.length > 0 ? `${estimates.length} смет` : ''}
            </span>
          </div>
        </header>

        <main className="flex-1 px-8 py-8 max-w-4xl w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Мои сметы</h1>
            <p className="text-sm text-gray-500 mt-1">Сохранённые сметы по вашим расчётам</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : estimates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-2">Сметы отсутствуют</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Сметы сохраняются автоматически при скачивании из страницы результатов расчёта
                </p>
                <button
                  onClick={() => router.push('/calculations/new')}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  Создать новый расчёт
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {/* Table header */}
                <div className="grid px-6 py-3 bg-gray-50/60 rounded-t-xl"
                  style={{ gridTemplateColumns: '1fr 180px 120px 100px 44px' }}>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Проект</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Параметры</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Сумма</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Дата</span>
                  <span />
                </div>

                {estimates.map((est) => (
                  <div
                    key={est.id}
                    className="grid items-center px-6 py-4 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    style={{ gridTemplateColumns: '1fr 180px 120px 100px 44px' }}
                    onClick={() => openCalculation(est.calculation.id, est.id)}
                  >
                    {/* Project name */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calculator size={16} className="text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {est.calculation.projectName || `Расчёт — ${est.calculation.roomType}`}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <Package size={9} />
                          {est.items.length} позиций
                        </p>
                      </div>
                    </div>

                    {/* Params */}
                    <div className="hidden sm:block min-w-0 pr-4">
                      <p className="text-xs text-gray-600 truncate">
                        {SURFACE_LABEL[est.calculation.surfaceType] ?? est.calculation.surfaceType}
                        {' · '}{REPAIR_LABEL[est.calculation.repairLevel] ?? est.calculation.repairLevel}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{est.calculation.area.toFixed(1)} м²</p>
                    </div>

                    {/* Total */}
                    <div className="text-right pr-4">
                      <p className="text-sm font-bold text-gray-900">
                        {Math.round(parseFloat(est.totalPrice)).toLocaleString('ru-RU')}
                      </p>
                      <p className="text-[10px] text-gray-400">сом</p>
                    </div>

                    {/* Date */}
                    <div className="text-right pr-3">
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        {new Date(est.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      {openingId === est.id ? (
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
