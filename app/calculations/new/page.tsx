'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Calculator,
  Sparkles,
  Home,
  Ruler,
  DollarSign,
  Layers,
  Tag,
  ChevronRight,
  Info,
  Minus,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useTranslation } from '@/app/i18n/useTranslation';

const ROOM_TYPE_VALUES = ['kitchen','bathroom','bedroom','living_room','office'];
const SURFACE_TYPE_VALUES = ['walls','floor','ceiling','full_room'];
const REPAIR_LEVEL_VALUES = [
  { value: 'economy',  color: 'emerald', descKey: 'new.repairLevels.economyDesc' },
  { value: 'standard', color: 'blue',    descKey: 'new.repairLevels.standardDesc' },
  { value: 'premium',  color: 'violet',  descKey: 'new.repairLevels.premiumDesc' },
];

interface FormData {
  projectName: string;
  roomType: string;
  surfaceType: string;
  length: string;
  width: string;
  height: string;
  repairLevel: string;
  budget: string;
  windowCount: string;
  windowWidth: string;
  windowHeight: string;
  doorCount: string;
  doorWidth: string;
  doorHeight: string;
}

const initialForm: FormData = {
  projectName: '',
  roomType: '',
  surfaceType: '',
  length: '',
  width: '',
  height: '',
  repairLevel: '',
  budget: '',
  windowCount: '0',
  windowWidth: '1.4',
  windowHeight: '1.2',
  doorCount: '1',
  doorWidth: '0.9',
  doorHeight: '2.1',
};

export default function NewCalculationPage() {
  const { isReady, status } = useAuthGuard();
  const router = useRouter();
  const { t } = useTranslation('calculations');
  const [form, setForm] = useState<FormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (isReady) {
      const raw = sessionStorage.getItem('calc_prefill');
      if (raw) {
        try {
          const prefill = JSON.parse(raw) as Partial<FormData>;
          setForm((prev) => ({ ...prev, ...prefill }));
        } catch { /* ignore */ }
        sessionStorage.removeItem('calc_prefill');
      }
    }
  }, [isReady]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  const area = form.length && form.width ? (parseFloat(form.length) * parseFloat(form.width)).toFixed(1) : null;
  const showHeight = form.surfaceType === 'walls' || form.surfaceType === 'full_room';
  const openingsPreview = showHeight
    ? (parseInt(form.windowCount) || 0) * (parseFloat(form.windowWidth) || 0) * (parseFloat(form.windowHeight) || 0)
      + (parseInt(form.doorCount) || 0) * (parseFloat(form.doorWidth) || 0) * (parseFloat(form.doorHeight) || 0)
    : 0;

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.projectName.trim()) newErrors.projectName = t('new.errors.projectName');
    if (!form.roomType) newErrors.roomType = t('new.errors.roomType');
    if (!form.surfaceType) newErrors.surfaceType = t('new.errors.surfaceType');
    if (!form.length || parseFloat(form.length) <= 0) newErrors.length = t('new.errors.length');
    if (!form.width || parseFloat(form.width) <= 0) newErrors.width = t('new.errors.width');
    if (showHeight && (!form.height || parseFloat(form.height) <= 0)) newErrors.height = t('new.errors.height');
    if (!form.repairLevel) newErrors.repairLevel = t('new.errors.repairLevel');
    const budgetNum = parseFloat(form.budget);
    if (form.budget === '' || isNaN(budgetNum) || budgetNum < 0) newErrors.budget = t('new.errors.budget');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ projectName: data.error || t('new.errors.calcError') });
        }
        setIsSubmitting(false);
        return;
      }
      sessionStorage.setItem('calc_result', JSON.stringify(data));
      router.push('/calculations/result');
    } catch {
      setErrors({ projectName: t('new.errors.connection') });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">{t('new.title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-700">AI расчет</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              {'U'}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('new.title')}</h1>
                <p className="text-sm text-gray-500">{t('new.subtitle')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Main Card */}
              <div className="xl:col-span-2 space-y-6">

                {/* Project Info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Tag size={16} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.projectName')}</h2>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('new.projectName')}
                    </label>
                    <input
                      type="text"
                      value={form.projectName}
                      onChange={(e) => handleChange('projectName', e.target.value)}
                      placeholder={t('new.projectNamePlaceholder')}
                      className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        errors.projectName
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                      }`}
                    />
                    {errors.projectName && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.projectName}</p>
                    )}
                  </div>
                </div>

                {/* Room Parameters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Home size={16} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.roomType')}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Room Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('new.roomType')}
                      </label>
                      <select
                        value={form.roomType}
                        onChange={(e) => handleChange('roomType', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                          errors.roomType
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                        }`}
                      >
                        <option value="">{t('new.roomType')}</option>
                        {ROOM_TYPE_VALUES.map((v) => (
                          <option key={v} value={v}>{t(`new.roomTypes.${v === 'living_room' ? 'living_room' : v}`)}</option>
                        ))}
                      </select>
                      {errors.roomType && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.roomType}</p>
                      )}
                    </div>

                    {/* Surface Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('new.surfaceType')}
                      </label>
                      <select
                        value={form.surfaceType}
                        onChange={(e) => handleChange('surfaceType', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                          errors.surfaceType
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                        }`}
                      >
                        <option value="">{t('new.surfaceType')}</option>
                        {SURFACE_TYPE_VALUES.map((v) => (
                          <option key={v} value={v}>{t(`new.surfaceTypes.${v}`)}</option>
                        ))}
                      </select>
                      {errors.surfaceType && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.surfaceType}</p>
                      )}
                      {form.surfaceType === 'full_room' && (
                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg">
                          <Sparkles size={12} className="text-violet-500 flex-shrink-0" />
                          <span className="text-xs text-violet-600">{t('new.fullRoomHint')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Ruler size={16} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.dimensions')}</h2>
                  </div>
                  <div className={`grid gap-4 ${showHeight ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {(
                      [
                        { field: 'length' as keyof FormData, labelKey: 'new.length', placeholder: '5.0' },
                        { field: 'width' as keyof FormData, labelKey: 'new.width', placeholder: '4.0' },
                      ] as { field: keyof FormData; labelKey: string; placeholder: string }[]
                    ).map(({ field, labelKey, placeholder }) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t(labelKey)}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={form[field]}
                            onChange={(e) => handleChange(field, e.target.value)}
                            placeholder={placeholder}
                            className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all admin-number-input ${
                              errors[field]
                                ? 'border-red-300 focus:ring-red-200'
                                : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                            }`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">м</span>
                        </div>
                        {errors[field] && (
                          <p className="mt-1.5 text-xs text-red-500">{errors[field]}</p>
                        )}
                      </div>
                    ))}
                    {showHeight && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('new.height')}</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={form.height}
                            onChange={(e) => handleChange('height', e.target.value)}
                            placeholder="2.7"
                            className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all admin-number-input ${
                              errors.height
                                ? 'border-red-300 focus:ring-red-200'
                                : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                            }`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">м</span>
                        </div>
                        {errors.height && <p className="mt-1.5 text-xs text-red-500">{errors.height}</p>}
                      </div>
                    )}
                  </div>

                  {area && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-xl">
                      <Info size={14} className="text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-blue-700">
                        {t('new.areaPreview')}: <strong>{area} м²</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Openings */}
                {showHeight && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Minus size={16} className="text-orange-500" />
                      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.windows')}/{t('new.doors')}</h2>
                      <span className="text-xs text-gray-400 font-normal normal-case ml-1">{t('new.openingsHint')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-5">
                      {/* Windows */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('new.windows')}</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('new.count')}</label>
                            <input type="number" min="0" value={form.windowCount} onChange={(e) => handleChange('windowCount', e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 admin-number-input" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{t('new.windowWidth')}</label>
                              <input type="number" step="0.1" min="0" value={form.windowWidth} onChange={(e) => handleChange('windowWidth', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 admin-number-input" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{t('new.windowHeight')}</label>
                              <input type="number" step="0.1" min="0" value={form.windowHeight} onChange={(e) => handleChange('windowHeight', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 admin-number-input" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Doors */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('new.doors')}</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('new.count')}</label>
                            <input type="number" min="0" value={form.doorCount} onChange={(e) => handleChange('doorCount', e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 admin-number-input" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{t('new.doorWidth')}</label>
                              <input type="number" step="0.1" min="0" value={form.doorWidth} onChange={(e) => handleChange('doorWidth', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 admin-number-input" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{t('new.doorHeight')}</label>
                              <input type="number" step="0.1" min="0" value={form.doorHeight} onChange={(e) => handleChange('doorHeight', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 admin-number-input" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {openingsPreview > 0 && (
                      <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-orange-50 rounded-xl">
                        <Info size={14} className="text-orange-500 flex-shrink-0" />
                        <span className="text-sm text-orange-700">
                          {t('new.openingsPreview', { area: openingsPreview.toFixed(1) })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Repair Level */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Layers size={16} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.repairLevel')}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {REPAIR_LEVEL_VALUES.map((level) => {
                      const isSelected = form.repairLevel === level.value;
                      const colorMap: Record<string, string> = {
                        emerald: isSelected
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50',
                        blue: isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50',
                        violet: isSelected
                          ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                          : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50',
                      };
                      const dotMap: Record<string, string> = {
                        emerald: 'bg-emerald-500',
                        blue: 'bg-blue-500',
                        violet: 'bg-violet-500',
                      };
                      const textMap: Record<string, string> = {
                        emerald: isSelected ? 'text-emerald-700' : 'text-gray-700',
                        blue: isSelected ? 'text-blue-700' : 'text-gray-700',
                        violet: isSelected ? 'text-violet-700' : 'text-gray-700',
                      };
                      return (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => handleChange('repairLevel', level.value)}
                          className={`relative p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-150 ${colorMap[level.color]}`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full mb-3 ${dotMap[level.color]}`} />
                          <p className={`text-sm font-semibold ${textMap[level.color]}`}>{t(`new.repairLevels.${level.value}`)}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t(`new.repairLevels.${level.value}Desc`)}</p>
                          {isSelected && (
                            <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${dotMap[level.color]} flex items-center justify-center`}>
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.repairLevel && (
                    <p className="mt-2 text-xs text-red-500">{errors.repairLevel}</p>
                  )}
                </div>
              </div>

              {/* Right Column — Budget + Summary */}
              <div className="space-y-6">
                {/* Budget */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <DollarSign size={16} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.budget')}</h2>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('new.budget')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={form.budget}
                        onChange={(e) => handleChange('budget', e.target.value)}
                        placeholder="150000"
                        className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all admin-number-input ${
                          errors.budget
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">сом</span>
                    </div>
                    {errors.budget && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.budget}</p>
                    )}
                    {form.budget && (
                      <p className="mt-2 text-xs text-gray-500">
                        ≈ {Number(form.budget).toLocaleString('ru-RU')} сом
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {['50 000', '100 000', '200 000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleChange('budget', preset.replace(/\s/g, ''))}
                        className="px-2 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg transition-all"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100 mb-4">{t('new.summary')}</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.roomType')}</span>
                      <span className="font-medium">
                        {form.roomType ? t(`new.roomTypes.${form.roomType}`) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.surfaceType')}</span>
                      <span className="font-medium">
                        {form.surfaceType ? t(`new.surfaceTypes.${form.surfaceType}`) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.areaPreview')}</span>
                      <span className="font-medium">{area ? `${area} м²` : '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.repairLevel')}</span>
                      <span className="font-medium">
                        {form.repairLevel ? t(`new.repairLevels.${form.repairLevel}`) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.budget')}</span>
                      <span className="font-medium">
                        {form.budget ? `${Number(form.budget).toLocaleString('ru-RU')} сом` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/20">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-white text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          {t('new.calculating')}
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          {t('new.submit')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
