'use client';

import { useEffect, useState } from 'react';
import { Users, Search, Shield, User, Mail, Calendar } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  return (
    <AdminPageShell title="Пользователи" subtitle="Управление аккаунтами пользователей">
      {() => <UsersContent />}
    </AdminPageShell>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Поиск по email или имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-blue-900/30 border border-blue-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {search ? 'Ничего не найдено' : 'Пользователей нет'}
            </h3>
            <p className="text-slate-400 text-sm">
              {search ? 'Попробуйте изменить запрос' : 'Зарегистрированные пользователи появятся здесь'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-700 bg-slate-800/60">
              <div className="col-span-4 flex items-center space-x-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <User className="w-3 h-3" />
                <span>Пользователь</span>
              </div>
              <div className="col-span-3 flex items-center space-x-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <Mail className="w-3 h-3" />
                <span>Email</span>
              </div>
              <div className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Роль</div>
              <div className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</div>
              <div className="col-span-1 flex items-center space-x-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
              </div>
            </div>

            {/* Rows */}
            {filtered.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors"
              >
                <div className="col-span-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {(user.name || user.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-white truncate">{user.name || '—'}</span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="text-sm text-slate-300 truncate">{user.email}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-500/15 border border-amber-500/30 rounded-md text-xs text-amber-400">
                      <Shield className="w-3 h-3" />
                      <span>Админ</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-md text-xs text-slate-400">
                      Пользователь
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex items-center">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center space-x-1 text-xs text-green-400">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <span>Подтверждён</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs text-slate-500">
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                      <span>Не подтверждён</span>
                    </span>
                  )}
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500">
          Показано {filtered.length} из {users.length} пользователей
        </p>
      )}
    </div>
  );
}
