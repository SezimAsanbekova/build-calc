import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) return payload.userId;
  }
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const [materialCount, calculationCount, estimateCount] = await Promise.all([
      prisma.material.count({ where: { isActive: true, isAvailable: true, deletedAt: null } }),
      prisma.calculation.count({ where: { userId } }),
      prisma.estimate.count({ where: { userId } }),
    ]);

    return NextResponse.json({ materialCount, calculationCount, estimateCount });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
