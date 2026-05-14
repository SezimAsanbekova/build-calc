import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET() {
  try {
    const admin = await getAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { key, value } = await request.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key и value обязательны' }, { status: 400 });
    }

    const setting = await prisma.setting.update({
      where: { key },
      data: { value },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Admin settings PATCH error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
