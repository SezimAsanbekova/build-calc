'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, Eye, EyeOff } from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';

interface Setting {
  id: string;
  key: string;
  value: string;
}

const SENSITIVE_KEYS = ['ADMIN_TELEGRAM_BOT_TOKEN'];

export default function AdminSettingsPage() {
  return (
    <AdminPageShell title="Настройки" subtitle="Конфигурация системы">
      {() => <SettingsContent />}
    </AdminPageShell>
  );
}

function SettingsContent() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
          const vals: Record<string, string> = {};
          data.settings.forEach((s: Setting) => { vals[s.key] = s.value; });
          setEditValues(vals);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValues[key] }),
      });
      if (res.ok) {
        setSaved((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  const labels: Record<string, { label: string; description: string }> = {
    ADMIN_TELEGRAM_BOT_TOKEN: {
      label: 'Telegram Bot Token',
      description: 'Токен бота от @BotFather для отправки кодов 2FA',
    },
    ADMIN_TELEGRAM_USER_ID: {
      label: 'Telegram User ID',
      description: 'ID Telegram-аккаунта администратора для получения кодов',
    },
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {loading ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка настроек...</p>
        </div>
      ) : settings.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-700/50 border border-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Настройки не найдены</h3>
          <p className="text-slate-400 text-sm">Добавьте записи в таблицу settings через SQL</p>
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => {
            const meta = labels[setting.key];
            const isSensitive = SENSITIVE_KEYS.includes(setting.key);
            const isVisible = showSensitive[setting.key];
            return (
              <div key={setting.key} className="bg-slate-800/40 border border-slate-700 rounded-xl p-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-white">{meta?.label || setting.key}</p>
                  {meta?.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={isSensitive && !isVisible ? 'password' : 'text'}
                      value={editValues[setting.key] ?? ''}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all pr-10"
                    />
                    {isSensitive && (
                      <button
                        type="button"
                        onClick={() => setShowSensitive((prev) => ({ ...prev, [setting.key]: !isVisible }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleSave(setting.key)}
                    disabled={saving === setting.key}
                    className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-shrink-0
                      ${saved[setting.key]
                        ? 'bg-green-600 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/20'
                      } disabled:opacity-50`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{saved[setting.key] ? 'Сохранено' : saving === setting.key ? '...' : 'Сохранить'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
