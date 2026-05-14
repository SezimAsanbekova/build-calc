'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Shuffle, Plus, Search, Trash2, AlertCircle, ArrowRight, X,
  Wallet, Sparkles, Package, TrendingDown, TrendingUp,
} from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';
import AlternativeFormModal from '@/app/admin/components/AlternativeFormModal';
import AdminSelect from '@/app/admin/components/AdminSelect';
import NumberInput from '@/app/admin/components/NumberInput';

interface MaterialBrief {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
  isActive: boolean;
  imageUrl: string | null;
  category: { id: string; name: string };
  manufacturer: { id: string; name: string };
}

interface AltRecord {
  id: string;
  material: MaterialBrief;
  alternativeMaterial: MaterialBrief;
}

interface SuggestedAlt {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  imageUrl: string | null;
  category: { id: string; name: string };
  manufacturer: { id: string; name: string };
  priceDifference: number;
  priceDifferencePct: number;
  cheaper: boolean;
  withinBudget: boolean | null;
}

interface SuggestResp {
  material: { id: string; name: string; price: number; isAvailable: boolean; isActive: boolean };
  reason: 'unavailable' | 'over-budget' | 'manual';
  budget: number | null;
  alternatives: SuggestedAlt[];
}

interface MaterialOption {
  id: string;
  name: string;
  price: string;
  category: { name: string };
  manufacturer: { name: string };
}

export default function AdminAlternativesPage() {
  return (
    <AdminPageShell title="Альтернативы" subtitle="Альтернативные материалы для замены при подборе">
      {() => <AlternativesContent />}
    </AdminPageShell>
  );
}

function AlternativesContent() {
  const [records, setRecords] = useState<AltRecord[]>([]);
  const [allMaterials, setAllMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AltRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Подбор альтернатив (тестер)
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestMaterial, setSuggestMaterial] = useState('');
  const [suggestBudget, setSuggestBudget] = useState('');
  const [suggestResult, setSuggestResult] = useState<SuggestResp | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, mRes] = await Promise.all([
        fetch('/api/admin/alternatives'),
        fetch('/api/admin/materials'),
      ]);
      if (aRes.ok) setRecords((await aRes.json()).records);
      if (mRes.ok) setAllMaterials((await mRes.json()).materials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/alternatives/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAll();
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Группировка: основной материал → массив альтернатив
  const grouped = useMemo(() => {
    const map = new Map<string, { material: MaterialBrief; alternatives: { recordId: string; alt: MaterialBrief }[] }>();
    for (const r of records) {
      const key = r.material.id;
      if (!map.has(key)) {
        map.set(key, { material: r.material, alternatives: [] });
      }
      map.get(key)!.alternatives.push({ recordId: r.id, alt: r.alternativeMaterial });
    }
    return Array.from(map.values()).sort((a, b) => a.material.name.localeCompare(b.material.name));
  }, [records]);

  const filteredGroups = useMemo(() => {
    if (!search) return grouped;
    const q = search.toLowerCase();
    return grouped.filter(
      (g) =>
        g.material.name.toLowerCase().includes(q) ||
        g.alternatives.some((a) => a.alt.name.toLowerCase().includes(q))
    );
  }, [grouped, search]);

  // Подбор
  const runSuggest = async () => {
    if (!suggestMaterial) return;
    setSuggestLoading(true);
    setSuggestResult(null);
    try {
      const res = await fetch('/api/alternatives/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: suggestMaterial,
          budget: suggestBudget ? Number(suggestBudget) : undefined,
        }),
      });
      if (res.ok) setSuggestResult(await res.json());
    } finally {
      setSuggestLoading(false);
    }
  };

  const materialOptions = allMaterials.map((m) => ({
    value: m.id,
    label: `${m.name} · ${m.category.name} · ${m.manufacturer.name}`,
  }));

  const totalAlternatives = records.length;
  const totalGroups = grouped.length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-purple-900/20 border border-purple-700/40 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-purple-400">{totalGroups}</p>
            <p className="text-xs text-slate-400 mt-0.5">Материалов с альтернативами</p>
          </div>
          <Package className="w-8 h-8 text-purple-400/60" />
        </div>
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-amber-400">{totalAlternatives}</p>
            <p className="text-xs text-slate-400 mt-0.5">Всего связей альтернатив</p>
          </div>
          <Shuffle className="w-8 h-8 text-amber-400/60" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск по материалам и альтернативам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSuggestOpen(!suggestOpen)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border
              ${suggestOpen
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Подобрать альтернативу</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить альтернативу</span>
          </button>
        </div>
      </div>

      {/* Suggest panel */}
      {suggestOpen && (
        <div className="bg-slate-800/40 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Подбор альтернатив</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Симуляция: что система предложит пользователю при превышении бюджета или отсутствии материала
              </p>
            </div>
            <button
              onClick={() => { setSuggestOpen(false); setSuggestResult(null); }}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Материал</label>
              <AdminSelect
                value={suggestMaterial}
                onChange={(v) => setSuggestMaterial(v)}
                options={materialOptions}
                placeholder="— выберите материал —"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Бюджет (опционально)</label>
              <NumberInput
                step={100}
                min={0}
                value={suggestBudget}
                onChange={setSuggestBudget}
                placeholder="0"
              />
            </div>
          </div>

          <button
            onClick={runSuggest}
            disabled={!suggestMaterial || suggestLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {suggestLoading ? 'Подбор...' : 'Подобрать'}
          </button>

          {/* Suggest result */}
          {suggestResult && (
            <div className="space-y-3 pt-3 border-t border-slate-700">
              {/* Reason banner */}
              {suggestResult.reason === 'unavailable' && (
                <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">Материал недоступен</p>
                    <p className="text-xs text-red-400/80">«{suggestResult.material.name}» отсутствует или скрыт. Предлагаются доступные альтернативы.</p>
                  </div>
                </div>
              )}
              {suggestResult.reason === 'over-budget' && (
                <div className="p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg flex items-start space-x-2">
                  <Wallet className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">
                      Цена выше бюджета
                    </p>
                    <p className="text-xs text-amber-400/80">
                      Цена «{suggestResult.material.name}»: {suggestResult.material.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} · бюджет: {suggestResult.budget?.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}. Показаны альтернативы в рамках бюджета.
                    </p>
                  </div>
                </div>
              )}
              {suggestResult.reason === 'manual' && (
                <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-300">
                    Все альтернативы для «{suggestResult.material.name}»
                  </p>
                </div>
              )}

              {/* Alternatives list */}
              {suggestResult.alternatives.length === 0 ? (
                <div className="p-6 bg-slate-700/30 border border-slate-600 rounded-lg text-center">
                  <p className="text-sm text-slate-400">
                    {suggestResult.reason === 'over-budget'
                      ? 'Нет альтернатив в рамках указанного бюджета'
                      : 'Альтернативы для этого материала не заданы'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestResult.alternatives.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 bg-slate-700/30 border border-slate-600 rounded-lg"
                    >
                      {a.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.imageUrl} alt={a.name} className="w-10 h-10 rounded-lg object-cover bg-slate-700 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-white truncate">{a.name}</p>
                          <span className="text-sm font-semibold text-white whitespace-nowrap">
                            {a.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 truncate">
                            {a.category.name} · {a.manufacturer.name}
                          </p>
                          <span className={`inline-flex items-center space-x-1 text-xs font-medium whitespace-nowrap
                            ${a.cheaper ? 'text-green-400' : a.priceDifference > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                            {a.cheaper ? <TrendingDown className="w-3 h-3" /> : a.priceDifference > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                            <span>
                              {a.priceDifference === 0
                                ? 'та же цена'
                                : `${a.cheaper ? '-' : '+'}${Math.abs(a.priceDifference).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} (${Math.abs(a.priceDifferencePct).toFixed(0)}%)`
                              }
                            </span>
                          </span>
                        </div>
                        {!a.isAvailable && (
                          <p className="text-xs text-orange-400 mt-1">⚠ Нет в наличии</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grouped list */}
      {loading ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shuffle className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {search ? 'Ничего не найдено' : 'Альтернативы не заданы'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {search
              ? 'Попробуйте изменить запрос'
              : 'Добавьте альтернативные материалы для замены при подборе'}
          </p>
          {!search && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить альтернативу</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <div
              key={group.material.id}
              className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden"
            >
              {/* Group header */}
              <div className="flex items-center gap-3 p-4 bg-slate-800/60 border-b border-slate-700">
                {group.material.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.material.imageUrl} alt={group.material.name} className="w-12 h-12 rounded-lg object-cover bg-slate-700 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{group.material.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {group.material.category.name} · {group.material.manufacturer.name} · {Number(group.material.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded-md text-xs font-medium text-purple-400 flex-shrink-0">
                  {group.alternatives.length} альт.
                </span>
              </div>

              {/* Alternatives list */}
              <div className="divide-y divide-slate-700/50">
                {group.alternatives.map(({ recordId, alt }) => {
                  const priceDiff = Number(alt.price) - Number(group.material.price);
                  return (
                    <div key={recordId} className="flex items-center gap-3 p-3 pl-6 hover:bg-slate-700/20 transition-colors">
                      <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      {alt.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={alt.imageUrl} alt={alt.name} className="w-9 h-9 rounded-lg object-cover bg-slate-700 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm text-white truncate">{alt.name}</p>
                          <span className="text-sm text-slate-300 whitespace-nowrap">
                            {Number(alt.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 truncate">
                            {alt.category.name} · {alt.manufacturer.name}
                          </p>
                          <span className={`text-xs font-medium whitespace-nowrap
                            ${priceDiff < 0 ? 'text-green-400' : priceDiff > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                            {priceDiff === 0
                              ? '='
                              : `${priceDiff < 0 ? '↓' : '↑'} ${Math.abs(priceDiff).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}`
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {!alt.isAvailable && (
                          <span className="px-2 py-0.5 bg-orange-500/15 border border-orange-500/30 rounded text-xs text-orange-400">
                            нет
                          </span>
                        )}
                        <button
                          onClick={() => setDeleteTarget({ id: recordId, material: group.material, alternativeMaterial: alt })}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Удалить связь"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <AlternativeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAll}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-3 mb-5">
              <div className="w-10 h-10 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Удалить альтернативу?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  «<span className="text-white">{deleteTarget.alternativeMaterial.name}</span>» больше не будет предлагаться как альтернатива для «<span className="text-white">{deleteTarget.material.name}</span>».
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
