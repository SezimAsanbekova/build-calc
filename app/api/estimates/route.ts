import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
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
    if (!userId) return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });

    const estimates = await prisma.estimate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        calculation: {
          select: {
            id: true,
            projectName: true,
            roomType: true,
            surfaceType: true,
            repairLevel: true,
            area: true,
          },
        },
        items: { select: { id: true } },
      },
    });

    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('Estimates GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const body = await request.json();
    const { calculationId, totalPrice, items } = body as {
      calculationId: string;
      totalPrice: number;
      items: { materialId: string; quantity: number; packageCount: number; price: number; total: number }[];
    };

    if (!calculationId || !items?.length) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    const calc = await prisma.calculation.findUnique({ where: { id: calculationId } });
    if (!calc) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
    }

    const estimate = await prisma.estimate.create({
      data: {
        userId: session.user.id,
        calculationId,
        status: 'draft',
        totalPrice,
        items: {
          create: items.map((i) => ({
            materialId: i.materialId,
            quantity: i.quantity,
            packageCount: i.packageCount,
            price: i.price,
            total: i.total,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, estimateId: estimate.id }, { status: 201 });
  } catch (error) {
    console.error('Estimate save error:', error);
    return NextResponse.json({ error: 'Ошибка сохранения сметы' }, { status: 500 });
  }
}
