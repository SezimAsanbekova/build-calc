import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Не указан код или email' },
        { status: 400 }
      );
    }

    // Ищем pending регистрацию
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json(
        { error: 'Регистрация не найдена. Зарегистрируйтесь снова.' },
        { status: 404 }
      );
    }

    // Проверяем код
    if (pending.code !== code) {
      return NextResponse.json(
        { error: 'Неверный код' },
        { status: 400 }
      );
    }

    // Проверяем срок действия
    if (pending.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Код истёк. Запросите новый.' },
        { status: 400 }
      );
    }

    // Проверяем — вдруг пользователь уже создан (двойной запрос)
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Создаём пользователя только сейчас — после подтверждения email
      user = await prisma.user.create({
        data: {
          email: pending.email,
          passwordHash: pending.passwordHash,
          name: pending.name,
          role: 'user',
          emailVerified: true,
        },
      });
    }

    // Удаляем pending запись
    await prisma.pendingRegistration.delete({ where: { email } });

    // Создаём JWT токен
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Email подтверждён. Добро пожаловать!',
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
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Ошибка при подтверждении email' },
      { status: 500 }
    );
  }
}
