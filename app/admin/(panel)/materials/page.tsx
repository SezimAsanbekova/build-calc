'use client';

import { Package, Plus, Search, Filter } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

export default function AdminMaterialsPage() {
  return (
    <AdminPageShell title="Материалы" subtitle="Управление каталогом строительных материалов">
      {() => (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Поиск материалов..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <button className="flex items-center space-x-2 px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg text-sm transition-colors">
                <Filter className="w-4 h-4" />
                <span>Фильтр</span>
              </button>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all">
              <Plus className="w-4 h-4" />
              <span>Добавить материал</span>
            </button>
          </div>

          {/* Empty state */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Материалы не добавлены</h3>
            <p className="text-slate-400 text-sm mb-6">Добавьте первый материал в каталог</p>
            <button className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              <span>Добавить материал</span>
            </button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
