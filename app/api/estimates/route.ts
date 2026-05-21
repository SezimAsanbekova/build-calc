import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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
