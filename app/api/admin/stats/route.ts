import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const [users, materials, calculations, estimates] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.material.count(),
      prisma.calculation.count(),
      prisma.estimate.count(),
    ]);

    return NextResponse.json({ users, materials, calculations, estimates });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
