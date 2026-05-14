'use client';

import { Shuffle, Plus } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

export default function AdminAlternativesPage() {
  return (
    <AdminPageShell title="Альтернативы" subtitle="Управление альтернативными материалами">
      {() => (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all">
              <Plus className="w-4 h-4" />
              <span>Добавить альтернативу</span>
            </button>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shuffle className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Альтернативы не заданы</h3>
            <p className="text-slate-400 text-sm mb-6">
              Укажите альтернативные материалы для замены при расчётах
            </p>
            <button className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              <span>Добавить альтернативу</span>
            </button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
