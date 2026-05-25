'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  Camera,
  Save,
  X,
  Trash2,
  Loader,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { useLang } from '@/app/i18n/LanguageContext';

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const { lang, switchLang } = useLang();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [stats, setStats] = useState<{ calculationCount: number; estimateCount: number } | null>(null);

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user);
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
          });
          setLoadingUser(false);
          return;
        }
      } catch {
        // ignore
      }

      if (status === 'unauthenticated') {
        router.push('/login');
      }
      setLoadingUser(false);
    };

    if (status !== 'loading') {
      fetchUser();
    }
  }, [status, router]);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.user && !userData) {
      setUserData({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.image,
        role: session.user.role,
      });
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [session, userData]);

  // Закрытие меню аватара по клику вне
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handler = () => setAvatarMenuOpen(false);
    const timeoutId = setTimeout(
      () => document.addEventListener('click', handler),
      0
    );
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handler);
    };
  }, [avatarMenuOpen]);

  const isLoading = status === 'loading' || loadingUser;
  const user =
    userData ||
    (session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar: session.user.image,
          role: session.user.role,
        }
      : null);

  const handleAvatarFile = async (file: File) => {
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/auth/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || t('avatar.uploadError'));
        return;
      }
      setUserData((prev) => (prev ? { ...prev, avatar: data.avatarUrl } : data.user));
      await update({ image: data.avatarUrl });
    } catch {
      setAvatarError(t('genericError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/auth/avatar', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || t('avatar.deleteError'));
        return;
      }
      setUserData((prev) => (prev ? { ...prev, avatar: null } : data.user));
      await update({ image: null });
    } catch {
      setAvatarError(t('genericError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tc('buttons.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSave = async () => {
    setIsEditing(false);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Сегодня';
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Первая буква имени для дефолтного аватара
  const initial = (user.name || user.email)[0].toUpperCase();
  const hasAvatar = !!user.avatar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-1">{t('subtitle')}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {tc('buttons.home')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />

          {/* Avatar Section */}
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-6">
              <div className="relative">
                {/* Avatar */}
                {hasAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar!}
                    alt={user.name || 'User'}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">{initial}</span>
                  </div>
                )}

                {/* Loading overlay */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                {/* Avatar action button */}
                <div className="absolute bottom-0 right-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvatarMenuOpen((o) => !o);
                    }}
                    disabled={uploadingAvatar}
                    className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Изменить аватар"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>

                  {/* Menu */}
                  {avatarMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-12 left-0 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30"
                    >
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setAvatarMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{hasAvatar ? t('avatar.uploadNew') : t('avatar.upload')}</span>
                      </button>
                      {hasAvatar && (
                        <button
                          onClick={() => {
                            handleAvatarDelete();
                            setAvatarMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t('avatar.delete')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarFile(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>{tc('buttons.edit')}</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{tc('buttons.save')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: user.name || '', email: user.email });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>{tc('buttons.cancel')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Avatar error */}
            {avatarError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{avatarError}</p>
              </div>
            )}

            {/* Profile Info */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('name')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Введите ваше имя"
                  />
                ) : (
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-900">{user.name || t('notSpecified')}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('language')}</label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <select
                    value={lang}
                    onChange={(e) => switchLang(e.target.value as 'ru' | 'kg')}
                    className="flex-1 bg-transparent text-gray-900 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="kg">🇰🇬 Кыргызча</option>
                  </select>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('role')}</label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-900">
                    {user.role === 'admin' ? t('roleAdmin') : t('roleUser')}
                  </span>
                </div>
              </div>

              {/* Registration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('registeredAt')}</label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-900">{formatDate(userData?.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('stats.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {stats ? stats.calculationCount.toLocaleString('ru-RU') : '—'}
              </p>
              <p className="text-sm text-gray-600">{t('stats.calculations')}</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {stats ? stats.estimateCount.toLocaleString('ru-RU') : '—'}
              </p>
              <p className="text-sm text-gray-600">{t('stats.savedEstimates')}</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600 mb-2">
                {stats ? (stats.calculationCount > 0 ? stats.calculationCount - 1 : 0).toLocaleString('ru-RU') : '—'}
              </p>
              <p className="text-sm text-gray-600">{t('stats.comparisons')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
