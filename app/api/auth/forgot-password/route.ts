import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationCode, sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Всегда возвращаем успех (безопасность - не раскрываем существование email)
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'Если email существует, код восстановления будет отправлен',
        },
        { status: 200 }
      );
    }

    // Генерация кода восстановления
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Удаление старых неиспользованных кодов восстановления
    await prisma.verificationCode.deleteMany({
      where: {
        userId: user.id,
        type: 'password_reset',
        used: false,
      },
    });

    // Сохранение нового кода
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        type: 'password_reset',
        expiresAt,
      },
    });

    // Отправка email с кодом
    try {
      await sendPasswordResetEmail(user.email, code, user.name || undefined);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Ошибка при отправке email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Код восстановления отправлен на email',
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Ошибка при восстановлении пароля' },
      { status: 500 }
    );
  }
}
