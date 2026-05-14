'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Save, Loader, AlertCircle, Shuffle, Search, Check, Plus } from 'lucide-react';
import AdminSelect from './AdminSelect';

interface MaterialOption {
  id: string;
  name: string;
  price: string;
  category: { name: string };
  manufacturer: { name: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AlternativeFormModal({ open, onClose, onSaved }: Props) {
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialId, setMaterialId] = useState('');
  const [selectedAlts, setSelectedAlts] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMaterialId('');
    setSelectedAlts([]);
    setSearch('');
    setError('');
    fetchMaterials();
  }, [open]);

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

  const materialOptions = useMemo(
    () =>
      materials.map((m) => ({
        value: m.id,
        label: `${m.name} · ${m.category.name} · ${m.manufacturer.name}`,
      })),
    [materials]
  );

  const baseMaterial = materials.find((m) => m.id === materialId);

  const altCandidates = useMemo(() => {
    if (!materialId) return [];
    const q = search.toLowerCase();
    return materials
      .filter((m) => m.id !== materialId)
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.category.name.toLowerCase().includes(q) ||
          m.manufacturer.name.toLowerCase().includes(q)
      );
  }, [materials, materialId, search]);

  const toggleAlt = (id: string) => {
    setSelectedAlts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!materialId) return setError('Выберите основной материал');
    if (selectedAlts.length === 0) return setError('Выберите хотя бы одну альтернативу');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, alternativeMaterialIds: selectedAlts }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-purple-500/15 border border-purple-500/30 rounded-lg flex items-center justify-center">
              <Shuffle className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Добавить альтернативы</h2>
              <p className="text-xs text-slate-400">
                Свяжите основной материал с одним или несколькими альтернативными
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Base material */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Основной материал *</label>
            <AdminSelect
              value={materialId}
              onChange={(v) => { setMaterialId(v); setSelectedAlts([]); }}
              options={materialOptions}
              placeholder={loadingMaterials ? 'Загрузка...' : '— выберите материал —'}
              disabled={loadingMaterials}
            />
            {baseMaterial && (
              <p className="text-xs text-slate-500 mt-1.5">
                Цена основного: <span className="text-white font-medium">{Number(baseMaterial.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span>
              </p>
            )}
          </div>

          {/* Alternatives picker */}
          {materialId && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Альтернативные материалы * <span className="text-slate-500">(выбрано: {selectedAlts.length})</span>
                </label>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Поиск по альтернативам..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto bg-slate-900/40 border border-slate-700 rounded-lg divide-y divide-slate-700/60">
                {altCandidates.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    {search ? 'Ничего не найдено' : 'Нет других материалов'}
                  </div>
                ) : (
                  altCandidates.map((m) => {
                    const checked = selectedAlts.includes(m.id);
                    const priceDiff = baseMaterial ? Number(m.price) - Number(baseMaterial.price) : 0;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAlt(m.id)}
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors
                          ${checked ? 'bg-amber-500/10' : 'hover:bg-slate-700/40'}`}
                      >
                        {/* Custom checkbox */}
                        <span
                          className={`w-5 h-5 flex items-center justify-center rounded-md border flex-shrink-0 transition-all
                            ${checked
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400'
                              : 'bg-slate-700/50 border-slate-600'
                            }`}
                        >
                          <Check
                            className={`w-3.5 h-3.5 text-white transition-all
                              ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                            strokeWidth={3}
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-white truncate">{m.name}</p>
                            <span className="text-sm font-medium text-slate-300 whitespace-nowrap">
                              {Number(m.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-xs text-slate-500 truncate">
                              {m.category.name} · {m.manufacturer.name}
                            </p>
                            {baseMaterial && (
                              <span className={`text-xs font-medium whitespace-nowrap ${priceDiff < 0 ? 'text-green-400' : priceDiff > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                                {priceDiff === 0 ? '=' : priceDiff < 0 ? '↓' : '↑'} {Math.abs(priceDiff).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Уже существующие связи будут пропущены автоматически
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-700 flex-shrink-0">
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
            disabled={saving || !materialId || selectedAlts.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>
              {saving
                ? 'Сохранение...'
                : `Добавить ${selectedAlts.length > 0 ? `(${selectedAlts.length})` : ''}`
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
