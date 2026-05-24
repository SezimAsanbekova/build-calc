'use client';

import React, { useEffect, useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ChevronRight,
  Package,
  DollarSign,
  Layers,
  Calculator,
  ArrowLeft,
  Download,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Building2,
  AlertTriangle,
  Lightbulb,
  Brain,
  Info,
  PiggyBank,
  ShieldCheck,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useTranslation } from '@/app/i18n/useTranslation';

interface ResultItem {
  materialId: string;
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

interface SurfaceGroup {
  surface: string;
  label: string;
  surfaceArea: number;
  items: ResultItem[];
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

interface SmartRecommendation {
  type: 'warning' | 'success' | 'info' | 'saving';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
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

// ── Интеллектуальные рекомендации ─────────────────────────────────────────────

const REC_STYLES = {
  warning: {
    card: 'bg-amber-50 border-amber-200',
    icon: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'text-amber-900',
    desc: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    Icon: AlertTriangle,
  },
  success: {
    card: 'bg-emerald-50 border-emerald-200',
    icon: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'text-emerald-900',
    desc: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    Icon: ShieldCheck,
  },
  info: {
    card: 'bg-blue-50 border-blue-200',
    icon: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'text-blue-900',
    desc: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    Icon: Info,
  },
  saving: {
    card: 'bg-violet-50 border-violet-200',
    icon: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: 'text-violet-900',
    desc: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    Icon: PiggyBank,
  },
} as const;

type TFunc = (key: string, params?: Record<string, string>) => string;

function SmartRecommendationsBlock({ recs, t }: { recs: SmartRecommendation[]; t: TFunc }) {
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
          <p className="text-sm font-medium text-emerald-800">
            {t('result.noProblems')}
          </p>
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

function groupByCategory(items: ResultItem[]) {
  const map: Record<string, ResultItem[]> = {};
  for (const item of items) {
    const cat = item.material.category.name;
    if (!map[cat]) map[cat] = [];
    map[cat].push(item);
  }
  return Object.entries(map).map(([category, catItems]) => ({
    category,
    items: catItems,
    subtotal: catItems.reduce((s, i) => s + Number(i.totalPrice), 0),
  }));
}

function MaterialsTable({ items, totalLabel, t }: { items: ResultItem[]; totalLabel: string; t: TFunc }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Building2 size={20} className="text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">{t('result.noMaterials')}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('result.material')}</th>
            <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{t('result.manufacturer')}</th>
            <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{t('result.category')}</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{t('result.qty')}</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{t('result.packages')}</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{t('result.unitPrice')}</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('result.total')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {groupByCategory(items).map((catGroup, ci) => (
            <React.Fragment key={ci}>
              {groupByCategory(items).length > 1 && (
                <tr>
                  <td colSpan={7} className="px-5 py-2 bg-slate-50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {catGroup.category}
                  </td>
                </tr>
              )}
              {catGroup.items.map((item, i) => (
                <tr key={`${ci}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-gray-900">{item.material.name}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-sm text-gray-500">{item.material.manufacturer.name}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                      {item.material.category.name}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right text-sm text-gray-700">
                    {Number(item.quantity) % 1 !== 0 ? Number(item.quantity).toFixed(2) : item.quantity}{' '}
                    {item.material.unit}
                  </td>
                  <td className="px-3 py-3.5 text-right text-sm text-gray-700">
                    {item.packageCount} {item.material.packageUnit}
                  </td>
                  <td className="px-3 py-3.5 text-right text-sm text-gray-600">
                    {Number(item.unitPrice).toLocaleString('ru-RU')} сом
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(Number(item.totalPrice)).toLocaleString('ru-RU')} сом
                    </span>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gradient-to-r from-blue-50 to-violet-50">
            <td colSpan={6} className="px-5 py-3 text-sm font-semibold text-gray-700">{totalLabel}</td>
            <td className="px-5 py-3 text-right">
              <span className="text-base font-bold text-blue-700">
                {Math.round(items.reduce((s, i) => s + Number(i.totalPrice), 0)).toLocaleString('ru-RU')} сом
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function ResultPage() {
  const { session, isReady, isLoading: authLoading } = useAuthGuard();
  const router = useRouter();
  const { t } = useTranslation('calculations');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    const raw = sessionStorage.getItem('calc_result');
    if (!raw) {
      router.push('/calculations/new');
      return;
    }
    setResult(JSON.parse(raw));
    setIsLoading(false);
  }, [isReady, router]);

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

  function handleDownload() {
    if (!result) return;
    const totalCostVal = parseFloat(result.totalPrice.toString());
    const budgetVal2 = parseFloat(result.budget.toString());
    const date = new Date().toLocaleDateString('ru-RU');

    const groupsHtml = (result.surfaceGroups ?? []).map((group) => {
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

    const overStr = totalCostVal > budgetVal2
      ? `<p style="color:#dc2626">⚠ Превышение бюджета на ${Math.round(totalCostVal - budgetVal2).toLocaleString('ru-RU')} сом</p>`
      : `<p style="color:#16a34a">✓ Экономия: ${Math.round(budgetVal2 - totalCostVal).toLocaleString('ru-RU')} сом</p>`;

    const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
      <title>Смета — ${result.projectName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 40px; }
        h1 { color: #1e3a8a; margin-bottom: 4px; }
        .meta { color: #555; margin-bottom: 24px; font-size: 12px; }
        .stats { display: flex; gap: 24px; background: #f0f4ff; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; }
        .stat { }
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
        <div class="stat"><div class="stat-val">${Math.round(totalCostVal).toLocaleString('ru-RU')} сом</div><div class="stat-lbl">Итого стоимость</div></div>
        <div class="stat"><div class="stat-val">${Math.round(budgetVal2).toLocaleString('ru-RU')} сом</div><div class="stat-lbl">Бюджет</div></div>
        <div class="stat"><div class="stat-val">${result.area.toFixed(1)} м²</div><div class="stat-lbl">Площадь</div></div>
        <div class="stat"><div class="stat-val">${groups.reduce((s, g) => s + g.items.length, 0)}</div><div class="stat-lbl">Позиций</div></div>
      </div>
      ${overStr}
      ${groupsHtml}
      ${
        result.isFullRoom && groups.length > 1
          ? `<div class="total-row"><span>Общий итог (все поверхности)</span><strong>${Math.round(totalCostVal).toLocaleString('ru-RU')} сом</strong></div>`
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
  const totalCost = parseFloat(result.totalPrice.toString());
  const budget = parseFloat(result.budget.toString());
  const isBudgetOk = result.fitsBudget;
  const savings = budget - totalCost;
  const area = parseFloat(result.area.toString()).toFixed(1);
  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const allCategories = new Set(groups.flatMap((g) => g.items.map((i) => i.material.category.name)));

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
                value: `${Math.round(totalCost).toLocaleString('ru-RU')} сом`,
                icon: DollarSign,
                color: isBudgetOk ? 'emerald' : 'red',
                sub: isBudgetOk ? t('list.fitsBudget') : t('list.overBudget'),
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
                value: totalItems.toString(),
                icon: Package,
                color: 'violet',
                sub: `${allCategories.size} ${t('result.categories')}`,
              },
              {
                label: isBudgetOk ? t('result.savings') : t('result.overBudget'),
                value: `${Math.abs(Math.round(savings)).toLocaleString('ru-RU')} сом`,
                icon: TrendingDown,
                color: isBudgetOk ? 'emerald' : 'orange',
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

          {/* Surface groups */}
          {groups.map((group, gi) => (
            <div key={gi} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-800">
                    {group.label}
                    {result.isFullRoom && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        — {t('result.area')} {Number(group.surfaceArea).toFixed(1)} м²
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{group.items.length} {t('result.positions')}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(group.subtotal).toLocaleString('ru-RU')} сом
                  </span>
                </div>
              </div>
              <MaterialsTable
                items={group.items}
                totalLabel={`${t('result.total')} — ${group.label}`}
                t={t}
              />
            </div>
          ))}

          {/* Grand total for full_room */}
          {result.isFullRoom && groups.length > 1 && (
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
                {Math.round(totalCost).toLocaleString('ru-RU')} сом
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
          <div className={`rounded-2xl p-5 flex items-center gap-4 ${isBudgetOk ? 'bg-emerald-50 border border-emerald-100' : 'bg-orange-50 border border-orange-100'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBudgetOk ? 'bg-emerald-100' : 'bg-orange-100'}`}>
              {isBudgetOk
                ? <CheckCircle size={20} className="text-emerald-600" />
                : <Calculator size={20} className="text-orange-600" />
              }
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${isBudgetOk ? 'text-emerald-800' : 'text-orange-800'}`}>
                {isBudgetOk
                  ? t('result.budgetOkMsg', { amount: Math.abs(Math.round(savings)).toLocaleString('ru-RU') })
                  : t('result.budgetOverMsg', { amount: Math.abs(Math.round(savings)).toLocaleString('ru-RU') })
                }
              </p>
              <p className={`text-xs mt-0.5 ${isBudgetOk ? 'text-emerald-600' : 'text-orange-600'}`}>
                {t('result.budget')}: {Math.round(budget).toLocaleString('ru-RU')} сом · {t('result.title')}: {Math.round(totalCost).toLocaleString('ru-RU')} сом
              </p>
            </div>
            <button
              onClick={() => router.push('/calculations/new')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${isBudgetOk ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
            >
              <RotateCcw size={14} />
              {t('result.recalc')}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

