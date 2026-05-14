'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

interface AdminAuthGuardProps {
  children: (admin: AdminUser) => React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'admin') {
          router.push('/profile');
          return;
        }
        setAdmin(data.user);
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return <>{children(admin)}</>;
}
