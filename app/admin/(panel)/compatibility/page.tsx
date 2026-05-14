'use client';

import { useEffect, useState } from 'react';
import {
  GitMerge, Plus, Search, Edit, Trash2, AlertCircle, AlertTriangle,
  CheckCircle, ArrowRight, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import AdminPageShell from '@/app/admin/components/AdminPageShell';
import CompatibilityFormModal, { CompatibilityFormData } from '@/app/admin/components/CompatibilityFormModal';
import AdminSelect from '@/app/admin/components/AdminSelect';

type CompatType = 'required' | 'recommended' | 'incompatible';

interface MaterialBrief {
  id: string;
  name: string;
  category: { name: string };
  manufacturer: { name: string };
}

interface CompatRow {
  id: string;
  compatibilityType: CompatType;
  reason: string | null;
  material: MaterialBrief;
  compatibleMaterial: MaterialBrief;
}

interface CheckResult {
  compatible: boolean;
  hasMissingRequired: boolean;
  incompatibilities: { materialId: string; materialName: string; conflictsWith: string; conflictsWithName: string; reason: string | null }[];
  missingRequired: { materialId: string; materialName: string; type: 'required' | 'recommended'; reason: string | null }[];
  recommendations: { materialId: string; materialName: string; type: 'required' | 'recommended'; reason: string | null }[];
  checkedMaterials: { id: string; name: string }[];
}

const typeLabels: Record<CompatType, string> = {
  required: 'Обязательная',
  recommended: 'Рекомендуется',
  incompatible: 'Несовместимы',
};

const typeStyles: Record<CompatType, string> = {
  required: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  recommended: 'bg-green-500/15 text-green-400 border-green-500/30',
  incompatible: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function AdminCompatibilityPage() {
  return (
    <AdminPageShell title="Совместимость" subtitle="Правила взаимодействия материалов между собой">
      {() => <CompatibilityContent />}
    </AdminPageShell>
  );
}

function CompatibilityContent() {
  const [records, setRecords] = useState<CompatRow[]>([]);
  const [materials, setMaterials] = useState<MaterialBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | CompatType>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompatibilityFormData | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CompatRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Чекер совместимости
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickValue, setPickValue] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        fetch('/api/admin/compatibility'),
        fetch('/api/admin/materials'),
      ]);
      if (rRes.ok) setRecords((await rRes.json()).records);
      if (mRes.ok) setMaterials((await mRes.json()).materials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAdd = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const handleEdit = (r: CompatRow) => {
    setEditing({
      id: r.id,
      materialId: r.material.id,
      compatibleMaterialId: r.compatibleMaterial.id,
      compatibilityType: r.compatibilityType,
      reason: r.reason || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/compatibility/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAll();
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      !search ||
      r.material.name.toLowerCase().includes(search.toLowerCase()) ||
      r.compatibleMaterial.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || r.compatibilityType === filterType;
    return matchesSearch && matchesType;
  });

  // ── Чекер ──
  const addToSelection = (id: string) => {
    if (!id || selectedIds.includes(id)) return;
    setSelectedIds([...selectedIds, id]);
    setPickValue('');
    setCheckResult(null);
  };

  const removeFromSelection = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
    setCheckResult(null);
  };

  const runCheck = async () => {
    if (selectedIds.length < 1) return;
    setChecking(true);
    try {
      const res = await fetch('/api/compatibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIds: selectedIds }),
      });
      if (res.ok) {
        const data: CheckResult = await res.json();
        setCheckResult(data);
      }
    } finally {
      setChecking(false);
    }
  };

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.name} · ${m.category.name} · ${m.manufacturer.name}`,
  }));

  const filterOptions = [
    { value: '', label: 'Все типы' },
    { value: 'incompatible', label: 'Несовместимы' },
    { value: 'required', label: 'Обязательные' },
    { value: 'recommended', label: 'Рекомендованные' },
  ];

  const pickOptions = materialOptions.filter((o) => !selectedIds.includes(o.value));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-1 gap-3 flex-col sm:flex-row max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по материалам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full sm:w-52">
            <AdminSelect
              value={filterType}
              onChange={(v) => setFilterType(v as '' | CompatType)}
              options={filterOptions}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCheckerOpen(!checkerOpen)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border
              ${checkerOpen
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Проверить совместимость</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить связь</span>
          </button>
        </div>
      </div>

      {/* Compatibility checker */}
      {checkerOpen && (
        <div className="bg-slate-800/40 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Проверка совместимости</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Выберите несколько материалов, чтобы проверить совместимы ли они и получить рекомендации
              </p>
            </div>
            <button
              onClick={() => { setCheckerOpen(false); setSelectedIds([]); setCheckResult(null); }}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Picker */}
          <div className="flex gap-2">
            <div className="flex-1">
              <AdminSelect
                value={pickValue}
                onChange={(v) => addToSelection(v)}
                options={pickOptions}
                placeholder="Добавить материал в подбор..."
              />
            </div>
            <button
              onClick={runCheck}
              disabled={selectedIds.length === 0 || checking}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {checking ? 'Проверка...' : 'Проверить'}
            </button>
          </div>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const m = materials.find((mat) => mat.id === id);
                return (
                  <div
                    key={id}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white"
                  >
                    <span>{m?.name || 'Неизвестно'}</span>
                    <button
                      onClick={() => removeFromSelection(id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Result */}
          {checkResult && (
            <div className="space-y-3 pt-2 border-t border-slate-700">
              {/* Verdict */}
              {checkResult.compatible ? (
                <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-xl flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-300">Материалы совместимы</p>
                    <p className="text-xs text-green-400/80 mt-0.5">
                      Выбранные материалы можно использовать вместе
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl">
                  <div className="flex items-start space-x-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-300">Обнаружены несовместимости</p>
                      <p className="text-xs text-red-400/80 mt-0.5">
                        Эти материалы нельзя использовать вместе
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-8">
                    {checkResult.incompatibilities.map((i, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center space-x-2 text-red-300">
                          <span className="font-medium">{i.materialName}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="font-medium">{i.conflictsWithName}</span>
                        </div>
                        {i.reason && <p className="text-red-400/70 ml-1 mt-0.5">{i.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing required */}
              {checkResult.missingRequired.length > 0 && (
                <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-xl">
                  <div className="flex items-start space-x-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Требуются обязательные материалы</p>
                      <p className="text-xs text-amber-400/80 mt-0.5">
                        Для корректной работы необходимо добавить в подбор:
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-8">
                    {checkResult.missingRequired.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-amber-300">{r.materialName}</span>
                          {r.reason && <p className="text-amber-400/70 mt-0.5">{r.reason}</p>}
                        </div>
                        <button
                          onClick={() => addToSelection(r.materialId)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md text-xs font-medium transition-colors flex-shrink-0 ml-2"
                        >
                          Добавить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {checkResult.recommendations.length > 0 && (
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-xl">
                  <div className="flex items-start space-x-3 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-300">Рекомендуемые дополнения</p>
                      <p className="text-xs text-blue-400/80 mt-0.5">
                        Эти материалы хорошо сочетаются с выбранными
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-8">
                    {checkResult.recommendations.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-blue-300">{r.materialName}</span>
                          {r.reason && <p className="text-blue-400/70 mt-0.5">{r.reason}</p>}
                        </div>
                        <button
                          onClick={() => addToSelection(r.materialId)}
                          className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-md text-xs font-medium transition-colors flex-shrink-0 ml-2"
                        >
                          Добавить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-amber-900/30 border border-amber-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GitMerge className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {search || filterType ? 'Ничего не найдено' : 'Связи не заданы'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {search || filterType
              ? 'Попробуйте изменить фильтры'
              : 'Добавьте первое правило совместимости'}
          </p>
          {!search && !filterType && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить связь</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/60 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Материал</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Связан с</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Причина</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-white font-medium">{r.material.name}</div>
                      <div className="text-xs text-slate-500">
                        {r.material.category.name} · {r.material.manufacturer.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <ArrowRight className="w-4 h-4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white font-medium">{r.compatibleMaterial.name}</div>
                      <div className="text-xs text-slate-500">
                        {r.compatibleMaterial.category.name} · {r.compatibleMaterial.manufacturer.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 border rounded-md text-xs font-medium ${typeStyles[r.compatibilityType]}`}>
                        {typeLabels[r.compatibilityType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {r.reason ? (
                        <p className="text-xs text-slate-400 truncate" title={r.reason}>{r.reason}</p>
                      ) : (
                        <span className="text-xs text-slate-600 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEdit(r)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500">
          Показано {filtered.length} из {records.length} связей
        </p>
      )}

      {/* Form modal */}
      <CompatibilityFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAll}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-3 mb-5">
              <div className="w-10 h-10 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Удалить связь?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Будет удалена связь между «<span className="text-white">{deleteTarget.material.name}</span>» и «<span className="text-white">{deleteTarget.compatibleMaterial.name}</span>».
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
