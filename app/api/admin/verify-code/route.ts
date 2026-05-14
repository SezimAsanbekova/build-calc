import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';

/**
 * POST /api/admin/verify-code
 * Шаг 2: проверяем Telegram-код и выдаём auth-token с ролью admin.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    // Ищем актуальный код
    const telegramCode = await prisma.adminTelegramCode.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!telegramCode) {
      return NextResponse.json(
        { error: 'Неверный или истёкший код' },
        { status: 400 }
      );
    }

    // Помечаем код как использованный
    await prisma.adminTelegramCode.update({
      where: { id: telegramCode.id },
      data: { used: true },
    });

    // Создаём JWT токен с ролью admin
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Добро пожаловать в панель администратора',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin verify-code error:', error);
    return NextResponse.json(
      { error: 'Ошибка при проверке кода' },
      { status: 500 }
    );
  }
}
