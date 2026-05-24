'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Calculator,
  ChevronRight,
  Trash2,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Layers,
  Package,
  Ruler,
  Calendar,
  DollarSign,
  Plus,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTranslation } from '@/app/i18n/useTranslation';

const ROOM_KEYS: Record<string, string> = {
  kitchen: 'room.kitchen',
  bathroom: 'room.bathroom',
  bedroom: 'room.bedroom',
  living_room: 'room.living',
  office: 'room.office',
};

const SURFACE_KEYS: Record<string, string> = {
  walls: 'surface.walls',
  floor: 'surface.floor',
  ceiling: 'surface.ceiling',
  full_room: 'surface.full',
};

const LEVEL_KEYS: Record<string, string> = {
  economy: 'level.economy',
  standard: 'level.standard',
  premium: 'level.premium',
};

const LEVEL_COLORS: Record<string, string> = {
  economy: 'bg-emerald-100 text-emerald-700',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-violet-100 text-violet-700',
};

interface CalcItem {
  id: string;
  projectName: string;
  roomType: string;
  surfaceType: string;
  repairLevel: string;
  length: number;
  width: number;
  height: number | null;
  area: number;
  budget: number;
  createdAt: string;
  totalPrice: number;
  fitsBudget: boolean;
  isFullRoom: boolean;
  surfaceCount: number;
  materialCount: number;
  remaining: number;
}

export default function CalculationsPage() {
  const { status, isReady } = useAuthGuard();
  const router = useRouter();
  const { t } = useTranslation('calculations');
  const { t: tc } = useTranslation('common');
  const [items, setItems] = useState<CalcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);


  const loadCalcs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calculations');
      const data = await res.json();
      setItems(data.calculations ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) loadCalcs();
  }, [isReady, loadCalcs]);

  async function handleOpen(id: string) {
    setOpeningId(id);
    try {
      const res = await fetch(`/api/calculations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      sessionStorage.setItem('calc_result', JSON.stringify(data));
      router.push('/calculations/result');
    } catch {
      /* ignore */
    } finally {
      setOpeningId(null);
    }
  }

  function handleRepeat(item: CalcItem) {
    sessionStorage.setItem(
      'calc_prefill',
      JSON.stringify({
        projectName: item.projectName,
        roomType: item.roomType,
        surfaceType: item.surfaceType,
        repairLevel: item.repairLevel,
        length: String(item.length),
        width: String(item.width),
        height: item.height != null ? String(item.height) : '',
        budget: String(item.budget),
      }),
    );
    router.push('/calculations/new');
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/calculations/${deleteId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((c) => c.id !== deleteId));
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">{t('list.title')}</span>
          </div>
          <button
            onClick={() => router.push('/calculations/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus size={15} />
            {t('new.title')}
          </button>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('list.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {items.length > 0
                ? `${items.length} ${t('list.count')}`
                : t('list.subtitle')}
            </p>
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                <Calculator size={36} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('list.empty')}</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                {t('list.emptyDesc')}
              </p>
              <button
                onClick={() => router.push('/calculations/new')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
              >
                <Plus size={16} />
                {t('list.createFirst')}
              </button>
            </div>
          )}

          {/* Grid */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Card header */}
                  <div className="p-5 pb-4 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {item.projectName}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {/* Budget status badge */}
                      <span
                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.fitsBudget
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {item.fitsBudget ? (
                          <CheckCircle size={11} />
                        ) : (
                          <AlertTriangle size={11} />
                        )}
                        {item.fitsBudget ? t('result.fitsBudget') : t('result.overBudget')}
                      </span>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                        {ROOM_KEYS[item.roomType] ? t(ROOM_KEYS[item.roomType]) : item.roomType}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs">
                        {SURFACE_KEYS[item.surfaceType] ? t(SURFACE_KEYS[item.surfaceType]) : item.surfaceType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs ${LEVEL_COLORS[item.repairLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                        {LEVEL_KEYS[item.repairLevel] ? t(LEVEL_KEYS[item.repairLevel]) : item.repairLevel}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Ruler size={12} className="text-gray-400" />
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">{t('new.dimensions')}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                          {item.length} × {item.width}
                          {item.height != null ? ` × ${item.height}` : ''} м
                        </p>
                        <p className="text-xs text-gray-500">{item.area.toFixed(1)} м²</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Package size={12} className="text-gray-400" />
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">{t('result.materials')}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{item.materialCount} {t('result.items')}</p>
                        <p className="text-xs text-gray-500">
                          {item.surfaceCount} {t('result.surfaces')}
                        </p>
                      </div>
                    </div>

                    {/* Price block */}
                    <div className="rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{t('result.total')}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {item.totalPrice.toLocaleString('ru-RU')} сом
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                          {item.remaining >= 0 ? t('result.remaining') : t('result.overspend')}
                        </p>
                        <p className={`text-sm font-semibold ${item.remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {item.remaining >= 0 ? '+' : ''}{item.remaining.toLocaleString('ru-RU')} сом
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 flex gap-2 border-t border-gray-50 pt-4">
                    <button
                      onClick={() => handleOpen(item.id)}
                      disabled={openingId === item.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60"
                    >
                      {openingId === item.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ExternalLink size={13} />
                      )}
                      {t('list.open')}
                    </button>
                    <button
                      onClick={() => handleRepeat(item)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-200 transition-all"
                    >
                      <RotateCcw size={13} />
                      {t('list.repeat')}
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-xl hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('list.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('list.deleteDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                {tc('buttons.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-all disabled:opacity-60"
              >
                {deleting ? tc('buttons.loading') : tc('buttons.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
