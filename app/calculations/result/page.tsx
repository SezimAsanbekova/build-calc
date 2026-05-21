'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const ROOM_LABELS: Record<string, string> = {
  kitchen: 'Кухня',
  bathroom: 'Ванная',
  bedroom: 'Спальня',
  living_room: 'Гостиная',
  office: 'Офис',
};

const SURFACE_LABELS: Record<string, string> = {
  walls: 'Стены',
  floor: 'Пол',
  ceiling: 'Потолок',
  full_room: 'Полный ремонт',
};

const LEVEL_LABELS: Record<string, string> = {
  economy: 'Эконом',
  standard: 'Стандарт',
  premium: 'Премиум',
};

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

function MaterialsTable({ items, totalLabel }: { items: ResultItem[]; totalLabel: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Building2 size={20} className="text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">Нет материалов для этой поверхности</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Материал</th>
            <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Производитель</th>
            <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Категория</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Кол-во</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Упаковок</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Цена / уп.</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Итого</th>
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

function generatePrintHtml(result: CalcResult, userName: string): string {
  const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const groups = result.surfaceGroups ?? [];
  const allItems = groups.flatMap((g) => g.items);
  const ROOM_L: Record<string, string> = { kitchen: 'Кухня', bathroom: 'Ванная', bedroom: 'Спальня', living_room: 'Гостиная', office: 'Офис' };
  const SURF_L: Record<string, string> = { walls: 'Стены', floor: 'Пол', ceiling: 'Потолок', full_room: 'Полный ремонт' };
  const LEVEL_L: Record<string, string> = { economy: 'Эконом', standard: 'Стандарт', premium: 'Премиум' };

  const rows = (items: typeof allItems) => items.map((item, i) =>
    `<tr>
      <td>${i + 1}</td>
      <td><strong>${item.material.name}</strong><br><small>${item.material.manufacturer.name}</small></td>
      <td>${item.material.category.name}</td>
      <td style="text-align:right">${Number(item.quantity).toFixed(2)} ${item.material.unit}</td>
      <td style="text-align:right">${item.packageCount} ${item.material.packageUnit}</td>
      <td style="text-align:right">${Number(item.unitPrice).toLocaleString('ru-RU')} сом</td>
      <td style="text-align:right"><strong>${Math.round(Number(item.totalPrice)).toLocaleString('ru-RU')} сом</strong></td>
    </tr>`
  ).join('');

  const groupSections = result.isFullRoom
    ? groups.map((g) => `
        <h3 style="margin:20px 0 8px;color:#1e3a5f;font-size:14px">${g.label} — ${g.surfaceArea.toFixed(1)} м²</h3>
        <table><thead><tr><th>#</th><th>Материал</th><th>Категория</th><th>Кол-во</th><th>Упаковок</th><th>Цена/уп.</th><th>Итого</th></tr></thead>
        <tbody>${rows(g.items)}</tbody>
        <tfoot><tr><td colspan="6"><strong>Итого по ${g.label.toLowerCase()}</strong></td><td style="text-align:right"><strong>${Math.round(g.subtotal).toLocaleString('ru-RU')} сом</strong></td></tr></tfoot></table>`
      ).join('')
    : `<table><thead><tr><th>#</th><th>Материал</th><th>Категория</th><th>Кол-во</th><th>Упаковок</th><th>Цена/уп.</th><th>Итого</th></tr></thead>
       <tbody>${rows(allItems)}</tbody></table>`;

  const ba = result.budgetAnalysis;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Смета — ${result.projectName || 'Расчёт'}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 30px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
  .logo { font-size: 20px; font-weight: 800; color: #2563eb; }
  .meta { text-align: right; color: #666; font-size: 11px; line-height: 1.6; }
  .title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .info-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 20px; }
  .info-card { background: #f0f4ff; border-radius: 8px; padding: 10px 14px; }
  .info-card .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
  .info-card .value { font-size: 14px; font-weight: 700; color: #1e3a5f; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
  thead tr { background: #1e3a5f; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-weight: 600; }
  tbody tr:nth-child(even) { background: #f8faff; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tfoot tr { background: #dbeafe; }
  tfoot td { padding: 8px 10px; font-weight: 600; }
  .budget-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin: 6px 0; }
  .budget-fill { height: 100%; background: ${(ba?.usedPercent ?? 0) > 100 ? '#ef4444' : (ba?.usedPercent ?? 0) > 80 ? '#f97316' : '#22c55e'}; border-radius: 4px; width: ${Math.min(ba?.usedPercent ?? 0, 100)}%; }
  .budget-section { background: #f8faff; border: 1px solid #dbeafe; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
  .total-row { background: #1e3a5f; color: #fff; border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .total-row .amount { font-size: 20px; font-weight: 800; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${result.fitsBudget ? '#dcfce7' : '#fee2e2'}; color: ${result.fitsBudget ? '#166534' : '#991b1b'}; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
  @media print { body { padding: 10px; } button { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BuildCalc AI</div>
      <div style="font-size:11px;color:#666;margin-top:2px">Профессиональный расчёт материалов</div>
    </div>
    <div class="meta">
      <div>Смета #${result.calculationId.slice(0, 8).toUpperCase()}</div>
      <div>${date}</div>
      <div>Составил: ${userName}</div>
      <div><span class="status">${result.fitsBudget ? 'В рамках бюджета' : 'Превышение бюджета'}</span></div>
    </div>
  </div>

  <div class="title">${result.projectName || 'Расчёт ремонта'}</div>

  <div class="info-grid">
    <div class="info-card"><div class="label">Тип помещения</div><div class="value">${ROOM_L[result.roomType] ?? result.roomType}</div></div>
    <div class="info-card"><div class="label">Поверхность</div><div class="value">${SURF_L[result.surfaceType] ?? result.surfaceType}</div></div>
    <div class="info-card"><div class="label">Уровень</div><div class="value">${LEVEL_L[result.repairLevel] ?? result.repairLevel}</div></div>
    <div class="info-card"><div class="label">Площадь</div><div class="value">${Number(result.area).toFixed(1)} м²</div></div>
  </div>

  <h3 style="margin-bottom:8px;color:#1e3a5f">Материалы и комплектация</h3>
  ${groupSections}

  <div class="total-row">
    <div>ИТОГО ПО СМЕТЕ</div>
    <div class="amount">${Math.round(Number(result.totalPrice)).toLocaleString('ru-RU')} сом</div>
  </div>

  ${ba ? `
  <div class="budget-section">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span>Использование бюджета</span>
      <strong>${ba.usedPercent}% (${Math.round(ba.total).toLocaleString('ru-RU')} / ${Math.round(ba.budget).toLocaleString('ru-RU')} сом)</strong>
    </div>
    <div class="budget-bar"><div class="budget-fill"></div></div>
    <div style="font-size:11px;color:#666;margin-top:4px">
      ${ba.remaining >= 0 ? 'Остаток: ' + Math.round(ba.remaining).toLocaleString('ru-RU') + ' сом' : 'Превышение: ' + Math.abs(Math.round(ba.remaining)).toLocaleString('ru-RU') + ' сом'}
    </div>
  </div>` : ''}

  <div class="footer">
    <span>Сформировано системой BuildCalc AI</span>
    <span>Цены актуальны на дату составления. Стоимость доставки и монтажа не включена.</span>
  </div>
</body>
</html>`;
}

export default function ResultPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'loading') return;
    const raw = sessionStorage.getItem('calc_result');
    if (!raw) {
      router.push('/calculations/new');
      return;
    }
    setResult(JSON.parse(raw));
    setIsLoading(false);
  }, [status, router]);

  async function handleDownload() {
    if (!result || !session?.user) return;
    setDownloading(true);
    try {
      const allItems = (result.surfaceGroups ?? []).flatMap((g) => g.items);

      if (!savedEstimateId) {
        const res = await fetch('/api/estimates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calculationId: result.calculationId,
            totalPrice: Math.round(Number(result.totalPrice)),
            items: allItems.map((i) => ({
              materialId: i.materialId,
              quantity: Number(i.quantity),
              packageCount: i.packageCount,
              price: Number(i.unitPrice),
              total: Math.round(Number(i.totalPrice)),
            })),
          }),
        });
        const data = await res.json();
        if (data.estimateId) setSavedEstimateId(data.estimateId);
      }

      const html = generatePrintHtml(result, session.user.name ?? 'Пользователь');
      const win = window.open('', '_blank', 'width=900,height=700');
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 600);
      }
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setDownloading(false);
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-base font-semibold text-gray-900">Загружаем результат...</p>
        </div>
      </div>
    );
  }

  if (!session || !result) return null;

  const groups: SurfaceGroup[] = result.surfaceGroups ?? [];
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
            <span>Новый расчет</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">Результат</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/calculations/new')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <RotateCcw size={14} />
              Новый расчет
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download size={14} className={downloading ? 'animate-bounce' : ''} />
              {downloading ? 'Сохранение...' : savedEstimateId ? 'Скачать снова' : 'Скачать смету'}
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
                {ROOM_LABELS[result.roomType] ?? result.roomType}
                {' · '}
                {SURFACE_LABELS[result.surfaceType] ?? result.surfaceType}
                {' · '}
                {LEVEL_LABELS[result.repairLevel] ?? result.repairLevel}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <CheckCircle size={14} className="text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Сохранено в БД</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Итого стоимость',
                value: `${Math.round(totalCost).toLocaleString('ru-RU')} сом`,
                icon: DollarSign,
                color: isBudgetOk ? 'emerald' : 'red',
                sub: isBudgetOk ? 'В рамках бюджета' : 'Превышает бюджет',
              },
              {
                label: 'Площадь пола',
                value: `${area} м²`,
                icon: Layers,
                color: 'blue',
                sub: `${result.length} × ${result.width}${result.height ? ` × ${result.height}` : ''} м`,
              },
              {
                label: 'Позиций',
                value: totalItems.toString(),
                icon: Package,
                color: 'violet',
                sub: `${allCategories.size} ${allCategories.size === 1 ? 'категория' : 'категорий'}`,
              },
              {
                label: isBudgetOk ? 'Экономия' : 'Превышение',
                value: `${Math.abs(Math.round(savings)).toLocaleString('ru-RU')} сом`,
                icon: TrendingDown,
                color: isBudgetOk ? 'emerald' : 'orange',
                sub: `Бюджет: ${Math.round(budget).toLocaleString('ru-RU')} сом`,
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
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Анализ бюджета</h2>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Использовано бюджета</span>
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">По поверхностям</p>
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
                      <p className="text-xs text-gray-400">Самый дорогой материал</p>
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
                <h3 className="text-sm font-semibold text-amber-800">Предупреждения системы</h3>
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
                        — площадь {Number(group.surfaceArea).toFixed(1)} м²
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{group.items.length} поз.</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(group.subtotal).toLocaleString('ru-RU')} сом
                  </span>
                </div>
              </div>
              <MaterialsTable
                items={group.items}
                totalLabel={`Итого — ${group.label}`}
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
                  <p className="text-sm font-semibold text-gray-900">Общий итог (все поверхности)</p>
                  <p className="text-xs text-gray-500">Стены + Пол + Потолок</p>
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
                <h3 className="text-sm font-semibold text-orange-800">Оптимизация бюджета</h3>
                <span className="text-xs text-orange-500 ml-1">— замена материалов для снижения стоимости</span>
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
                <h3 className="text-sm font-semibold text-blue-800">Рекомендации системы</h3>
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
                  ? `Все материалы укладываются в бюджет. Экономия: ${Math.abs(Math.round(savings)).toLocaleString('ru-RU')} сом`
                  : `Превышение бюджета на ${Math.abs(Math.round(savings)).toLocaleString('ru-RU')} сом. Попробуйте уровень "Эконом".`
                }
              </p>
              <p className={`text-xs mt-0.5 ${isBudgetOk ? 'text-emerald-600' : 'text-orange-600'}`}>
                Бюджет: {Math.round(budget).toLocaleString('ru-RU')} сом · Расчет: {Math.round(totalCost).toLocaleString('ru-RU')} сом
              </p>
            </div>
            <button
              onClick={() => router.push('/calculations/new')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${isBudgetOk ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
            >
              <RotateCcw size={14} />
              Пересчитать
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
