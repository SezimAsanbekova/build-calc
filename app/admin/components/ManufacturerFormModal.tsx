'use client';

import { useEffect, useState } from 'react';
import { X, Save, Loader, AlertCircle, Factory } from 'lucide-react';

export interface ManufacturerFormData {
  id?: string;
  name: string;
  country: string;
}

interface Props {
  open: boolean;
  initial?: ManufacturerFormData;
  onClose: () => void;
  onSaved: () => void;
}

export default function ManufacturerFormModal({ open, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setCountry(initial?.country ?? '');
    setError('');
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Введите название производителя');
      return;
    }

    setSaving(true);
    try {
      const url = initial?.id
        ? `/api/admin/manufacturers/${initial.id}`
        : '/api/admin/manufacturers';
      const method = initial?.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          country: country.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка при сохранении');
        setSaving(false);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Произошла ошибка. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls =
    'w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-500/15 border border-blue-500/30 rounded-lg flex items-center justify-center">
              <Factory className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {initial?.id ? 'Редактировать производителя' : 'Новый производитель'}
              </h2>
              <p className="text-xs text-slate-400">
                {initial?.id ? 'Изменение данных производителя' : 'Добавление нового производителя'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Название *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Knauf, Tikkurila, Ceresit..."
              autoFocus
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Страна</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Германия, Финляндия, Россия..."
              className={inputCls}
            />
            <p className="text-xs text-slate-500 mt-1.5">Необязательное поле</p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Сохранение...' : initial?.id ? 'Сохранить' : 'Создать'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
