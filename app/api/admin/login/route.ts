import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

/**
 * POST /api/admin/login
 * Шаг 1: проверяем email + пароль администратора,
 * отправляем 6-значный код через Telegram-бот.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Ищем пользователя с ролью admin
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Получаем настройки Telegram из таблицы Setting
    const [botTokenSetting, telegramIdSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'ADMIN_TELEGRAM_BOT_TOKEN' } }),
      prisma.setting.findUnique({ where: { key: 'ADMIN_TELEGRAM_USER_ID' } }),
    ]);

    if (!botTokenSetting?.value || !telegramIdSetting?.value) {
      return NextResponse.json(
        { error: 'Telegram не настроен. Обратитесь к разработчику.' },
        { status: 500 }
      );
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые неиспользованные коды этого пользователя
    await prisma.adminTelegramCode.deleteMany({
      where: { userId: user.id, used: false },
    });

    // Сохраняем новый код
    await prisma.adminTelegramCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    // Отправляем код через Telegram Bot API с таймаутом 5 секунд
    const telegramUrl = `https://api.telegram.org/bot${botTokenSetting.value}/sendMessage`;
    const message =
      `🔐 *Код входа в BuildCalc AI Admin*\n\n` +
      `Ваш код: *${code}*\n\n` +
      `Действителен 10 минут. Никому не сообщайте этот код.`;

    const controller = new AbortController();
    const tgTimeout = setTimeout(() => controller.abort(), 5000);

    try {
      const tgResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramIdSetting.value,
          text: message,
          parse_mode: 'Markdown',
        }),
        signal: controller.signal,
      });

      if (!tgResponse.ok) {
        const tgError = await tgResponse.json();
        console.error('Telegram API error:', tgError);
        return NextResponse.json(
          { error: 'Ошибка отправки кода через Telegram. Проверьте настройки бота.' },
          { status: 500 }
        );
      }
    } catch (tgErr) {
      console.error('Telegram недоступен:', tgErr);
      if (process.env.NODE_ENV === 'development') {
        console.warn(`\n⚠️  [DEV] Telegram недоступен. Код для ${user.email}: ${code}\n`);
      } else {
        return NextResponse.json(
          { error: 'Не удалось отправить код. Telegram недоступен.' },
          { status: 503 }
        );
      }
    } finally {
      clearTimeout(tgTimeout);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Код отправлен в Telegram',
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    );
  }
}
