import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json(
        { error: 'Регистрация не найдена. Зарегистрируйтесь снова.' },
        { status: 404 }
      );
    }

    // Генерируем новый код
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.pendingRegistration.update({
      where: { email },
      data: { code, expiresAt },
    });

    let devCode: string | undefined;
    try {
      await sendVerificationEmail(email, code, pending.name || undefined);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      if (process.env.NODE_ENV === 'development') {
        devCode = code;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Код отправлен повторно',
      ...(devCode && { devCode }),
    });
  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json({ error: 'Ошибка при отправке кода' }, { status: 500 });
  }
}
