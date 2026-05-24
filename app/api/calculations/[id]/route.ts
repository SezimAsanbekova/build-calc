import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const SURF_LABEL: Record<string, string> = { wall: 'Стены', floor: 'Пол', ceiling: 'Потолок' };
const SURF_REV: Record<string, string> = { wall: 'walls', floor: 'floor', ceiling: 'ceiling' };
const LEVEL_REV: Record<string, string> = { econom: 'economy', standard: 'standard', premium: 'premium' };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { id } = await params;

    const calc = await prisma.calculation.findFirst({
      where: { id, userId: session.user.id },
      include: {
        variants: {
          include: {
            items: {
              include: {
                material: {
                  include: {
                    category: { select: { name: true } },
                    manufacturer: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!calc) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
    }

    const isFullRoom = calc.variants.length > 1;
    const firstName = calc.variants[0]?.title ?? '';
    const dbProjectName = (calc as unknown as { projectName?: string | null }).projectName;
    const projectName = (dbProjectName
      ?? (isFullRoom ? firstName.split(' — ').slice(0, -1).join(' — ') : firstName))
      || `Расчёт от ${new Date(calc.createdAt).toLocaleDateString('ru-RU')}`;

    const surfaceGroups = calc.variants.map((v) => {
      let surface = calc.surfaceType;
      if (isFullRoom) {
        const parts = v.title.split(' — ');
        const surfLabel = parts[parts.length - 1];
        const found = Object.entries(SURF_LABEL).find(([, l]) => l === surfLabel);
        if (found) surface = found[0] as typeof calc.surfaceType;
      }
      const surfaceArea = surface === 'wall'
        ? calc.perimeter * (calc.height ?? 2.7)
        : calc.area;
      const subtotal = parseFloat(v.totalPrice.toString());

      return {
        surface,
        label: SURF_LABEL[surface] ?? surface,
        surfaceArea,
        subtotal,
        items: v.items.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          packageCount: item.packageCount,
          unitPrice: parseFloat(item.unitPrice.toString()),
          totalPrice: parseFloat(item.totalPrice.toString()),
          material: {
            id: item.material.id,
            name: item.material.name,
            unit: item.material.unit,
            packageUnit: item.material.packageUnit,
            packageQuantity: parseFloat(item.material.packageQuantity.toString()),
            category: item.material.category,
            manufacturer: item.material.manufacturer,
          },
        })),
      };
    });

    const totalPrice = surfaceGroups.reduce((s, g) => s + g.subtotal, 0);
    const budgetVal = calc.budget ? parseFloat(calc.budget.toString()) : 0;
    const fitsBudget = totalPrice <= budgetVal;

    const budgetAnalysis = {
      total: Math.round(totalPrice),
      budget: Math.round(budgetVal),
      usedPercent: budgetVal > 0 ? Math.round((totalPrice / budgetVal) * 100) : 0,
      remaining: Math.round(budgetVal - totalPrice),
      bySurface: surfaceGroups.map((g) => ({
        label: g.label,
        subtotal: Math.round(g.subtotal),
        percent: totalPrice > 0 ? Math.round((g.subtotal / totalPrice) * 100) : 0,
      })),
      mostExpensive: (() => {
        const all = surfaceGroups.flatMap((g) => g.items);
        if (!all.length) return null;
        const max = all.reduce((m, i) => i.totalPrice > m.totalPrice ? i : m);
        return { name: max.material.name, category: max.material.category.name, totalPrice: Math.round(max.totalPrice) };
      })(),
    };

    return NextResponse.json({
      calculationId: calc.id,
      projectName,
      roomType: calc.roomType,
      surfaceType: isFullRoom ? 'full_room' : SURF_REV[calc.surfaceType] ?? calc.surfaceType,
      repairLevel: LEVEL_REV[calc.repairLevel] ?? calc.repairLevel,
      length: calc.length,
      width: calc.width,
      height: calc.height,
      area: calc.area,
      budget: budgetVal,
      totalPrice,
      fitsBudget,
      isFullRoom,
      surfaceGroups,
      warnings: [],
      recommendations: [],
      budgetAnalysis,
      budgetOptimizations: [],
    });
  } catch (error) {
    console.error('Calculation GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { id } = await params;

    const calc = await prisma.calculation.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!calc) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
    }

    await prisma.variantItem.deleteMany({
      where: { variant: { calculationId: id } },
    });
    await prisma.variant.deleteMany({ where: { calculationId: id } });
    await prisma.estimateItem.deleteMany({
      where: { estimate: { calculationId: id } },
    });
    await prisma.estimate.deleteMany({ where: { calculationId: id } });
    await prisma.calculation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calculation DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}
