'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Search, Edit, Trash2, AlertCircle, Package, Calendar } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';
import CategoryFormModal, { CategoryFormData } from '@/app/admin/components/CategoryFormModal';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { materials: number };
}

export default function AdminCategoriesPage() {
  return (
    <AdminPageShell title="Категории" subtitle="Управление категориями материалов">
      {() => <CategoriesContent />}
    </AdminPageShell>
  );
}

function CategoriesContent() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryFormData | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const handleEdit = (cat: CategoryRow) => {
    setEditing({ id: cat.id, name: cat.name });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'Ошибка при удалении');
        return;
      }
      await fetchCategories();
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить категорию</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка категорий...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-green-900/30 border border-green-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {search ? 'Ничего не найдено' : 'Категории не добавлены'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {search ? 'Попробуйте изменить запрос' : 'Создайте первую категорию материалов'}
          </p>
          {!search && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить категорию</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="group bg-slate-800/40 border border-slate-700 rounded-2xl p-5 hover:border-amber-500/40 hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-green-500/15 border border-green-500/30 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeleteError(''); setDeleteTarget(cat); }}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-semibold text-white mb-1 truncate">{cat.name}</h3>
              <p className="text-xs text-slate-500 truncate mb-4 font-mono">{cat.slug}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <div className="flex items-center space-x-1.5 text-xs">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-400">
                    {cat._count.materials} {cat._count.materials === 1 ? 'материал' : cat._count.materials >= 2 && cat._count.materials <= 4 ? 'материала' : 'материалов'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(cat.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500">
          Показано {filtered.length} из {categories.length} категорий
        </p>
      )}

      {/* Form modal */}
      <CategoryFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchCategories}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-3 mb-5">
              <div className="w-10 h-10 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">Удалить категорию?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Категория «<span className="text-white font-medium">{deleteTarget.name}</span>» будет удалена. Это действие необратимо.
                </p>
                {deleteError && (
                  <div className="mt-3 p-2.5 bg-red-900/40 border border-red-700/50 rounded-lg">
                    <p className="text-xs text-red-300">{deleteError}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
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
