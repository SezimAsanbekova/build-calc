import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Поиск кода восстановления
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
        type: 'password_reset',
        used: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Неверный или истекший код' },
        { status: 400 }
      );
    }

    // Хеширование нового пароля
    const passwordHash = await hashPassword(newPassword);

    // Обновление пароля
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Пометка кода как использованного
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Пароль успешно изменен',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Ошибка при сбросе пароля' },
      { status: 500 }
    );
  }
}
