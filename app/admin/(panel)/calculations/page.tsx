'use client';

import { Calculator } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

export default function AdminCalculationsPage() {
  return (
    <AdminPageShell title="Расчёты" subtitle="Все расчёты пользователей системы">
      {() => (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-green-900/30 border border-green-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Расчётов пока нет</h3>
          <p className="text-slate-400 text-sm">
            Расчёты пользователей будут отображаться здесь
          </p>
        </div>
      )}
    </AdminPageShell>
  );
}
