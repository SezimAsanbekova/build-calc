'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Save, Loader, AlertCircle, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import AdminSelect from './AdminSelect';
import NumberInput from './NumberInput';
import AdminCheckbox from './AdminCheckbox';

export interface MaterialFormData {
  id?: string;
  name: string;
  categoryId: string;
  manufacturerId: string;
  repairLevel: 'econom' | 'standard' | 'premium';
  surfaceType: 'wall' | 'floor' | 'ceiling';
  price: string;
  consumptionPerM2: string;
  unit: string;
  packageQuantity: string;
  packageUnit: string;
  stockQuantity: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  isActive: boolean;
}

interface OptionItem {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  initial?: Partial<MaterialFormData>;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm: MaterialFormData = {
  name: '',
  categoryId: '',
  manufacturerId: '',
  repairLevel: 'standard',
  surfaceType: 'wall',
  price: '',
  consumptionPerM2: '',
  unit: 'м²',
  packageQuantity: '',
  packageUnit: 'шт',
  stockQuantity: '0',
  description: '',
  imageUrl: '',
  isAvailable: true,
  isActive: true,
};

const repairLevels = [
  { value: 'econom', label: 'Эконом' },
  { value: 'standard', label: 'Стандарт' },
  { value: 'premium', label: 'Премиум' },
];

const surfaceTypes = [
  { value: 'wall', label: 'Стена' },
  { value: 'floor', label: 'Пол' },
  { value: 'ceiling', label: 'Потолок' },
];

export default function MaterialFormModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<MaterialFormData>(emptyForm);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<OptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [similarMaterials, setSimilarMaterials] = useState<any[]>([]);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline create category/manufacturer
  const [newCategory, setNewCategory] = useState('');
  const [newManufacturer, setNewManufacturer] = useState({ name: '', country: '' });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewManufacturer, setShowNewManufacturer] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...emptyForm, ...initial });
    setError('');
    setSimilarMaterials([]);
    setShowSimilarWarning(false);
    fetchOptions();
  }, [open, initial]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [catRes, mfRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/manufacturers'),
      ]);
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories);
      }
      if (mfRes.ok) {
        const data = await mfRes.json();
        setManufacturers(data.manufacturers);
      }
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
        setForm((prev) => ({ ...prev, categoryId: data.category.id }));
        setNewCategory('');
        setShowNewCategory(false);
      }
    } catch {
      setError('Не удалось создать категорию');
    }
  };

  const handleCreateManufacturer = async () => {
    if (!newManufacturer.name.trim()) return;
    try {
      const res = await fetch('/api/admin/manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newManufacturer.name.trim(),
          country: newManufacturer.country.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setManufacturers((prev) => [...prev, data.manufacturer].sort((a, b) => a.name.localeCompare(b.name)));
        setForm((prev) => ({ ...prev, manufacturerId: data.manufacturer.id }));
        setNewManufacturer({ name: '', country: '' });
        setShowNewManufacturer(false);
      }
    } catch {
      setError('Не удалось создать производителя');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Недопустимый тип файла. Разрешены: JPG, PNG, WEBP');
      return;
    }

    // Проверка размера (макс 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Файл слишком большой. Максимум 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'materials');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка загрузки изображения');
        return;
      }

      const data = await res.json();
      setForm({ ...form, imageUrl: data.url });
    } catch {
      setError('Произошла ошибка при загрузке изображения');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, forceCreate = false) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Укажите название');
    if (!form.categoryId) return setError('Выберите категорию');
    if (!form.manufacturerId) return setError('Выберите производителя');
    if (!form.price || Number(form.price) <= 0) return setError('Укажите корректную цену');
    if (!form.consumptionPerM2 || Number(form.consumptionPerM2) <= 0) return setError('Укажите расход на м²');
    if (!form.packageQuantity || Number(form.packageQuantity) <= 0) return setError('Укажите количество в упаковке');

    setSaving(true);
    try {
      const url = form.id ? `/api/admin/materials/${form.id}` : '/api/admin/materials';
      const method = form.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          consumptionPerM2: Number(form.consumptionPerM2),
          packageQuantity: Number(form.packageQuantity),
          stockQuantity: Number(form.stockQuantity),
          forceCreate, // Флаг для принудительного создания
        }),
      });

      const data = await res.json();

      // Если найдены похожие материалы (только при создании нового)
      if (!form.id && res.status === 200 && data.warning && data.similarMaterials) {
        setSimilarMaterials(data.similarMaterials);
        setShowSimilarWarning(true);
        setSaving(false);
        return;
      }

      // Если точное совпадение
      if (res.status === 409) {
        setError(data.error || 'Материал уже существует');
        if (data.similarMaterials) {
          setSimilarMaterials(data.similarMaterials);
        }
        setSaving(false);
        return;
      }

      if (!res.ok) {
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
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {form.id ? 'Редактировать материал' : 'Добавить материал'}
            </h2>
            <p className="text-xs text-slate-400">Заполните параметры строительного материала</p>
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

          {/* Предупреждение о похожих материалах */}
          {showSimilarWarning && similarMaterials.length > 0 && (
            <div className="p-4 bg-amber-900/40 border border-amber-700 rounded-lg space-y-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-300 mb-2">
                    Найдены похожие материалы
                  </p>
                  <div className="space-y-2 mb-3">
                    {similarMaterials.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 bg-slate-800/60 rounded border border-slate-700 text-xs"
                      >
                        <p className="text-white font-medium">{m.name}</p>
                        <p className="text-slate-400">
                          {m.category} • {m.manufacturer} • {m.repairLevel} • {Number(m.price).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSimilarWarning(false);
                        setSimilarMaterials([]);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        setShowSimilarWarning(false);
                        handleSubmit(e, true);
                      }}
                      className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors font-medium"
                    >
                      Всё равно добавить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className={labelCls}>Название материала *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Например: Краска интерьерная Dulux"
              className={inputCls}
              required
            />
          </div>

          {/* Category + Manufacturer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Категория *</label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Новая</span>
                </button>
              </div>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Название категории"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-3 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex-shrink-0"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <AdminSelect
                  value={form.categoryId}
                  onChange={(v) => setForm({ ...form, categoryId: v })}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder={loadingOptions ? 'Загрузка...' : '— выберите категорию —'}
                  disabled={loadingOptions}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Производитель *</label>
                <button
                  type="button"
                  onClick={() => setShowNewManufacturer(!showNewManufacturer)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Новый</span>
                </button>
              </div>
              {showNewManufacturer ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newManufacturer.name}
                    onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
                    placeholder="Название"
                    className={inputCls}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newManufacturer.country}
                      onChange={(e) => setNewManufacturer({ ...newManufacturer, country: e.target.value })}
                      placeholder="Страна (опц.)"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={handleCreateManufacturer}
                      className="px-3 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex-shrink-0"
                    >
                      OK
                    </button>
                  </div>
                </div>
              ) : (
                <AdminSelect
                  value={form.manufacturerId}
                  onChange={(v) => setForm({ ...form, manufacturerId: v })}
                  options={manufacturers.map((m) => ({ value: m.id, label: m.name }))}
                  placeholder={loadingOptions ? 'Загрузка...' : '— выберите производителя —'}
                  disabled={loadingOptions}
                />
              )}
            </div>
          </div>

          {/* Repair level + Surface type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Уровень ремонта *</label>
              <AdminSelect
                value={form.repairLevel}
                onChange={(v) => setForm({ ...form, repairLevel: v as MaterialFormData['repairLevel'] })}
                options={repairLevels}
              />
            </div>
            <div>
              <label className={labelCls}>Тип поверхности *</label>
              <AdminSelect
                value={form.surfaceType}
                onChange={(v) => setForm({ ...form, surfaceType: v as MaterialFormData['surfaceType'] })}
                options={surfaceTypes}
              />
            </div>
          </div>

          {/* Price + Consumption + Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Цена *</label>
              <NumberInput
                step={0.01}
                min={0}
                value={form.price}
                onChange={(v) => setForm({ ...form, price: v })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Расход на м² *</label>
              <NumberInput
                step={0.001}
                min={0}
                value={form.consumptionPerM2}
                onChange={(v) => setForm({ ...form, consumptionPerM2: v })}
                placeholder="0.000"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Единица *</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="м², кг, л"
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* Package quantity + unit + stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Количество в упаковке *</label>
              <NumberInput
                step={0.01}
                min={0}
                value={form.packageQuantity}
                onChange={(v) => setForm({ ...form, packageQuantity: v })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Единица упаковки *</label>
              <input
                type="text"
                value={form.packageUnit}
                onChange={(e) => setForm({ ...form, packageUnit: e.target.value })}
                placeholder="шт, мешок"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>На складе</label>
              <NumberInput
                step={1}
                min={0}
                value={form.stockQuantity}
                onChange={(v) => setForm({ ...form, stockQuantity: v })}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className={labelCls}>Изображение материала</label>
            <div className="flex gap-3">
              {/* Preview */}
              {form.imageUrl && (
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-700/50 border border-slate-600 flex-shrink-0">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Upload button */}
              <div className="flex-1 flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 text-slate-300 hover:text-white hover:border-amber-500 rounded-lg transition-all disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Загрузка...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Загрузить изображение</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500">
                  JPG, PNG или WEBP. Максимум 5MB. Изображение будет загружено в S3.
                </p>
                {form.imageUrl && (
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className={inputCls + ' text-xs'}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Краткое описание материала..."
              className={inputCls}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-2">
            <AdminCheckbox
              checked={form.isAvailable}
              onChange={(v) => setForm({ ...form, isAvailable: v })}
              label="В наличии"
            />
            <AdminCheckbox
              checked={form.isActive}
              onChange={(v) => setForm({ ...form, isActive: v })}
              label="Активен"
            />
          </div>
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
