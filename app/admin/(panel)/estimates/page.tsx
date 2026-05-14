'use client';

import { FileText } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

export default function AdminEstimatesPage() {
  return (
    <AdminPageShell title="Сметы" subtitle="Все сметы пользователей системы">
      {() => (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-amber-900/30 border border-amber-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Смет пока нет</h3>
          <p className="text-slate-400 text-sm">
            Сметы пользователей будут отображаться здесь
          </p>
        </div>
      )}
    </AdminPageShell>
  );
}
