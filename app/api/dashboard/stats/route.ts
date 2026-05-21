import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const [materialCount, calculationCount, estimateCount] = await Promise.all([
      prisma.material.count({ where: { isActive: true, isAvailable: true, deletedAt: null } }),
      prisma.calculation.count({ where: { userId: session.user.id } }),
      prisma.estimate.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ materialCount, calculationCount, estimateCount });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
