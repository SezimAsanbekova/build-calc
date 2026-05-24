import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();

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

  try {
    const { auth } = await import('@/auth');
    const session = await auth();

    if (session?.user?.id) {
      const byId = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });
      if (byId) return byId.id;
    }

    if (session?.user?.email) {
      const byEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (byEmail) return byEmail.id;
    }
  } catch (err) {
    console.warn('NextAuth auth() failed in me route:', err);
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных пользователя' },
      { status: 500 }
    );
  }
}
