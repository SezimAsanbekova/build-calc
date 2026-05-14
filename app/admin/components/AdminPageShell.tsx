'use client';

import AdminSidebar from './AdminSidebar';
import AdminAuthGuard, { AdminUser } from './AdminAuthGuard';

interface AdminPageShellProps {
  title: string;
  subtitle?: string;
  children: (admin: AdminUser) => React.ReactNode;
}

export default function AdminPageShell({ title, subtitle, children }: AdminPageShellProps) {
  return (
    <AdminAuthGuard>
      {(admin) => (
        <>
          <AdminSidebar adminName={admin.name} adminEmail={admin.email} />
          <main className="flex-1 overflow-auto">
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4 lg:px-8 sticky top-0 z-20 backdrop-blur-sm">
              <div className="pl-12 lg:pl-0">
                <h1 className="text-xl font-bold text-white">{title}</h1>
                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
              </div>
            </div>
            <div className="p-6 lg:p-8">
              {children(admin)}
            </div>
          </main>
        </>
      )}
    </AdminAuthGuard>
  );
}
