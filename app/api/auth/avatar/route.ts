import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToS3, deleteFromS3, isS3Url } from '@/lib/s3';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Получаем userId из любого способа авторизации:
 *  1. auth-token (наш JWT после регистрации/логина по email)
 *  2. NextAuth сессия (Google OAuth и т.п.)
 *
 * Гарантирует что возвращённый id существует в БД (или null).
 */
async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();

  // 1) Кастомный JWT
  const token = cookieStore.get('auth-token')?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) {
      const exists = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });
      if (exists) return exists.id;
    }
  }

  // 2) NextAuth — пробуем через auth() helper
  try {
    const { auth } = await import('@/auth');
    const session = await auth();

    // Пытаемся найти по id (если он валидный UUID)
    if (session?.user?.id) {
      const byId = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });
      if (byId) return byId.id;
    }

    // Фолбэк: ищем по email (если id из Google OAuth не наш UUID)
    if (session?.user?.email) {
      const byEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (byEmail) return byEmail.id;
    }
  } catch (err) {
    console.warn('NextAuth auth() failed in avatar route:', err);
  }

  return null;
}

/**
 * POST /api/auth/avatar
 * Загрузка аватара в S3 (multipart/form-data, поле "file").
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Поддерживаются только JPEG, PNG, WEBP и GIF' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Файл больше 5 МБ' },
        { status: 400 }
      );
    }

    // Загружаем в S3
    const avatarUrl = await uploadToS3(file, 'avatars');

    // Удаляем старый аватар из S3 (если был)
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    if (current?.avatar && isS3Url(current.avatar)) {
      await deleteFromS3(current.avatar).catch((err) => {
        console.warn('Не удалось удалить старый аватар:', err);
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({ user, avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    const message =
      error instanceof Error ? error.message : 'Ошибка при загрузке аватара';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/avatar
 * Удаление аватара из S3.
 */
export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Удаляем файл из S3 если он там
    if (current?.avatar && isS3Url(current.avatar)) {
      await deleteFromS3(current.avatar).catch((err) => {
        console.warn('Не удалось удалить аватар из S3:', err);
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Ошибка при удалении аватара' }, { status: 500 });
  }
}
