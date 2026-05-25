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
  DoorOpen,
  Check,
  Plus,
  X,
  Pencil,
  Trash2,
  Sofa,
  BedDouble,
  ChefHat,
  Bath,
  Briefcase,
  PanelBottom,
  PanelTop,
  AppWindow,
  Droplets,
  Lightbulb,
  Zap,
  Gamepad2,
  Dumbbell,
  Music,
  Palette,
  Star,
  Camera,
  Coffee,
  Package,
  Shirt,
  BookOpen,
  Warehouse,
  Bike,
  Flower2,
  Tv,
  LucideProps,
} from 'lucide-react';
import type { FC } from 'react';
import Sidebar from '../../components/Sidebar';
import { useTranslation } from '@/app/i18n/useTranslation';

type RoomIconFC = FC<LucideProps>;

const ROOM_TYPE_VALUES: { value: string; Icon: RoomIconFC }[] = [
  { value: 'living_room', Icon: Sofa       },
  { value: 'bedroom',     Icon: BedDouble  },
  { value: 'kitchen',     Icon: ChefHat    },
  { value: 'bathroom',    Icon: Bath       },
  { value: 'hallway',     Icon: DoorOpen   },
  { value: 'office',      Icon: Briefcase  },
];

const SECTION_ICON_MAP: Record<string, RoomIconFC> = {
  walls:       Layers,
  floor:       PanelBottom,
  ceiling:     PanelTop,
  lighting:    Lightbulb,
  electrical:  Zap,
  doors:       DoorOpen,
  windows:     AppWindow,
  plumbing:    Droplets,
};

const CUSTOM_ROOM_ICON_OPTIONS: { name: string; Icon: RoomIconFC }[] = [
  { name: 'Home',      Icon: Home      },
  { name: 'Wrench',    Icon: Tag       },
  { name: 'Gamepad2',  Icon: Gamepad2  },
  { name: 'Dumbbell',  Icon: Dumbbell  },
  { name: 'Music',     Icon: Music     },
  { name: 'Palette',   Icon: Palette   },
  { name: 'Star',      Icon: Star      },
  { name: 'Camera',    Icon: Camera    },
  { name: 'Coffee',    Icon: Coffee    },
  { name: 'Package',   Icon: Package   },
  { name: 'Shirt',     Icon: Shirt     },
  { name: 'BookOpen',  Icon: BookOpen  },
  { name: 'Warehouse', Icon: Warehouse },
  { name: 'Bike',      Icon: Bike      },
  { name: 'Flower2',   Icon: Flower2   },
  { name: 'Tv',        Icon: Tv        },
];

function getCustomIcon(name: string | null | undefined): RoomIconFC {
  return CUSTOM_ROOM_ICON_OPTIONS.find((o) => o.name === name)?.Icon ?? Home;
}

interface CustomRoom {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  createdAt: string;
}

interface CustomRoomForm {
  name: string;
  icon: string;
  description: string;
}

const REPAIR_LEVEL_VALUES = [
  { value: 'economy',  color: 'emerald' },
  { value: 'standard', color: 'blue'    },
  { value: 'premium',  color: 'violet'  },
];

const ALL_SECTIONS = ['walls','floor','ceiling','lighting','electrical','doors','windows','plumbing'] as const;
type SectionKey = typeof ALL_SECTIONS[number];

interface FormData {
  projectName: string;
  roomType: string;
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

const initialSections: Record<SectionKey, boolean> = {
  walls: true, floor: true, ceiling: true,
  lighting: false, electrical: false, doors: false,
  windows: false, plumbing: false,
};

function deriveSurfaceType(s: Record<SectionKey, boolean>): string {
  if (s.walls && s.floor && s.ceiling) return 'full_room';
  if (s.walls) return 'walls';
  if (s.floor)  return 'floor';
  if (s.ceiling) return 'ceiling';
  return 'walls';
}

const emptyCustomForm: CustomRoomForm = { name: '', icon: '', description: '' };

export default function NewCalculationPage() {
  const { isReady, status } = useAuthGuard();
  const router = useRouter();
  const { t } = useTranslation('calculations');
  const [form, setForm] = useState<FormData>(initialForm);
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(initialSections);
  const [wallFinishing, setWallFinishing] = useState('');
  const [floorCovering, setFloorCovering] = useState('');
  const [ceilingType, setCeilingType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState<CustomRoomForm>(emptyCustomForm);
  const [customFormSaving, setCustomFormSaving] = useState(false);
  const [customFormError, setCustomFormError] = useState('');
  const [editingRoom, setEditingRoom] = useState<CustomRoom | null>(null);

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
      fetch('/api/custom-rooms')
        .then((r) => r.ok ? r.json() : [])
        .then((data: CustomRoom[]) => setCustomRooms(data))
        .catch(() => {});
    }
  }, [isReady]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setCustomForm(emptyCustomForm);
    setCustomFormError('');
    setShowCustomModal(true);
  };

  const openEditModal = (room: CustomRoom) => {
    setEditingRoom(room);
    setCustomForm({ name: room.name, icon: room.icon ?? '', description: room.description ?? '' });
    setCustomFormError('');
    setShowCustomModal(true);
  };

  const saveCustomRoom = async () => {
    if (!customForm.name.trim()) { setCustomFormError(t('new.customRoom.nameRequired')); return; }
    setCustomFormSaving(true);
    setCustomFormError('');
    try {
      const url = editingRoom ? `/api/custom-rooms/${editingRoom.id}` : '/api/custom-rooms';
      const method = editingRoom ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customForm),
      });
      if (!res.ok) { setCustomFormError(t('new.customRoom.saveError')); return; }
      const saved: CustomRoom = await res.json();
      if (editingRoom) {
        setCustomRooms((prev) => prev.map((r) => r.id === saved.id ? saved : r));
        if (form.roomType === `custom:${editingRoom.id}`) {
          handleChange('roomType', `custom:${saved.id}`);
        }
      } else {
        setCustomRooms((prev) => [...prev, saved]);
        handleChange('roomType', `custom:${saved.id}`);
      }
      setShowCustomModal(false);
    } catch { setCustomFormError(t('new.customRoom.saveError')); }
    finally { setCustomFormSaving(false); }
  };

  const deleteCustomRoom = async (room: CustomRoom) => {
    await fetch(`/api/custom-rooms/${room.id}`, { method: 'DELETE' });
    setCustomRooms((prev) => prev.filter((r) => r.id !== room.id));
    if (form.roomType === `custom:${room.id}`) handleChange('roomType', '');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const area = form.length && form.width ? (parseFloat(form.length) * parseFloat(form.width)).toFixed(1) : null;
  const showHeight = sections.walls || sections.ceiling;
  const openingsPreview = showHeight
    ? (parseInt(form.windowCount) || 0) * (parseFloat(form.windowWidth) || 0) * (parseFloat(form.windowHeight) || 0)
      + (parseInt(form.doorCount) || 0) * (parseFloat(form.doorWidth) || 0) * (parseFloat(form.doorHeight) || 0)
    : 0;
  const activeSectionCount = ALL_SECTIONS.filter((s) => sections[s]).length;

  const toggleSection = (key: SectionKey) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    setErrors((prev) => ({ ...prev, sections: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.projectName.trim()) newErrors.projectName = t('new.errors.projectName');
    if (!form.roomType) newErrors.roomType = t('new.errors.roomType');
    if (activeSectionCount === 0) newErrors.sections = t('new.errors.sections');
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
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const surfaceType = deriveSurfaceType(sections);
    try {
      const res = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          surfaceType,
          sections,
          wallFinishing,
          floorCovering,
          ceilingType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ projectName: data.error || t('new.errors.calcError') });
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

                {/* Room Type — карточки */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Home size={16} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.roomType')}</h2>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {/* Стандартные комнаты */}
                    {ROOM_TYPE_VALUES.map(({ value, Icon }) => {
                      const active = form.roomType === value;
                      return (
                        <button key={value} type="button"
                          onClick={() => handleChange('roomType', value)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                            active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-blue-500' : 'bg-gray-100'}`}>
                            <Icon size={18} className={active ? 'text-white' : 'text-gray-500'} />
                          </div>
                          <span className={`text-xs font-medium text-center leading-tight ${active ? 'text-blue-700' : 'text-gray-600'}`}>
                            {t(`new.roomTypes.${value}`)}
                          </span>
                        </button>
                      );
                    })}

                    {/* Пользовательские комнаты */}
                    {customRooms.map((room) => {
                      const roomKey = `custom:${room.id}`;
                      const active = form.roomType === roomKey;
                      const CIcon = getCustomIcon(room.icon);
                      return (
                        <div key={room.id} className="relative group">
                          <button type="button"
                            onClick={() => handleChange('roomType', roomKey)}
                            className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                              active ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/40'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-violet-500' : 'bg-gray-100'}`}>
                              <CIcon size={18} className={active ? 'text-white' : 'text-gray-500'} />
                            </div>
                            <span className={`text-xs font-medium text-center leading-tight truncate w-full ${active ? 'text-violet-700' : 'text-gray-600'}`}>
                              {room.name}
                            </span>
                          </button>
                          <div className="absolute -top-1.5 -right-1.5 hidden group-hover:flex gap-0.5">
                            <button type="button" onClick={() => openEditModal(room)}
                              className="w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow">
                              <Pencil size={9} className="text-white" />
                            </button>
                            <button type="button" onClick={() => deleteCustomRoom(room)}
                              className="w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow">
                              <Trash2 size={9} className="text-white" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Кнопка "+" — создать своё помещение */}
                    <button type="button" onClick={openCreateModal}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-all duration-150">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Plus size={16} className="text-gray-500" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 text-center leading-tight">{t('new.customRoom.add')}</span>
                    </button>
                  </div>
                  {errors.roomType && <p className="mt-2 text-xs text-red-500">{errors.roomType}</p>}
                </div>

                {/* Модальное окно создания/редактирования помещения */}
                {showCustomModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold text-gray-900">
                          {editingRoom ? t('new.customRoom.editTitle') : t('new.customRoom.createTitle')}
                        </h3>
                        <button type="button" onClick={() => setShowCustomModal(false)}
                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                          <X size={16} className="text-gray-500" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Название */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('new.customRoom.name')} *</label>
                          <input type="text"
                            value={customForm.name}
                            onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder={t('new.customRoom.namePlaceholder')}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                          />
                        </div>

                        {/* Иконка */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('new.customRoom.icon')}</label>
                          <div className="grid grid-cols-8 gap-1.5">
                            {CUSTOM_ROOM_ICON_OPTIONS.map(({ name, Icon: PickIcon }) => {
                              const selected = customForm.icon === name;
                              return (
                                <button key={name} type="button"
                                  onClick={() => setCustomForm((p) => ({ ...p, icon: p.icon === name ? '' : name }))}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${
                                    selected ? 'border-violet-500 bg-violet-100' : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50'
                                  }`}>
                                  <PickIcon size={16} className={selected ? 'text-violet-600' : 'text-gray-500'} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Описание */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('new.customRoom.description')}</label>
                          <input type="text"
                            value={customForm.description}
                            onChange={(e) => setCustomForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder={t('new.customRoom.descriptionPlaceholder')}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                          />
                        </div>

                        {customFormError && <p className="text-sm text-red-500">{customFormError}</p>}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setShowCustomModal(false)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                          {t('new.customRoom.cancel')}
                        </button>
                        <button type="button" onClick={saveCustomRoom} disabled={customFormSaving}
                          className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                          {customFormSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          {editingRoom ? t('new.customRoom.save') : t('new.customRoom.create')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Секции ремонта */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-blue-600" />
                      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.sections.title')}</h2>
                    </div>
                    {activeSectionCount > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{activeSectionCount} {t('new.sectionsSelected')}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ALL_SECTIONS.map((key) => {
                      const active = sections[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSection(key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-left ${
                            active
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                          }`}
                        >
                          {(() => { const SIcon = SECTION_ICON_MAP[key]; return <SIcon size={14} className={active ? 'text-blue-600 flex-shrink-0' : 'text-gray-400 flex-shrink-0'} />; })()}
                          <span className={`text-xs font-medium ${active ? 'text-blue-700' : 'text-gray-600'}`}>
                            {t(`new.sections.${key}`)}
                          </span>
                          {active && (
                            <div className="ml-auto w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check size={9} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.sections && <p className="mt-2 text-xs text-red-500">{errors.sections}</p>}

                  {/* Стены — тип отделки */}
                  {sections.walls && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🧱 {t('new.wallFinishing')}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['painting','wallpaper','plaster','panels'].map((v) => (
                          <button key={v} type="button" onClick={() => setWallFinishing(wallFinishing === v ? '' : v)}
                            className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                              wallFinishing === v
                                ? 'border-orange-400 bg-orange-50 text-orange-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-300'
                            }`}>
                            {t(`new.wallFinishings.${v}`)}
                          </button>
                        ))}
                      </div>
                      {wallFinishing && (
                        <div className="mt-2 px-3 py-2 bg-orange-50 rounded-lg">
                          <p className="text-xs text-orange-700">✓ {t(`new.wallFinishingHint.${wallFinishing}`)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Пол — тип покрытия */}
                  {sections.floor && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🪵 {t('new.floorCovering')}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['laminate','linoleum','parquet','tile'].map((v) => (
                          <button key={v} type="button" onClick={() => setFloorCovering(floorCovering === v ? '' : v)}
                            className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                              floorCovering === v
                                ? 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-amber-300'
                            }`}>
                            {t(`new.floorCoverings.${v}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Потолок — тип */}
                  {sections.ceiling && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">✨ {t('new.ceilingType')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['painting','stretch','drywall'].map((v) => (
                          <button key={v} type="button" onClick={() => setCeilingType(ceilingType === v ? '' : v)}
                            className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                              ceilingType === v
                                ? 'border-violet-500 bg-violet-50 text-violet-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-300'
                            }`}>
                            {t(`new.ceilingTypes.${v}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                      <DoorOpen size={16} className="text-orange-500" />
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

              {/* Right Column */}
              <div className="space-y-6">
                {/* Budget */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <DollarSign size={16} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('new.budget')}</h2>
                  </div>
                  <div className="relative">
                    <input
                      type="number" min="0"
                      value={form.budget}
                      onChange={(e) => handleChange('budget', e.target.value)}
                      placeholder="150000"
                      className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all admin-number-input ${
                        errors.budget ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">сом</span>
                  </div>
                  {errors.budget && <p className="mt-1.5 text-xs text-red-500">{errors.budget}</p>}
                  {form.budget && <p className="mt-2 text-xs text-gray-500">≈ {Number(form.budget).toLocaleString('ru-RU')} сом</p>}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {['50 000','100 000','200 000'].map((preset) => (
                      <button key={preset} type="button"
                        onClick={() => handleChange('budget', preset.replace(/\s/g,''))}
                        className="px-2 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg transition-all">
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100 mb-4">{t('new.summary')}</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.roomType')}</span>
                      <span className="font-medium">
                        {form.roomType
                          ? form.roomType.startsWith('custom:')
                            ? customRooms.find((r) => `custom:${r.id}` === form.roomType)?.name ?? '—'
                            : t(`new.roomTypes.${form.roomType}`)
                          : '—'}
                      </span>
                    </div>

                    {/* Активные секции */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-200">{t('new.sections.title')}</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end max-w-[60%]">
                        {activeSectionCount > 0
                          ? ALL_SECTIONS.filter((s) => sections[s]).map((s) => {
                              const SI = SECTION_ICON_MAP[s];
                              return <SI key={s} size={13} className="text-white/80" />;
                            })
                          : <span className="font-medium">—</span>}
                      </div>
                    </div>

                    {/* Тип поверхности (вычисленный) */}
                    {activeSectionCount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">{t('new.surfaceType')}</span>
                        <span className="font-medium">{t(`new.surfaceTypes.${deriveSurfaceType(sections)}`)}</span>
                      </div>
                    )}

                    {wallFinishing && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">{t('new.wallFinishing')}</span>
                        <span className="font-medium">{t(`new.wallFinishings.${wallFinishing}`)}</span>
                      </div>
                    )}
                    {floorCovering && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">{t('new.floorCovering')}</span>
                        <span className="font-medium">{t(`new.floorCoverings.${floorCovering}`)}</span>
                      </div>
                    )}
                    {ceilingType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">{t('new.ceilingType')}</span>
                        <span className="font-medium">{t(`new.ceilingTypes.${ceilingType}`)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.areaPreview')}</span>
                      <span className="font-medium">{area ? `${area} м²` : '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.repairLevel')}</span>
                      <span className="font-medium">{form.repairLevel ? t(`new.repairLevels.${form.repairLevel}`) : '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">{t('new.budget')}</span>
                      <span className="font-medium">{form.budget ? `${Number(form.budget).toLocaleString('ru-RU')} сом` : '—'}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/20">
                    <button type="submit" disabled={isSubmitting}
                      className="w-full py-3.5 bg-white text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSubmitting ? (
                        <><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />{t('new.calculating')}</>
                      ) : (
                        <><Sparkles size={16} />{t('new.submit')}</>
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
