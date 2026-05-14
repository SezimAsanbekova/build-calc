'use client';

import { Factory, Plus, Search } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

export default function AdminManufacturersPage() {
  return (
    <AdminPageShell title="Производители" subtitle="Управление производителями материалов">
      {() => (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск производителей..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all">
              <Plus className="w-4 h-4" />
              <span>Добавить производителя</span>
            </button>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-blue-900/30 border border-blue-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Factory className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Производители не добавлены</h3>
            <p className="text-slate-400 text-sm mb-6">Добавьте первого производителя</p>
            <button className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              <span>Добавить производителя</span>
            </button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
