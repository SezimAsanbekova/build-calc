'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, ChevronRight, Package, DollarSign, Layers, Calculator, ArrowLeft,
  Download, RotateCcw, Sparkles, TrendingDown, TrendingUp, AlertTriangle,
  Lightbulb, Info, Save, Clock, BadgeCheck,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useTranslation } from '@/app/i18n/useTranslation';
import {
  SmartRecommendationsBlock, ReplacePanel, AddMaterialModal, MaterialsEditorTable,
  HistoryPanel,
} from './_components';
import type {
  EditableItem, EditableGroup, HistoryEntry, SmartRecommendation,
} from './_components';

interface SurfaceGroup {
  surface: string;
  label: string;
  surfaceArea: number;
  items: import('./_components').ResultItem[];
  subtotal: number;
}

interface BudgetAnalysis {
  total: number;
  budget: number;
  usedPercent: number;
  remaining: number;
  bySurface: { label: string; subtotal: number; percent: number }[];
  mostExpensive: { name: string; category: string; totalPrice: number } | null;
}

interface BudgetOpt {
  currentMaterial: string;
  alternativeMaterial: string;
  alternativeManufacturer: string;
  currentUnitPrice: number;
  alternativeUnitPrice: number;
  savings: number;
  savingsPercent: number;
  reason: string | null;
}

interface CalcResult {
  calculationId: string;
  projectName: string;
  roomType: string;
  surfaceType: string;
  repairLevel: string;
  length: number;
  width: number;
  height: number | null;
  area: number;
  openingsArea?: number;
  budget: number;
  totalPrice: number;
  fitsBudget: boolean;
  isFullRoom: boolean;
  surfaceGroups: SurfaceGroup[];
  warnings: string[];
  recommendations: { materialId: string; name: string; reason: string; surface?: string }[];
  budgetAnalysis: BudgetAnalysis;
  budgetOptimizations?: BudgetOpt[];
  smartRecommendations?: SmartRecommendation[];
}

let _localId = 0;
function mkId() { return `item_${++_localId}_${Math.random().toString(36).slice(2, 7)}`; }

function toEditableGroups(groups: SurfaceGroup[]): EditableGroup[] {
  return groups.map((g) => ({
    surface: g.surface,
    label: g.label,
    surfaceArea: g.surfaceArea,
    items: g.items.map((i) => ({ ...i, _id: mkId() })),
  }));
}

export default function ResultPage() {
  const { session, isReady, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();
  const { t } = useTranslation('calculations');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Editor state ──────────────────────────────────────────────────────────
  const [editableGroups, setEditableGroups] = useState<EditableGroup[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<EditableItem | null>(null);
  const [addTarget, setAddTarget] = useState<{ groupIndex: number; groupLabel: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    const raw = sessionStorage.getItem('calc_result');
    if (!raw) {
      router.push('/calculations/new');
      return;
    }
    const parsed: CalcResult = JSON.parse(raw);
    setResult(parsed);
    setEditableGroups(toEditableGroups(parsed.surfaceGroups ?? []));
    setIsLoading(false);
  }, [isReady, router]);

  // ── Live totals ───────────────────────────────────────────────────────────
  const liveTotal = editableGroups.reduce((s, g) => s + g.items.reduce((gs, i) => gs + i.totalPrice, 0), 0);
  const liveTotalItems = editableGroups.reduce((s, g) => s + g.items.length, 0);

  function addHistory(entry: Omit<HistoryEntry, 'time'>) {
    const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setHistory((prev) => [...prev, { ...entry, time: now }]);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback((groupIndex: number, itemId: string) => {
    setEditableGroups((prev) => {
      const deleted = prev[groupIndex]?.items.find((i) => i._id === itemId);
      const next = prev.map((g, gi) =>
        gi !== groupIndex ? g : { ...g, items: g.items.filter((i) => i._id !== itemId) },
      );
      if (deleted) {
        addHistory({
          type: 'delete',
          description: `Удалён: ${deleted.material.name}`,
          payload: { groupIndex, item: deleted },
        });
      }
      return next;
    });
    setIsDirty(true);
  }, []);

  const handleRestore = useCallback((entryIndex: number) => {
    setHistory((prevHist) => {
      const entry = prevHist[entryIndex];
      if (!entry || entry.type !== 'delete' || entry.restored || !entry.payload) return prevHist;

      const { groupIndex, item } = entry.payload;
      setEditableGroups((prevGroups) =>
        prevGroups.map((g, gi) =>
          gi !== groupIndex ? g : { ...g, items: [...g.items, item] },
        ),
      );
      setIsDirty(true);

      const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const updated = prevHist.map((e, i) => (i === entryIndex ? { ...e, restored: true } : e));
      return [
        ...updated,
        { type: 'restore', description: `Восстановлен: ${item.material.name}`, time: now },
      ];
    });
  }, []);

  const handleQtyChange = useCallback((groupIndex: number, itemId: string, newPkg: number) => {
    setEditableGroups((prev) =>
      prev.map((g, gi) =>
        gi !== groupIndex ? g : {
          ...g,
          items: g.items.map((i) =>
            i._id !== itemId ? i : {
              ...i,
              packageCount: newPkg,
              totalPrice: Math.round(i.unitPrice * newPkg),
            },
          ),
        },
      ),
    );
    setIsDirty(true);
    addHistory({ type: 'qty', description: `Изменено кол-во упаковок` });
  }, []);

  const handleReplace = useCallback((item: EditableItem, alt: { id: string; name: string; price: number; isAvailable: boolean; category: { name: string }; manufacturer: { name: string }; priceDifference: number; priceDifferencePct: number; cheaper: boolean }) => {
    setEditableGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((i) =>
          i._id !== item._id ? i : {
            ...i,
            materialId: alt.id,
            unitPrice: alt.price,
            totalPrice: Math.round(alt.price * i.packageCount),
            material: {
              ...i.material,
              id: alt.id,
              name: alt.name,
              category: alt.category,
              manufacturer: alt.manufacturer,
            },
          },
        ),
      })),
    );
    addHistory({ type: 'replace', description: `Заменён: ${item.material.name} → ${alt.name}` });
    setReplaceTarget(null);
    setIsDirty(true);
  }, []);

  const handleAddMaterial = useCallback((groupIndex: number, mat: { id: string; name: string; price: number; unit: string; packageUnit: string; packageQuantity: number; category: { name: string }; manufacturer: { name: string } }, pkgCount: number) => {
    const newItem: EditableItem = {
      _id: mkId(),
      materialId: mat.id,
      quantity: mat.packageQuantity * pkgCount,
      packageCount: pkgCount,
      unitPrice: mat.price,
      totalPrice: Math.round(mat.price * pkgCount),
      material: {
        id: mat.id,
        name: mat.name,
        unit: mat.unit,
        packageUnit: mat.packageUnit,
        packageQuantity: mat.packageQuantity,
        category: mat.category,
        manufacturer: mat.manufacturer,
      },
    };
    setEditableGroups((prev) =>
      prev.map((g, gi) => gi !== groupIndex ? g : { ...g, items: [...g.items, newItem] }),
    );
    addHistory({ type: 'add', description: `Добавлен: ${mat.name}` });
    setAddTarget(null);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!result?.calculationId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/calculations/${result.calculationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: editableGroups.map((g) => ({
            surfaceLabel: g.label,
            items: g.items.map((i) => ({
              materialId: i.materialId,
              quantity: i.quantity,
              packageCount: i.packageCount,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
          })),
        }),
      });
      if (res.ok) {
        setIsDirty(false);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [result, editableGroups]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-base font-semibold text-gray-900">{t('result.loading')}</p>
        </div>
      </div>
    );
  }

  if (!session || !result) return null;

  const groups: SurfaceGroup[] = result.surfaceGroups ?? [];

  async function handleDownload() {
    if (!result) return;
    const budgetVal2 = parseFloat(result.budget.toString());

    // Сохраняем смету в БД
    const allItems = editableGroups.flatMap((g) =>
      g.items.map((i) => ({
        materialId: i.materialId,
        quantity: i.quantity,
        packageCount: i.packageCount,
        price: i.unitPrice,
        total: i.totalPrice,
      })),
    );
    const currentTotal = editableGroups.reduce((s, g) => s + g.items.reduce((gs, i) => gs + i.totalPrice, 0), 0);
    if (allItems.length > 0 && result.calculationId) {
      fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculationId: result.calculationId,
          totalPrice: Math.round(currentTotal),
          items: allItems,
        }),
      }).catch(() => {});
    }
    const date = new Date().toLocaleDateString('ru-RU');
    const currentItemCount = editableGroups.reduce((s, g) => s + g.items.length, 0);

    const groupsHtml = editableGroups
      .filter((group) => group.items.length > 0)
      .map((group) => {
        const rows = group.items.map((item) => `
          <tr>
            <td>${item.material.name}</td>
            <td>${item.material.manufacturer.name}</td>
            <td>${item.material.category.name}</td>
            <td style="text-align:right">${Number(item.quantity) % 1 !== 0 ? Number(item.quantity).toFixed(2) : item.quantity} ${item.material.unit}</td>
            <td style="text-align:right">${item.packageCount} ${item.material.packageUnit}</td>
            <td style="text-align:right">${Number(item.unitPrice).toLocaleString('ru-RU')} сом</td>
            <td style="text-align:right"><strong>${Math.round(Number(item.totalPrice)).toLocaleString('ru-RU')} сом</strong></td>
          </tr>`).join('');
        const subtotal = group.items.reduce((s, i) => s + Number(i.totalPrice), 0);
        return `
          <h3 style="color:#1e40af;margin:24px 0 8px">${group.label}${result.isFullRoom ? ` — ${Number(group.surfaceArea).toFixed(1)} м²` : ''}</h3>
          <table>
            <thead><tr>
              <th>Материал</th><th>Производитель</th><th>Категория</th>
              <th style="text-align:right">Кол-во</th><th style="text-align:right">Упаковок</th>
              <th style="text-align:right">Цена/уп.</th><th style="text-align:right">Итого</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr>
              <td colspan="6"><strong>Итого — ${group.label}</strong></td>
              <td style="text-align:right"><strong style="color:#1d4ed8">${Math.round(subtotal).toLocaleString('ru-RU')} сом</strong></td>
            </tr></tfoot>
          </table>`;
      }).join('');

    const overStr = currentTotal > budgetVal2
      ? `<p style="color:#dc2626">⚠ Превышение бюджета на ${Math.round(currentTotal - budgetVal2).toLocaleString('ru-RU')} сом</p>`
      : `<p style="color:#16a34a">✓ Экономия: ${Math.round(budgetVal2 - currentTotal).toLocaleString('ru-RU')} сом</p>`;

    const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
      <title>Смета — ${result.projectName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 40px; }
        h1 { color: #1e3a8a; margin-bottom: 4px; }
        .meta { color: #555; margin-bottom: 24px; font-size: 12px; }
        .stats { display: flex; gap: 24px; background: #f0f4ff; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; }
        .stat-val { font-size: 18px; font-weight: bold; color: #1d4ed8; }
        .stat-lbl { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
        tfoot td { background: #eff6ff; font-size: 13px; border-top: 2px solid #bfdbfe; }
        .total-row { background: #1e3a8a; color: white; padding: 16px 20px; border-radius: 8px; margin-top: 20px; display: flex; justify-content: space-between; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>
      <h1>Смета: ${result.projectName}</h1>
      <p class="meta">Дата: ${date} &nbsp;|&nbsp; ${result.roomType} &nbsp;|&nbsp; ${result.surfaceType} &nbsp;|&nbsp; ${result.repairLevel}</p>
      <div class="stats">
        <div class="stat"><div class="stat-val">${Math.round(currentTotal).toLocaleString('ru-RU')} сом</div><div class="stat-lbl">Итого стоимость</div></div>
        <div class="stat"><div class="stat-val">${Math.round(budgetVal2).toLocaleString('ru-RU')} сом</div><div class="stat-lbl">Бюджет</div></div>
        <div class="stat"><div class="stat-val">${result.area.toFixed(1)} м²</div><div class="stat-lbl">Площадь</div></div>
        <div class="stat"><div class="stat-val">${currentItemCount}</div><div class="stat-lbl">Позиций</div></div>
      </div>
      ${overStr}
      ${groupsHtml}
      ${
        result.isFullRoom && editableGroups.filter((g) => g.items.length > 0).length > 1
          ? `<div class="total-row"><span>Общий итог (все поверхности)</span><strong>${Math.round(currentTotal).toLocaleString('ru-RU')} сом</strong></div>`
          : ''
      }
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
  const budget = parseFloat(result.budget.toString());
  const liveFitsBudget = liveTotal <= budget || budget === 0;
  const liveSavings = budget - liveTotal;
  const area = parseFloat(result.area.toString()).toFixed(1);
  const allCategories = new Set(editableGroups.flatMap((g) => g.items.map((i) => i.material.category.name)));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span>{t('new.title')}</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">{t('result.title')}</span>
          </div>
          <div className="flex items-center gap-2">
            {savedOk && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <BadgeCheck size={13} /> Сохранено
              </span>
            )}
            {isDirty && !savedOk && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg font-medium">Есть несохранённые изменения</span>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Clock size={14} />
              История{history.length > 0 && ` (${history.length})`}
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={() => router.push('/calculations/new')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <RotateCcw size={14} />
              {t('list.newCalc')}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all">
              <Download size={14} />
              {t('result.download')}
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">
          {/* Page title */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/calculations/new')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-500"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{result.projectName}</h1>
              <p className="text-sm text-gray-500">
                {t(`room.${result.roomType === 'living_room' ? 'living' : result.roomType}`) || result.roomType}
                {' · '}
                {t(`surface.${result.surfaceType === 'full_room' ? 'full' : result.surfaceType}`) || result.surfaceType}
                {' · '}
                {t(`level.${result.repairLevel}`) || result.repairLevel}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <CheckCircle size={14} className="text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">{t('result.savedToDB')}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: t('result.totalCost'),
                value: `${Math.round(liveTotal).toLocaleString('ru-RU')} сом`,
                icon: DollarSign,
                color: liveFitsBudget ? 'emerald' : 'red',
                sub: liveFitsBudget ? t('list.fitsBudget') : t('list.overBudget'),
              },
              {
                label: t('result.floorArea'),
                value: `${area} м²`,
                icon: Layers,
                color: 'blue',
                sub: `${result.length} × ${result.width}${result.height ? ` × ${result.height}` : ''} м`,
              },
              {
                label: t('result.items'),
                value: liveTotalItems.toString(),
                icon: Package,
                color: 'violet',
                sub: `${allCategories.size} ${t('result.categories')}`,
              },
              {
                label: liveFitsBudget ? t('result.savings') : t('result.overBudget'),
                value: `${Math.abs(Math.round(liveSavings)).toLocaleString('ru-RU')} сом`,
                icon: TrendingDown,
                color: liveFitsBudget ? 'emerald' : 'orange',
                sub: `${t('result.budget')}: ${Math.round(budget).toLocaleString('ru-RU')} сом`,
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              const bgMap: Record<string, string> = {
                emerald: 'bg-emerald-50', blue: 'bg-blue-50', violet: 'bg-violet-50',
                red: 'bg-red-50', orange: 'bg-orange-50',
              };
              const iconMap: Record<string, string> = {
                emerald: 'text-emerald-600', blue: 'text-blue-600', violet: 'text-violet-600',
                red: 'text-red-600', orange: 'text-orange-600',
              };
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className={`w-9 h-9 ${bgMap[stat.color]} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={18} className={iconMap[stat.color]} />
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">{stat.value}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{stat.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Budget Analysis */}
          {result.budgetAnalysis && (() => {
            const ba = result.budgetAnalysis;
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={16} className="text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('result.budgetAnalysis')}</h2>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{t('result.budgetUsed')}</span>
                    <span className={`font-bold ${ba.usedPercent > 100 ? 'text-red-600' : ba.usedPercent > 80 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {ba.usedPercent}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ba.usedPercent > 100 ? 'bg-red-500' : ba.usedPercent > 80 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(ba.usedPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>{Math.round(ba.budget).toLocaleString('ru-RU')} сом</span>
                  </div>
                </div>
                {ba.bySurface.length > 1 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('result.bySurface')}</p>
                    {ba.bySurface.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-16 flex-shrink-0">{s.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${s.percent}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-28 text-right">
                          {s.subtotal.toLocaleString('ru-RU')} сом
                        </span>
                        <span className="text-xs text-gray-400 w-8 text-right">{s.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {ba.mostExpensive && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <TrendingUp size={15} className="text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{t('result.mostExpensive')}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ba.mostExpensive.name}
                        <span className="text-xs text-gray-400 ml-1.5">({ba.mostExpensive.category})</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {ba.mostExpensive.totalPrice.toLocaleString('ru-RU')} сом
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">{t('result.warnings')}</h3>
              </div>
              <ul className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Surface groups — editable */}
          {editableGroups.map((group, gi) => {
            const groupTotal = group.items.reduce((s, i) => s + i.totalPrice, 0);
            const accentColors = [
              'from-blue-500 to-blue-600',
              'from-violet-500 to-violet-600',
              'from-emerald-500 to-emerald-600',
              'from-amber-500 to-amber-600',
            ];
            const accent = accentColors[gi % accentColors.length];
            return (
              <div key={gi} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4 hover:shadow-md transition-shadow duration-200">
                {/* Section header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0`}>
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">{group.label}</h2>
                      {result.isFullRoom && group.surfaceArea > 0 && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Площадь: {Number(group.surfaceArea).toFixed(1)} м²
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      {group.items.length} поз.
                    </span>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900 tabular-nums">
                        {Math.round(groupTotal).toLocaleString('ru-RU')}
                        <span className="text-xs font-normal text-gray-400 ml-1">сом</span>
                      </p>
                    </div>
                  </div>
                </div>
                <MaterialsEditorTable
                  group={group}
                  groupIndex={gi}
                  budget={budget}
                  isFullRoom={result.isFullRoom}
                  onDelete={handleDelete}
                  onReplace={setReplaceTarget}
                  onQtyChange={handleQtyChange}
                  onAddMaterial={(idx) => setAddTarget({ groupIndex: idx, groupLabel: group.label })}
                  t={t}
                />
              </div>
            );
          })}

          {/* Grand total for full_room */}
          {result.isFullRoom && editableGroups.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                  <Calculator size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('result.grandTotal')}</p>
                  <p className="text-xs text-gray-500">{t('result.grandTotalSub')}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {Math.round(liveTotal).toLocaleString('ru-RU')} сом
              </span>
            </div>
          )}

          {/* Budget optimizations */}
          {result.budgetOptimizations && result.budgetOptimizations.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={16} className="text-orange-600" />
                <h3 className="text-sm font-semibold text-orange-800">{t('result.budgetOpt')}</h3>
                <span className="text-xs text-orange-500 ml-1">{t('result.budgetOptSub')}</span>
              </div>
              <div className="space-y-2.5">
                {result.budgetOptimizations.map((opt, i) => (
                  <div key={i} className="bg-white rounded-xl p-3.5 border border-orange-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs text-gray-400 line-through">{opt.currentMaterial}</span>
                          <span className="text-gray-400 text-xs">→</span>
                          <span className="text-sm font-semibold text-gray-900">{opt.alternativeMaterial}</span>
                        </div>
                        <p className="text-xs text-gray-400">{opt.alternativeManufacturer}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {opt.currentUnitPrice.toLocaleString('ru-RU')} → {opt.alternativeUnitPrice.toLocaleString('ru-RU')} сом/уп.
                        </p>
                        {opt.reason && <p className="text-xs text-gray-400 mt-0.5 italic">{opt.reason}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-600">
                          −{opt.savings.toLocaleString('ru-RU')} сом
                        </span>
                        <p className="text-xs text-emerald-500">−{opt.savingsPercent}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">{t('result.recommendations')}</h3>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-900">{r.name}</span>
                      {r.surface && (
                        <span className="text-xs text-blue-400 ml-1.5">({r.surface})</span>
                      )}
                      <p className="text-xs text-blue-600 mt-0.5">{r.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Smart Recommendations */}
          <SmartRecommendationsBlock recs={result.smartRecommendations ?? []} t={t} />

          {/* Budget status */}
          <div className={`rounded-2xl p-5 flex items-center gap-4 ${liveFitsBudget ? 'bg-emerald-50 border border-emerald-100' : 'bg-orange-50 border border-orange-100'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${liveFitsBudget ? 'bg-emerald-100' : 'bg-orange-100'}`}>
              {liveFitsBudget
                ? <CheckCircle size={20} className="text-emerald-600" />
                : <Calculator size={20} className="text-orange-600" />
              }
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${liveFitsBudget ? 'text-emerald-800' : 'text-orange-800'}`}>
                {liveFitsBudget
                  ? t('result.budgetOkMsg', { amount: Math.abs(Math.round(liveSavings)).toLocaleString('ru-RU') })
                  : t('result.budgetOverMsg', { amount: Math.abs(Math.round(liveSavings)).toLocaleString('ru-RU') })
                }
              </p>
              <p className={`text-xs mt-0.5 ${liveFitsBudget ? 'text-emerald-600' : 'text-orange-600'}`}>
                {t('result.budget')}: {Math.round(budget).toLocaleString('ru-RU')} сом · {t('result.title')}: {Math.round(liveTotal).toLocaleString('ru-RU')} сом
              </p>
            </div>
            <button
              onClick={() => router.push('/calculations/new')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${liveFitsBudget ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
            >
              <RotateCcw size={14} />
              {t('result.recalc')}
            </button>
          </div>
        </main>
      </div>

      {/* Overlays */}
      {replaceTarget && (
        <ReplacePanel
          item={replaceTarget}
          budget={budget}
          onReplace={handleReplace}
          onClose={() => setReplaceTarget(null)}
        />
      )}
      {addTarget && (
        <AddMaterialModal
          groupLabel={addTarget.groupLabel}
          onAdd={(mat, pkgs) => handleAddMaterial(addTarget.groupIndex, mat, pkgs)}
          onClose={() => setAddTarget(null)}
        />
      )}
      {showHistory && (
        <HistoryPanel entries={history} onClose={() => setShowHistory(false)} onRestore={handleRestore} />
      )}
    </div>
  );
}

