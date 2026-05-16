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
            <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-20 backdrop-blur-sm">
              <div className="h-16 px-6 lg:px-8 flex items-center">
                <div className="pl-12 lg:pl-0 flex items-baseline gap-3 min-w-0">
                  <h1 className="text-base font-bold text-white whitespace-nowrap">{title}</h1>
                  {subtitle && (
                    <span className="text-sm text-slate-400 truncate hidden sm:inline">
                      {subtitle}
                    </span>
                  )}
                </div>
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
