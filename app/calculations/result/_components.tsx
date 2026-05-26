'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, ShieldCheck, Info, PiggyBank, RefreshCw, Trash2, Plus, Minus,
  Search, X, Check, Loader2, Brain, Star, TrendingDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResultItem {
  materialId: string;
  variantItemId?: string | null;
  quantity: number;
  packageCount: number;
  unitPrice: number;
  totalPrice: number;
  material: {
    id: string;
    name: string;
    unit: string;
    packageUnit: string;
    packageQuantity: number;
    category: { name: string };
    manufacturer: { name: string };
  };
}

export interface EditableItem extends ResultItem {
  _id: string;
}

export interface EditableGroup {
  surface: string;
  label: string;
  surfaceArea: number;
  items: EditableItem[];
}

export interface HistoryEntry {
  type: 'replace' | 'delete' | 'qty' | 'add' | 'restore';
  description: string;
  time: string;
  payload?: { groupIndex: number; item: EditableItem };
  restored?: boolean;
}

export interface SmartRecommendation {
  type: 'warning' | 'success' | 'info' | 'saving';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export type TFunc = (key: string, params?: Record<string, string>) => string;

// ─── REC styles ───────────────────────────────────────────────────────────────

export const REC_STYLES = {
  warning: { card: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100', iconColor: 'text-amber-600', title: 'text-amber-900', desc: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', Icon: AlertTriangle },
  success: { card: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-100', iconColor: 'text-emerald-600', title: 'text-emerald-900', desc: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
  info:    { card: 'bg-blue-50 border-blue-200', icon: 'bg-blue-100', iconColor: 'text-blue-600', title: 'text-blue-900', desc: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', Icon: Info },
  saving:  { card: 'bg-violet-50 border-violet-200', icon: 'bg-violet-100', iconColor: 'text-violet-600', title: 'text-violet-900', desc: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', Icon: PiggyBank },
} as const;

// ─── SmartRecommendationsBlock ────────────────────────────────────────────────

export function SmartRecommendationsBlock({ recs, t }: { recs: SmartRecommendation[]; t: TFunc }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
          <Brain size={15} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-800">{t('result.smartTitle')}</h2>
          <p className="text-xs text-gray-400">{t('result.smartSubtitle')}</p>
        </div>
        {recs.length > 0 && (
          <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {recs.length} {t('result.recCount')}
          </span>
        )}
      </div>
      {recs.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{t('result.noProblems')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {recs.map((rec, i) => {
            const s = REC_STYLES[rec.type];
            const RecIcon = s.Icon;
            return (
              <div key={i} className={`flex gap-3 p-4 rounded-xl border ${s.card}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${s.icon}`}>
                  <RecIcon size={16} className={s.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className={`text-sm font-semibold ${s.title}`}>{rec.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.badge}`}>
                      {t(`result.priority.${rec.priority}`)}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${s.desc}`}>{rec.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ReplacePanel ─────────────────────────────────────────────────────────────

export interface AlternativeMaterial {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category: { name: string };
  manufacturer: { name: string };
  priceDifference: number;
  priceDifferencePct: number;
  cheaper: boolean;
  compatibilityScore?: number;
  cheaperBy?: number | null;
  reason?: string | null;
}

interface ReplacePanelProps {
  item: EditableItem;
  budget: number;
  onReplace: (item: EditableItem, alt: AlternativeMaterial) => void;
  onClose: () => void;
}

export interface AiConflict {
  material1: string;
  material2: string;
  reason: string | null;
}

export interface AiAlternativesModalProps {
  item: EditableItem;
  budget: number;
  onReplace: (item: EditableItem, alt: AlternativeMaterial, newVariantItemId?: string) => void;
  onClose: () => void;
}

export function ReplacePanel({ item, budget, onReplace, onClose }: ReplacePanelProps) {
  const [alternatives, setAlternatives] = useState<AlternativeMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string>('manual');

  useEffect(() => {
    setLoading(true);
    fetch('/api/alternatives/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId: item.materialId, budget }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAlternatives(data.alternatives ?? []);
        setReason(data.reason ?? 'manual');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.materialId, budget]);

  const reasonLabel: Record<string, string> = {
    'unavailable': '⚠ Материал недоступен',
    'over-budget': '💸 Материал превышает бюджет',
    'manual': '🔄 Аналогичные материалы',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-xs text-gray-400 mb-0.5">{reasonLabel[reason]}</p>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">{item.material.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.material.manufacturer.name} · {item.unitPrice.toLocaleString('ru-RU')} сом/уп.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 size={20} className="text-blue-600 animate-spin" />
              <p className="text-sm text-gray-400">Подбираем аналоги...</p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
              <Info size={20} className="text-gray-300" />
              <p className="text-sm text-gray-400">Аналоги не найдены</p>
              <p className="text-xs text-gray-300">Попробуйте добавить материал вручную</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alternatives.map((alt) => {
                const diffSign = alt.priceDifference < 0 ? '−' : '+';
                const diffColor = alt.priceDifference < 0 ? 'text-emerald-600' : 'text-red-500';
                return (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => onReplace(item, alt)}
                    disabled={!alt.isAvailable}
                    className="w-full text-left p-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{alt.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{alt.manufacturer.name}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{alt.price.toLocaleString('ru-RU')} сом/уп.</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-semibold ${diffColor}`}>
                          {diffSign}{Math.abs(Math.round(alt.priceDifference)).toLocaleString('ru-RU')} сом
                        </span>
                        <p className={`text-[10px] ${diffColor}`}>
                          {diffSign}{Math.abs(Math.round(alt.priceDifferencePct))}%
                        </p>
                        {alt.cheaper && (
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">дешевле</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check size={11} className="text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Выбрать</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AiAlternativesModal ──────────────────────────────────────────

export function AiAlternativesModal({ item, budget, onReplace, onClose }: AiAlternativesModalProps) {
  const [alternatives, setAlternatives] = useState<AlternativeMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<AiConflict[]>([]);
  const [conflictFor, setConflictFor] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setConflicts([]);
    fetch('/api/alternatives/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId: item.materialId, budget }),
    })
      .then((r) => r.json())
      .then((data) => setAlternatives(data.alternatives ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.materialId, budget]);

  const handleSelect = useCallback(async (alt: AlternativeMaterial) => {
    setConflicts([]);
    setConflictFor(null);

    if (item.variantItemId) {
      setReplacing(alt.id);
      try {
        const res = await fetch('/api/calculations/replace-material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantItemId: item.variantItemId, newMaterialId: alt.id }),
        });
        let data: Record<string, unknown> = {};
        try { data = await res.json(); } catch { /* non-JSON response */ }

        if (!res.ok) {
          if (data.incompatible) {
            setConflicts((data.conflicts as AiConflict[]) ?? []);
            setConflictFor(alt.name);
            return; // \u0411\u043b\u043e\u043a\u0438\u0440\u0443\u0435\u043c: \u043d\u0435\u0441\u043e\u0432\u043c\u0435\u0441\u0442\u0438\u043c\u044b\u0435 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044b
          }
          if (data.incompatibleAttributes) {
            setConflicts([{ material1: item.material.name, material2: alt.name, reason: data.error as string }]);
            setConflictFor(alt.name);
            return; // \u0411\u043b\u043e\u043a\u0438\u0440\u0443\u0435\u043c: \u043d\u0435\u0441\u043e\u0432\u043c\u0435\u0441\u0442\u0438\u043c\u044b\u0435 \u0430\u0442\u0440\u0438\u0431\u0443\u0442\u044b
          }
          // \u0414\u0440\u0443\u0433\u0438\u0435 \u043e\u0448\u0438\u0431\u043a\u0438 (500, auth) \u2014 \u0434\u0435\u043b\u0430\u0435\u043c client-side \u0437\u0430\u043c\u0435\u043d\u0443 \u0431\u0435\u0437 DB
          onReplace(item, alt);
          return;
        }
        onReplace(item, alt, data.newItem ? (data.newItem as Record<string, string>).variantItemId : undefined);
      } finally {
        setReplacing(null);
      }
    } else {
      onReplace(item, alt);
    }
  }, [item, onReplace]);

  const totalSavings = alternatives
    .filter((a) => a.cheaper && a.isAvailable)
    .reduce((max, a) => Math.abs(a.priceDifference) * item.packageCount > max ? Math.abs(a.priceDifference) * item.packageCount : max, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg max-h-[88vh] sm:rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain size={13} className="text-white" />
              </div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">AI-альтернативы</p>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">{item.material.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {item.material.manufacturer.name} · {Number(item.unitPrice).toLocaleString('ru-RU')} сом/уп.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Budget savings banner */}
        {totalSavings > 0 && (
          <div className="mx-4 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
            <TrendingDown size={14} className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">
              Макс. экономия: −{Math.round(totalSavings).toLocaleString('ru-RU')} сом
            </p>
          </div>
        )}

        {/* Conflict warning */}
        {conflicts.length > 0 && (
          <div className="mx-4 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-semibold text-red-700 mb-1">⚠ Несовместимые материалы ({conflictFor})</p>
            {conflicts.map((c, i) => (
              <p key={i} className="text-[11px] text-red-600">
                {c.material1} ✕ {c.material2}{c.reason ? ` — ${c.reason}` : ''}
              </p>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 size={20} className="text-blue-600 animate-spin" />
              <p className="text-sm text-gray-400">Подбираем AI-альтернативы...</p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
              <Brain size={20} className="text-gray-300" />
              <p className="text-sm text-gray-400">Альтернативы не найдены</p>
              <p className="text-xs text-gray-300">Добавьте материал вручную</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alternatives.map((alt) => {
                const diffSign = alt.priceDifference < 0 ? '−' : '+';
                const diffColor = alt.priceDifference < 0 ? 'text-emerald-600' : 'text-red-500';
                const isReplacing = replacing === alt.id;
                const savingsTotal = alt.cheaper ? Math.abs(alt.priceDifference) * item.packageCount : 0;
                return (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => handleSelect(alt)}
                    disabled={!alt.isAvailable || !!replacing}
                    className="w-full text-left p-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{alt.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{alt.manufacturer.name}</p>
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          {alt.price.toLocaleString('ru-RU')} сом/уп.
                        </p>
                        {alt.reason && (
                          <p className="text-[11px] text-blue-500 mt-0.5 italic">{alt.reason}</p>
                        )}
                        {savingsTotal > 0 && (
                          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                            Экономия: −{Math.round(savingsTotal).toLocaleString('ru-RU')} сом
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-sm font-semibold ${diffColor}`}>
                          {diffSign}{Math.abs(Math.round(alt.priceDifference)).toLocaleString('ru-RU')} сом
                        </span>
                        {typeof alt.compatibilityScore === 'number' && alt.compatibilityScore > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                            <Star size={9} fill="currentColor" />
                            {alt.compatibilityScore}%
                          </span>
                        )}
                        {alt.cheaper && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">дешевле</span>
                        )}
                        {!alt.isAvailable && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">недоступен</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {isReplacing ? (
                        <Loader2 size={11} className="text-blue-600 animate-spin" />
                      ) : (
                        <Check size={11} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      <span className={`text-xs font-medium ${isReplacing ? 'text-blue-600' : 'text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                        {isReplacing ? 'Заменяем...' : 'Выбрать'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AddMaterialModal ─────────────────────────────────────────────────────────

interface CatalogMaterial {
  id: string;
  name: string;
  price: number;
  unit: string;
  packageUnit: string;
  packageQuantity: number;
  consumptionPerM2: number;
  wasteFactor: number;
  category: { name: string };
  manufacturer: { name: string };
}

interface AddMaterialModalProps {
  groupLabel: string;
  onAdd: (mat: CatalogMaterial, packageCount: number) => void;
  onClose: () => void;
}

const LABEL_TO_SURFACE: Record<string, string> = {
  'Стены': 'wall',
  'Пол': 'floor',
  'Потолок': 'ceiling',
};

export function AddMaterialModal({ groupLabel, onAdd, onClose }: AddMaterialModalProps) {
  const [search, setSearch] = useState('');
  const [materials, setMaterials] = useState<CatalogMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CatalogMaterial | null>(null);
  const [packages, setPackages] = useState('1');

  const surfaceType = LABEL_TO_SURFACE[groupLabel] ?? '';

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: q, pageSize: '30' });
      if (surfaceType) params.set('surfaceType', surfaceType);
      const res = await fetch(`/api/catalog?${params.toString()}`);
      const data = await res.json();
      setMaterials(data.materials ?? []);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [surfaceType]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search, doSearch]);

  useEffect(() => { doSearch(''); }, [doSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Добавить материал</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {surfaceType
                ? <>Фильтр: <span className="font-medium text-blue-600">{groupLabel}</span></>
                : <>Секция: {groupLabel}</>
              }
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск материала..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="text-blue-600 animate-spin" />
            </div>
          ) : materials.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Ничего не найдено</p>
          ) : (
            <div className="space-y-1.5">
              {materials.map((mat) => (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setSelected(selected?.id === mat.id ? null : mat)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selected?.id === mat.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{mat.name}</p>
                      <p className="text-xs text-gray-400">{mat.manufacturer.name} · {mat.category.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {Number(mat.price).toLocaleString('ru-RU')} сом
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer — shown when material selected */}
        {selected && (
          <div className="border-t border-gray-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Количество упаковок</p>
                <input
                  type="number"
                  min="1"
                  value={packages}
                  onChange={(e) => setPackages(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Итого</p>
                <p className="text-sm font-bold text-gray-900">
                  {Math.round(Number(selected.price) * (parseInt(packages) || 1)).toLocaleString('ru-RU')} сом
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAdd(selected, parseInt(packages) || 1)}
              className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Добавить в смету
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MaterialsEditorTable ─────────────────────────────────────────────────────

interface MaterialsEditorTableProps {
  group: EditableGroup;
  groupIndex: number;
  budget: number;
  isFullRoom: boolean;
  onDelete: (groupIndex: number, itemId: string) => void;
  onReplace: (item: EditableItem) => void;
  onAiAlternatives: (item: EditableItem) => void;
  onQtyChange: (groupIndex: number, itemId: string, newPkgCount: number) => void;
  onAddMaterial: (groupIndex: number) => void;
  t: TFunc;
}

export function MaterialsEditorTable({
  group, groupIndex, budget, isFullRoom,
  onDelete, onReplace, onAiAlternatives, onQtyChange, onAddMaterial, t,
}: MaterialsEditorTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const groupTotal = group.items.reduce((s, i) => s + i.totalPrice, 0);

  const triggerDelete = (itemId: string) => {
    setConfirmingId(null);
    setDeletingId(itemId);
    setTimeout(() => {
      onDelete(groupIndex, itemId);
      setDeletingId(null);
    }, 220);
  };

  if (group.items.length === 0) {
    return (
      <div className="px-5 py-6">
        <button
          type="button"
          onClick={() => onAddMaterial(groupIndex)}
          className="w-full group flex flex-col items-center gap-3 py-8 border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <Plus size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-sm font-medium text-gray-400 group-hover:text-blue-600 transition-colors">Добавить первый материал</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Column headers */}
      <div className="grid items-center px-5 py-2.5 border-b border-gray-100 bg-gray-50/60"
        style={{ gridTemplateColumns: '1fr 140px 148px 90px 110px' }}>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Материал</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Производитель</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Количество</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Итого</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Действия</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50/80">
        {group.items.map((item) => {
          const isDeleting = deletingId === item._id;
          return (
            <div
              key={item._id}
              style={{ gridTemplateColumns: '1fr 140px 148px 90px 110px' }}
              className={[
                'grid items-center px-5 py-3 group/row',
                'hover:bg-slate-50/70 transition-all duration-150',
                isDeleting ? 'opacity-0 -translate-x-2 duration-[220ms]' : 'opacity-100 translate-x-0',
              ].join(' ')}
            >
              {/* Material name + category */}
              <div className="min-w-0 pr-3">
                <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{item.material.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.material.category.name}</p>
              </div>

              {/* Manufacturer + unit price */}
              <div className="min-w-0 pr-2 hidden sm:block">
                <p className="text-xs text-gray-400 truncate leading-snug">{item.material.manufacturer.name}</p>
                <p className="text-[11px] text-gray-300 mt-0.5">{Number(item.unitPrice).toLocaleString('ru-RU')} сом/уп.</p>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-1.5 justify-center">
                <div className="flex items-center h-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-blue-300 hover:shadow-blue-100 hover:shadow transition-all">
                  <button
                    type="button"
                    onClick={() => item.packageCount > 1 && onQtyChange(groupIndex, item._id, item.packageCount - 1)}
                    disabled={item.packageCount <= 1}
                    className="px-2.5 h-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={10} strokeWidth={2.5} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900 select-none tabular-nums">
                    {item.packageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQtyChange(groupIndex, item._id, item.packageCount + 1)}
                    className="px-2.5 h-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={10} strokeWidth={2.5} />
                  </button>
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0 w-10 truncate">{item.material.packageUnit}</span>
              </div>

              {/* Total price */}
              <div className="text-right pr-2">
                <p className="text-sm font-bold text-gray-900 tabular-nums">
                  {Math.round(item.totalPrice).toLocaleString('ru-RU')}
                </p>
                <p className="text-[10px] text-gray-400">сом</p>
              </div>

              {/* Action group */}
              <div className="flex items-center justify-center">
                {confirmingId === item._id ? (
                  <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-xl p-0.5 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      title="Отменить"
                      className="px-2 h-7 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-white transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerDelete(item._id)}
                      title="Подтвердить удаление"
                      className="px-2 h-7 rounded-lg text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-all"
                    >
                      Удалить
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 bg-gray-100/80 rounded-xl p-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150">
                    <button
                      type="button"
                      onClick={() => onAiAlternatives(item)}
                      title="AI-альтернативы"
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm transition-all"
                    >
                      <Brain size={13} className="text-violet-500" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReplace(item)}
                      title="Заменить материал"
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm transition-all"
                    >
                      <RefreshCw size={13} className="text-blue-500" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(item._id)}
                      title="Удалить позицию"
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm transition-all"
                    >
                      <Trash2 size={13} className="text-red-400" strokeWidth={2} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtotal row */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-700">Итого — {group.label}</span>
          <span className="text-[11px] font-medium text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
            {group.items.length} {group.items.length === 1 ? 'позиция' : group.items.length < 5 ? 'позиции' : 'позиций'}
          </span>
        </div>
        <span className="text-base font-bold tabular-nums" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {Math.round(groupTotal).toLocaleString('ru-RU')} сом
        </span>
      </div>

      {/* Add material CTA */}
      <div className="px-5 py-3.5 border-t border-dashed border-gray-200">
        <button
          type="button"
          onClick={() => onAddMaterial(groupIndex)}
          className="w-full group flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-md bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <Plus size={11} strokeWidth={2.5} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">Добавить материал в секцию</span>
        </button>
      </div>
    </div>
  );
}

// ─── HistoryPanel ─────────────────────────────────────────────────────────────

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onClose: () => void;
  onRestore?: (entryIndex: number) => void;
}

export function HistoryPanel({ entries, onClose, onRestore }: HistoryPanelProps) {
  const typeIcon: Record<string, string> = { replace: '🔄', delete: '🗑️', qty: '✏️', add: '➕', restore: '↩️' };
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">История изменений</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Изменений пока нет</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e, originalIndex) => ({ e, originalIndex })).reverse().map(({ e, originalIndex }) => {
                const canRestore = e.type === 'delete' && !e.restored && e.payload && onRestore;
                return (
                  <div
                    key={originalIndex}
                    className={`flex gap-2.5 p-2.5 rounded-xl ${e.restored ? 'bg-gray-50/50 opacity-60' : 'bg-gray-50'}`}
                  >
                    <span className="text-base flex-shrink-0">{typeIcon[e.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-snug ${e.restored ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {e.description}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{e.time}</p>
                      {canRestore && (
                        <button
                          type="button"
                          onClick={() => onRestore!(originalIndex)}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          ↩︎ Восстановить
                        </button>
                      )}
                      {e.type === 'delete' && e.restored && (
                        <span className="mt-1 inline-block text-[10px] text-emerald-600 font-medium">✓ восстановлен</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
