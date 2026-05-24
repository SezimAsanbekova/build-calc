'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Search,
  ChevronRight,
  X,
  Package,
  ChevronLeft,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ── Labels ──────────────────────────────────────────────────────────────────
const REPAIR_LABELS: Record<string, string> = { econom: 'Эконом', standard: 'Стандарт', premium: 'Премиум' };
const REPAIR_COLORS: Record<string, string> = {
  econom: 'bg-emerald-100 text-emerald-700',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-violet-100 text-violet-700',
};
const SURFACE_LABELS: Record<string, string> = { wall: 'Стены', floor: 'Пол', ceiling: 'Потолок' };
const SURFACE_COLORS: Record<string, string> = {
  wall: 'bg-orange-100 text-orange-700',
  floor: 'bg-teal-100 text-teal-700',
  ceiling: 'bg-sky-100 text-sky-700',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface Material {
  id: string;
  name: string;
  slug: string;
  price: number;
  unit: string;
  packageQuantity: number;
  packageUnit: string;
  consumptionPerM2: number;
  wasteFactor: number;
  stockQuantity: number;
  description: string | null;
  imageUrl: string | null;
  repairLevel: string;
  surfaceType: string;
  category: { id: string; name: string };
  manufacturer: { id: string; name: string; country: string | null };
  properties: { name: string; value: string }[];
}

interface FilterOptions {
  categories: { id: string; name: string }[];
  manufacturers: { id: string; name: string }[];
}

interface Filters {
  search: string;
  categoryId: string;
  manufacturerId: string;
  repairLevel: string;
  surfaceType: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

const REPAIR_LEVELS = [
  { value: 'econom', label: 'Эконом' },
  { value: 'standard', label: 'Стандарт' },
  { value: 'premium', label: 'Премиум' },
];

const SURFACE_TYPES = [
  { value: 'wall', label: 'Стены' },
  { value: 'floor', label: 'Пол' },
  { value: 'ceiling', label: 'Потолок' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'По названию А–Я' },
  { value: 'name_desc', label: 'По названию Я–А' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
];

const INIT_FILTERS: Filters = {
  search: '',
  categoryId: '',
  manufacturerId: '',
  repairLevel: '',
  surfaceType: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'name_asc',
};

// ── Placeholder image ─────────────────────────────────────────────────────────
function MaterialPlaceholder({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-violet-50">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-3">
        {initials}
      </div>
      <Package size={22} className="text-gray-300" />
    </div>
  );
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ material, onClose }: { material: Material; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="relative h-96 rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50 flex-shrink-0">
          {material.imageUrl ? (
            <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover" />
          ) : (
            <MaterialPlaceholder name={material.name} />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <X size={15} />
          </button>
          <div className="absolute bottom-3 left-4 flex gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${REPAIR_COLORS[material.repairLevel] ?? 'bg-gray-100 text-gray-600'}`}>
              {REPAIR_LABELS[material.repairLevel] ?? material.repairLevel}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${SURFACE_COLORS[material.surfaceType] ?? 'bg-gray-100 text-gray-600'}`}>
              {SURFACE_LABELS[material.surfaceType] ?? material.surfaceType}
            </span>
          </div>
        </div>

        <div className="p-4">
          <p className="text-[10px] text-blue-600 font-medium mb-0.5">{material.category.name}</p>
          <h2 className="text-base font-bold text-gray-900 mb-0.5">{material.name}</h2>
          <p className="text-xs text-gray-400 mb-3">
            {material.manufacturer.name}
            {material.manufacturer.country ? ` · ${material.manufacturer.country}` : ''}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2.5 mb-4">
            <div>
              <p className="text-[10px] text-gray-400">Цена за упаковку</p>
              <p className="text-lg font-bold text-gray-900">{material.price.toLocaleString('ru-RU')} сом</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">В упаковке</p>
              <p className="text-sm font-semibold text-gray-700">{material.packageQuantity} {material.packageUnit}</p>
            </div>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Расход', value: `${material.consumptionPerM2} ${material.unit}/м²` },
              { label: 'Коэф. запаса', value: `×${material.wasteFactor}` },
              { label: 'На складе', value: `${material.stockQuantity} уп.` },
              { label: 'Единица', value: material.unit },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-2.5">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{s.label}</p>
                <p className="text-xs font-semibold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {material.description && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Описание</p>
              <p className="text-xs text-gray-600 leading-relaxed">{material.description}</p>
            </div>
          )}

          {/* Properties */}
          {material.properties.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Характеристики</p>
              <div className="divide-y divide-gray-50">
                {material.properties.map((p) => (
                  <div key={p.name} className="flex justify-between py-1.5">
                    <span className="text-xs text-gray-500">{p.name}</span>
                    <span className="text-xs font-medium text-gray-800">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${material.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${material.stockQuantity > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} />
            {material.stockQuantity > 0 ? `В наличии: ${material.stockQuantity} упаковок` : 'Нет в наличии'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const { isReady } = useAuthGuard();
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], manufacturers: [] });
  const [filters, setFilters] = useState<Filters>(INIT_FILTERS);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Material | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const fetchMaterials = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set('search', f.search);
      if (f.categoryId) params.set('categoryId', f.categoryId);
      if (f.manufacturerId) params.set('manufacturerId', f.manufacturerId);
      if (f.repairLevel) params.set('repairLevel', f.repairLevel);
      if (f.surfaceType) params.set('surfaceType', f.surfaceType);
      if (f.minPrice) params.set('minPrice', f.minPrice);
      if (f.maxPrice) params.set('maxPrice', f.maxPrice);
      params.set('sortBy', f.sortBy);
      params.set('page', String(p));

      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json();
      setMaterials(data.materials ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setFilterOptions({
        categories: data.categories ?? [],
        manufacturers: data.manufacturers ?? [],
      });
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) fetchMaterials(filters, page);
  }, [isReady, filters, page, fetchMaterials]);

  function handleSearchChange(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: value }));
      setPage(1);
    }, 400);
  }

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(INIT_FILTERS);
    setPage(1);
  }

  const activeFilterCount = [
    filters.categoryId, filters.manufacturerId,
    filters.repairLevel, filters.surfaceType,
    filters.minPrice, filters.maxPrice,
  ].filter(Boolean).length;

  if (status === 'loading') {
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">Каталог материалов</span>
          </div>
          <p className="text-sm text-gray-400 hidden sm:block">
            {total > 0 ? `${total} материалов` : ''}
          </p>
        </header>

        <main className="flex-1 px-6 py-6">
          {/* ── Search + filter bar ───────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по материалу..."
                defaultValue={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm"
              />
            </div>

            {/* Категория */}
            <DropdownFilter
              label="Категория"
              active={!!filters.categoryId}
              activeLabel={filterOptions.categories.find((c) => c.id === filters.categoryId)?.name}
            >
              <DropOption label="Все категории" selected={!filters.categoryId} onClick={() => setFilter('categoryId', '')} />
              {filterOptions.categories.map((c) => (
                <DropOption key={c.id} label={c.name} selected={filters.categoryId === c.id} onClick={() => setFilter('categoryId', c.id)} />
              ))}
            </DropdownFilter>

            {/* Поверхность */}
            <DropdownFilter
              label="Поверхность"
              active={!!filters.surfaceType}
              activeLabel={SURFACE_LABELS[filters.surfaceType]}
            >
              <DropOption label="Все" selected={!filters.surfaceType} onClick={() => setFilter('surfaceType', '')} />
              {SURFACE_TYPES.map((s) => (
                <DropOption key={s.value} label={s.label} selected={filters.surfaceType === s.value} onClick={() => setFilter('surfaceType', s.value)} />
              ))}
            </DropdownFilter>

            {/* Уровень ремонта */}
            <DropdownFilter
              label="Уровень"
              active={!!filters.repairLevel}
              activeLabel={REPAIR_LABELS[filters.repairLevel]}
            >
              <DropOption label="Все уровни" selected={!filters.repairLevel} onClick={() => setFilter('repairLevel', '')} />
              {REPAIR_LEVELS.map((r) => (
                <DropOption key={r.value} label={r.label} selected={filters.repairLevel === r.value} onClick={() => setFilter('repairLevel', r.value)} />
              ))}
            </DropdownFilter>

            {/* Производитель */}
            <DropdownFilter
              label="Производитель"
              active={!!filters.manufacturerId}
              activeLabel={filterOptions.manufacturers.find((m) => m.id === filters.manufacturerId)?.name}
            >
              <DropOption label="Все производители" selected={!filters.manufacturerId} onClick={() => setFilter('manufacturerId', '')} />
              {filterOptions.manufacturers.map((m) => (
                <DropOption key={m.id} label={m.name} selected={filters.manufacturerId === m.id} onClick={() => setFilter('manufacturerId', m.id)} />
              ))}
            </DropdownFilter>

            {/* Цена */}
            <PriceDropdown
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onApply={(min, max) => { setFilters((f) => ({ ...f, minPrice: min, maxPrice: max })); setPage(1); }}
            />

            {/* Сортировка */}
            <DropdownFilter
              label={SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? 'Сортировка'}
              active={filters.sortBy !== 'name_asc'}
            >
              {SORT_OPTIONS.map((o) => (
                <DropOption key={o.value} label={o.label} selected={filters.sortBy === o.value} onClick={() => setFilter('sortBy', o.value)} />
              ))}
            </DropdownFilter>

            {/* Сбросить */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100"
              >
                <X size={14} />
                Сбросить
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.categoryId && (
                <FilterChip label={filterOptions.categories.find((c) => c.id === filters.categoryId)?.name ?? ''} onRemove={() => setFilter('categoryId', '')} />
              )}
              {filters.manufacturerId && (
                <FilterChip label={filterOptions.manufacturers.find((m) => m.id === filters.manufacturerId)?.name ?? ''} onRemove={() => setFilter('manufacturerId', '')} />
              )}
              {filters.repairLevel && (
                <FilterChip label={REPAIR_LABELS[filters.repairLevel] ?? filters.repairLevel} onRemove={() => setFilter('repairLevel', '')} />
              )}
              {filters.surfaceType && (
                <FilterChip label={SURFACE_LABELS[filters.surfaceType] ?? filters.surfaceType} onRemove={() => setFilter('surfaceType', '')} />
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <FilterChip label={`${filters.minPrice || '0'} — ${filters.maxPrice || '∞'} сом`} onRemove={() => { setFilters((f) => ({ ...f, minPrice: '', maxPrice: '' })); setPage(1); }} />
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-6 bg-gray-100 rounded w-1/3 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && materials.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Search size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Ничего не найдено</h3>
              <p className="text-sm text-gray-400 mb-5 max-w-xs">Попробуйте изменить параметры поиска или сбросить фильтры</p>
              <button onClick={resetFilters} className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-all">
                Сбросить фильтры
              </button>
            </div>
          )}

          {/* Material grid */}
          {!loading && materials.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mb-6">
                {materials.map((m) => (
                  <MaterialCard key={m.id} material={m} onClick={() => setSelected(m)} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                    return (
                      <button key={pg} onClick={() => setPage(pg)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${pg === page ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Detail modal */}
      {selected && <DetailModal material={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Dropdown filter ───────────────────────────────────────────────────────────
function DropdownFilter({
  label, active, activeLabel, children,
}: {
  label: string; active?: boolean; activeLabel?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayLabel = active && activeLabel ? activeLabel : label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm whitespace-nowrap ${
          active
            ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
        }`}
      >
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden py-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

function DropOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
        selected ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="text-left">{label}</span>
      {selected && <Check size={14} className="text-blue-600 flex-shrink-0" />}
    </button>
  );
}

// ── Price dropdown ────────────────────────────────────────────────────────────
function PriceDropdown({
  minPrice, maxPrice, onApply,
}: {
  minPrice: string; maxPrice: string; onApply: (min: string, max: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const ref = useRef<HTMLDivElement>(null);
  const active = !!(minPrice || maxPrice);

  useEffect(() => { setMin(minPrice); setMax(maxPrice); }, [minPrice, maxPrice]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm whitespace-nowrap ${
          active
            ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
        }`}
      >
        <span>{active ? `${minPrice || '0'} — ${maxPrice || '∞'} сом` : 'Цена'}</span>
        <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Диапазон цен (сом)</p>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              placeholder="От"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="number"
              placeholder="До"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onApply('', ''); setMin(''); setMax(''); setOpen(false); }}
              className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs rounded-xl hover:bg-gray-50 transition-all"
            >
              Сбросить
            </button>
            <button
              onClick={() => { onApply(min, max); setOpen(false); }}
              className="flex-1 py-2 bg-blue-600 text-white text-xs rounded-xl hover:bg-blue-700 transition-all"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Material card ─────────────────────────────────────────────────────────────
function MaterialCard({ material, onClick }: { material: Material; onClick: () => void }) {
  const inStock = material.stockQuantity > 0;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden flex-shrink-0">
        {material.imageUrl ? (
          <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover" />
        ) : (
          <MaterialPlaceholder name={material.name} />
        )}
        {/* Stock badge */}
        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${inStock ? 'bg-emerald-500/90 text-white' : 'bg-gray-400/90 text-white'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
          {inStock ? 'В наличии' : 'Нет'}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Category */}
        <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide mb-1 truncate">
          {material.category.name}
        </p>
        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-2">
          {material.name}
        </h3>
        {/* Manufacturer */}
        <p className="text-xs text-gray-400 mb-3">{material.manufacturer.name}</p>

        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${REPAIR_COLORS[material.repairLevel] ?? 'bg-gray-100 text-gray-500'}`}>
            {REPAIR_LABELS[material.repairLevel] ?? material.repairLevel}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${SURFACE_COLORS[material.surfaceType] ?? 'bg-gray-100 text-gray-500'}`}>
            {SURFACE_LABELS[material.surfaceType] ?? material.surfaceType}
          </span>
        </div>

        {/* Consumption */}
        <p className="text-xs text-gray-400 mb-auto">
          Расход: {material.consumptionPerM2} {material.unit}/м²
        </p>

        {/* Price + info */}
        <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-50">
          <div>
            <p className="text-[10px] text-gray-400">за упаковку</p>
            <p className="text-base font-bold text-gray-900">{material.price.toLocaleString('ru-RU')} сом</p>
          </div>
          <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium">
            <Info size={13} />
            Подробнее
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900">
        <X size={11} />
      </button>
    </span>
  );
}
