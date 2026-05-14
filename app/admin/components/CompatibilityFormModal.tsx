'use client';

import { useEffect, useState } from 'react';
import { X, Save, Loader, AlertCircle, GitMerge } from 'lucide-react';
import AdminSelect from './AdminSelect';

export interface CompatibilityFormData {
  id?: string;
  materialId: string;
  compatibleMaterialId: string;
  compatibilityType: 'required' | 'recommended' | 'incompatible';
  reason: string;
}

interface MaterialOption {
  id: string;
  name: string;
  category: { name: string };
  manufacturer: { name: string };
}

interface Props {
  open: boolean;
  initial?: CompatibilityFormData;
  onClose: () => void;
  onSaved: () => void;
}

const compatibilityTypes = [
  { value: 'required', label: 'Обязательная связка' },
  { value: 'recommended', label: 'Рекомендованная' },
  { value: 'incompatible', label: 'Несовместимы' },
];

const emptyForm: CompatibilityFormData = {
  materialId: '',
  compatibleMaterialId: '',
  compatibilityType: 'recommended',
  reason: '',
};

export default function CompatibilityFormModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CompatibilityFormData>(emptyForm);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(initial ?? emptyForm);
    setError('');
    fetchMaterials();
  }, [open, initial]);

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const res = await fetch('/api/admin/materials');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials);
      }
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.materialId) return setError('Выберите первый материал');
    if (!form.compatibleMaterialId) return setError('Выберите второй материал');
    if (form.materialId === form.compatibleMaterialId) {
      return setError('Нельзя связать материал с самим собой');
    }

    setSaving(true);
    try {
      const url = form.id
        ? `/api/admin/compatibility/${form.id}`
        : '/api/admin/compatibility';
      const method = form.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: form.materialId,
          compatibleMaterialId: form.compatibleMaterialId,
          compatibilityType: form.compatibilityType,
          reason: form.reason.trim() || null,
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

  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';
  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.name} · ${m.category.name} · ${m.manufacturer.name}`,
  }));

  // Опции для второго материала — без выбранного первого
  const secondOptions = materialOptions.filter((o) => o.value !== form.materialId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-center justify-center">
              <GitMerge className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {form.id ? 'Редактировать связь' : 'Новая связь совместимости'}
              </h2>
              <p className="text-xs text-slate-400">
                Укажите тип взаимодействия двух материалов
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
            <label className={labelCls}>Первый материал *</label>
            <AdminSelect
              value={form.materialId}
              onChange={(v) => setForm({ ...form, materialId: v })}
              options={materialOptions}
              placeholder={loadingMaterials ? 'Загрузка...' : '— выберите материал —'}
              disabled={loadingMaterials || !!form.id}
            />
          </div>

          <div>
            <label className={labelCls}>Второй материал *</label>
            <AdminSelect
              value={form.compatibleMaterialId}
              onChange={(v) => setForm({ ...form, compatibleMaterialId: v })}
              options={secondOptions}
              placeholder={loadingMaterials ? 'Загрузка...' : '— выберите материал —'}
              disabled={loadingMaterials || !!form.id || !form.materialId}
            />
          </div>

          <div>
            <label className={labelCls}>Тип связи *</label>
            <AdminSelect
              value={form.compatibilityType}
              onChange={(v) =>
                setForm({ ...form, compatibilityType: v as CompatibilityFormData['compatibilityType'] })
              }
              options={compatibilityTypes}
            />
            <div className="mt-2 text-xs text-slate-500 space-y-1">
              <p><span className="text-red-400 font-medium">Несовместимы</span> — выводится предупреждение, материалы нельзя использовать вместе</p>
              <p><span className="text-amber-400 font-medium">Обязательная</span> — второй материал требуется при выборе первого</p>
              <p><span className="text-green-400 font-medium">Рекомендованная</span> — предлагается как дополнение</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Причина / комментарий</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              placeholder="Например: грунтовка нужна перед нанесением краски"
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
            />
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
            <span>{saving ? 'Сохранение...' : form.id ? 'Сохранить' : 'Создать'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
