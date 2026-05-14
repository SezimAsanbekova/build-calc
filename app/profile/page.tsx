'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  Camera,
  Save,
  X
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    // Пробуем получить данные пользователя через auth-token (после email верификации)
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
        // игнорируем
      }

      // Если auth-token не сработал — проверяем NextAuth сессию
      if (status === 'unauthenticated') {
        router.push('/login');
      }
      setLoadingUser(false);
    };

    if (status !== 'loading') {
      fetchUser();
    }
  }, [status, router]);

  // Синхронизируем данные из NextAuth сессии если auth-token не дал результата
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

  const isLoading = status === 'loading' || loadingUser;
  const user = userData || (session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatar: session.user.image,
    role: session.user.role,
  } : null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
              <p className="text-gray-600 mt-1">Управление личными данными</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← На главную
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Avatar Section */}
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-6">
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200">
                  <Camera className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Редактировать</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Сохранить</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: user.name || '', email: user.email });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Отмена</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
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
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.name || 'Не указано'}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Роль</label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </span>
                </div>
              </div>

              {/* Registration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата регистрации</label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{formatDate(userData?.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600 mb-2">0</p>
              <p className="text-sm text-gray-600">Расчетов</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600 mb-2">0</p>
              <p className="text-sm text-gray-600">Сохраненных смет</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600 mb-2">0</p>
              <p className="text-sm text-gray-600">Сравнений</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
