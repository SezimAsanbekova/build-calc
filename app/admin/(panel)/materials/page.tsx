'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';
import MaterialFormModal, { MaterialFormData } from '@/app/admin/components/MaterialFormModal';
import AdminSelect from '@/app/admin/components/AdminSelect';

interface MaterialRow {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  manufacturerId: string;
  repairLevel: 'econom' | 'standard' | 'premium';
  surfaceType?: 'wall' | 'floor' | 'ceiling' | null;
  sectionId?: string | null;
  section?: { id: string; name: string; slug: string; icon: string | null } | null;
  price: string;
  consumptionPerM2: string;
  unit: string;
  packageQuantity: string;
  packageUnit: string;
  stockQuantity: number;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
  category: { id: string; name: string };
  manufacturer: { id: string; name: string };
  createdAt: string;
}

const repairLevelLabels: Record<string, string> = {
  econom: 'Эконом',
  standard: 'Стандарт',
  premium: 'Премиум',
};

const legacySurfaceLabels: Record<string, string> = {
  wall: 'Стена',
  floor: 'Пол',
  ceiling: 'Потолок',
};

const repairLevelStyles: Record<string, string> = {
  econom: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  standard: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  premium: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

export default function AdminMaterialsPage() {
  return (
    <AdminPageShell title="Материалы" subtitle="Управление каталогом строительных материалов">
      {() => <MaterialsContent />}
    </AdminPageShell>
  );
}

function MaterialsContent() {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [repairLevelFilter, setRepairLevelFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sectionOptions, setSectionOptions] = useState<{ id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<MaterialFormData> | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const [matRes, secRes] = await Promise.all([
        fetch('/api/admin/materials'),
        fetch('/api/sections'),
      ]);
      if (matRes.ok) {
        const data = await matRes.json();
        setMaterials(data.materials);
      }
      if (secRes.ok) {
        const data = await secRes.json();
        setSectionOptions(data.sections ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAdd = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const handleEdit = (m: MaterialRow) => {
    setEditing({
      id: m.id,
      name: m.name,
      categoryId: m.categoryId,
      manufacturerId: m.manufacturerId,
      repairLevel: m.repairLevel,
      surfaceType: m.surfaceType ?? undefined,
      sectionId: m.sectionId ?? '',
      price: m.price.toString(),
      consumptionPerM2: m.consumptionPerM2.toString(),
      unit: m.unit,
      packageQuantity: m.packageQuantity.toString(),
      packageUnit: m.packageUnit,
      stockQuantity: m.stockQuantity.toString(),
      description: m.description || '',
      imageUrl: m.imageUrl || '',
      isAvailable: m.isAvailable,
      isActive: m.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/materials/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMaterials();
        setDeleteId(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const filtered = materials.filter((m) => {
    // Фильтр по поиску
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.name.toLowerCase().includes(search.toLowerCase()) ||
      m.manufacturer.name.toLowerCase().includes(search.toLowerCase());

    // Фильтр по уровню ремонта
    const matchesRepairLevel = repairLevelFilter === 'all' || m.repairLevel === repairLevelFilter;

    // Фильтр по секции
    const matchesSurfaceType = sectionFilter === 'all' || m.sectionId === sectionFilter || (m.section?.id === sectionFilter);

    // Фильтр по дате
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const createdDate = new Date(m.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case 'year':
          matchesDate = daysDiff <= 365;
          break;
      }
    }

    return matchesSearch && matchesRepairLevel && matchesSurfaceType && matchesDate;
  });

  const sectionSelectOptions = [
    { value: 'all', label: 'Все секции' },
    ...sectionOptions.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Поиск, фильтры и кнопка добавления в одной линии */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Левая часть: поиск и фильтры */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            {/* Поиск */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Фильтр по уровню */}
            <div className="w-full sm:w-40">
              <AdminSelect
                value={repairLevelFilter}
                onChange={setRepairLevelFilter}
                placeholder="Уровень"
                options={[
                  { value: 'all', label: 'Все уровни' },
                  { value: 'econom', label: 'Эконом' },
                  { value: 'standard', label: 'Стандарт' },
                  { value: 'premium', label: 'Премиум' },
                ]}
              />
            </div>

            {/* Фильтр по секции */}
            <div className="w-full sm:w-44">
              <AdminSelect
                value={sectionFilter}
                onChange={setSectionFilter}
                placeholder="Секция"
                options={sectionSelectOptions}
              />
            </div>

            {/* Фильтр по дате */}
            <div className="w-full sm:w-44">
              <AdminSelect
                value={dateFilter}
                onChange={setDateFilter}
                placeholder="Период"
                options={[
                  { value: 'all', label: 'За всё время' },
                  { value: 'today', label: 'Сегодня' },
                  { value: 'week', label: 'За неделю' },
                  { value: 'month', label: 'За месяц' },
                  { value: 'year', label: 'За год' },
                ]}
              />
            </div>

            {/* Сброс фильтров */}
            {(repairLevelFilter !== 'all' || sectionFilter !== 'all' || dateFilter !== 'all' || search) && (
              <button
                onClick={() => {
                  setRepairLevelFilter('all');
                  setSectionFilter('all');
                  setDateFilter('all');
                  setSearch('');
                }}
                className="px-3 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Сбросить
              </button>
            )}
          </div>

          {/* Правая часть: кнопка добавления */}
          <button
            onClick={handleAdd}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all whitespace-nowrap w-full lg:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить материал</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Загрузка материалов...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {search ? 'Ничего не найдено' : 'Материалы не добавлены'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {search ? 'Попробуйте изменить запрос' : 'Добавьте первый материал в каталог'}
            </p>
            {!search && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить материал</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/60 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Материал</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Категория</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Производитель</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Уровень</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Секция</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Цена</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Склад</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {m.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.imageUrl} alt={m.name} className="w-10 h-10 rounded-lg object-cover bg-slate-700 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{m.name}</p>
                          <p className="text-xs text-slate-500 truncate">{m.unit} · в упак. {Number(m.packageQuantity)} {m.packageUnit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{m.category.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{m.manufacturer.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 border rounded-md text-xs font-medium ${repairLevelStyles[m.repairLevel]}`}>
                        {repairLevelLabels[m.repairLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                      {m.section?.name ?? (m.surfaceType ? legacySurfaceLabels[m.surfaceType] : '—')}
                    </td>
                    <td className="px-4 py-3 text-sm text-white text-right whitespace-nowrap font-medium">
                      {Number(m.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right whitespace-nowrap">{m.stockQuantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEdit(m)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(m.id)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500">
          Показано {filtered.length} из {materials.length} материалов
        </p>
      )}

      {/* Form modal */}
      <MaterialFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchMaterials}
      />

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-3 mb-5">
              <div className="w-10 h-10 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Удалить материал?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Материал будет помечен как удалённый и скрыт из каталога. Действие можно отменить вручную через БД.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteId(null)}
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
