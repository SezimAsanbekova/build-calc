import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    // Проверяем — нет ли уже подтверждённого пользователя с таким email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Сохраняем во временную таблицу (не в users!)
    await prisma.pendingRegistration.upsert({
      where: { email },
      update: { passwordHash, name: name || null, code, expiresAt },
      create: { email, passwordHash, name: name || null, code, expiresAt },
    });

    // Отправляем код на email
    let devCode: string | undefined;
    try {
      await sendVerificationEmail(email, code, name || undefined);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      if (process.env.NODE_ENV === 'development') {
        devCode = code;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Код подтверждения отправлен на email',
        email,
        ...(devCode && { devCode }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    );
  }
}
