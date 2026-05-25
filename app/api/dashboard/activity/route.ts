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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const calculations = await prisma.calculation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        projectName: true,
        roomType: true,
        surfaceType: true,
        repairLevel: true,
        budget: true,
        area: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ calculations });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
