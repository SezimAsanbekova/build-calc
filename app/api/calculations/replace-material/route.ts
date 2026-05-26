import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { variantItemId, newMaterialId } = await request.json();

    if (!variantItemId || !newMaterialId) {
      return NextResponse.json(
        { error: 'variantItemId и newMaterialId обязательны' },
        { status: 400 },
      );
    }

    // Находим старую позицию с данными варианта и расчёта
    const oldItem = await prisma.variantItem.findUnique({
      where: { id: variantItemId },
      include: {
        variant: {
          include: {
            calculation: { select: { id: true, userId: true, budget: true } },
            items: {
              where: { isDeleted: false },
              select: { materialId: true },
            },
          },
        },
      },
    });

    if (!oldItem || oldItem.isDeleted) {
      return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 });
    }

    // Проверка владельца
    if (oldItem.variant.calculation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    // Атрибуты старого материала для валидации
    const oldMaterial = await prisma.material.findUnique({
      where: { id: oldItem.materialId },
      select: { categoryId: true, sectionId: true, surfaceType: true, repairLevel: true, unit: true },
    });

    // Загружаем новый материал
    const newMaterial = await prisma.material.findUnique({
      where: { id: newMaterialId },
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
        packageUnit: true,
        packageQuantity: true,
        isAvailable: true,
        isActive: true,
        categoryId: true,
        sectionId: true,
        surfaceType: true,
        repairLevel: true,
        category: { select: { name: true } },
        manufacturer: { select: { name: true } },
      },
    });

    if (!newMaterial || !newMaterial.isActive) {
      return NextResponse.json({ error: 'Материал не найден или неактивен' }, { status: 404 });
    }

    // Валидация атрибутов совместимости
    if (oldMaterial) {
      const REPAIR_ORDER: Record<string, number> = { econom: 0, standard: 1, premium: 2 };
      const repairDiff = Math.abs(
        (REPAIR_ORDER[oldMaterial.repairLevel] ?? 0) -
        (REPAIR_ORDER[newMaterial.repairLevel] ?? 0),
      );

      if (oldMaterial.categoryId !== newMaterial.categoryId) {
        return NextResponse.json(
          { error: 'Нельзя заменить материал другой категории', incompatibleAttributes: true, field: 'category' },
          { status: 409 },
        );
      }
      if (oldMaterial.unit !== newMaterial.unit) {
        return NextResponse.json(
          { error: 'Единица измерения не совпадает', incompatibleAttributes: true, field: 'unit' },
          { status: 409 },
        );
      }
      if (
        oldMaterial.surfaceType && newMaterial.surfaceType &&
        oldMaterial.surfaceType !== newMaterial.surfaceType
      ) {
        return NextResponse.json(
          { error: 'Нельзя заменить материал другого типа поверхности', incompatibleAttributes: true, field: 'surfaceType' },
          { status: 409 },
        );
      }
      if (
        oldMaterial.sectionId && newMaterial.sectionId &&
        oldMaterial.sectionId !== newMaterial.sectionId
      ) {
        return NextResponse.json(
          { error: 'Нельзя заменить материал другой секции', incompatibleAttributes: true, field: 'section' },
          { status: 409 },
        );
      }
      if (repairDiff > 1) {
        return NextResponse.json(
          { error: 'Уровни ремонта слишком различаются', incompatibleAttributes: true, field: 'repairLevel' },
          { status: 409 },
        );
      }
    }

    // Проверяем совместимость — несовместимые материалы блокируют замену
    const existingMaterialIds = oldItem.variant.items
      .filter((i) => i.materialId !== oldItem.materialId)
      .map((i) => i.materialId);

    if (existingMaterialIds.length > 0) {
      const incompatibles = await prisma.materialCompatibility.findMany({
        where: {
          compatibilityType: 'incompatible',
          OR: [
            { materialId: newMaterialId, compatibleMaterialId: { in: existingMaterialIds } },
            { materialId: { in: existingMaterialIds }, compatibleMaterialId: newMaterialId },
          ],
        },
        include: {
          material: { select: { name: true } },
          compatibleMaterial: { select: { name: true } },
        },
      });

      if (incompatibles.length > 0) {
        return NextResponse.json(
          {
            error: 'Несовместимые материалы — замена заблокирована',
            incompatible: true,
            conflicts: incompatibles.map((ic) => ({
              material1: ic.material.name,
              material2: ic.compatibleMaterial.name,
              reason: ic.reason ?? null,
            })),
          },
          { status: 409 },
        );
      }
    }

    // Проверяем рекомендованные (информационно)
    const recommended = await prisma.materialCompatibility.findMany({
      where: {
        compatibilityType: 'recommended',
        materialId: newMaterialId,
        NOT: { compatibleMaterialId: { in: existingMaterialIds } },
      },
      include: { compatibleMaterial: { select: { id: true, name: true } } },
      take: 5,
    });

    // Мягкое удаление старой позиции
    await prisma.variantItem.update({
      where: { id: variantItemId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    // Создаём новую позицию с привязкой к старой
    const newUnitPrice = Number(newMaterial.price);
    const newTotalPrice = Math.round(newUnitPrice * oldItem.packageCount);

    const newItem = await prisma.variantItem.create({
      data: {
        variantId: oldItem.variantId,
        materialId: newMaterialId,
        quantity: oldItem.quantity,
        packageCount: oldItem.packageCount,
        unitPrice: newUnitPrice,
        totalPrice: newTotalPrice,
        isCustom: true,
        replacedFromId: oldItem.id,
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            packageUnit: true,
            packageQuantity: true,
            category: { select: { name: true } },
            manufacturer: { select: { name: true } },
          },
        },
      },
    });

    // Пересчитываем итог варианта
    const activeItems = await prisma.variantItem.findMany({
      where: { variantId: oldItem.variantId, isDeleted: false },
      select: { totalPrice: true },
    });
    const newVariantTotal = activeItems.reduce((s, i) => s + Number(i.totalPrice), 0);
    const budget = oldItem.variant.calculation.budget
      ? Number(oldItem.variant.calculation.budget)
      : 0;

    await prisma.variant.update({
      where: { id: oldItem.variantId },
      data: {
        totalPrice: newVariantTotal,
        fitsBudget: budget > 0 ? newVariantTotal <= budget : true,
      },
    });

    return NextResponse.json({
      success: true,
      newItem: {
        variantItemId: newItem.id,
        materialId: newItem.materialId,
        quantity: newItem.quantity,
        packageCount: newItem.packageCount,
        unitPrice: Number(newItem.unitPrice),
        totalPrice: Number(newItem.totalPrice),
        material: newItem.material,
      },
      newVariantTotal: Math.round(newVariantTotal),
      fitsBudget: budget > 0 ? newVariantTotal <= budget : true,
      recommended: recommended.map((r) => ({
        id: r.compatibleMaterial.id,
        name: r.compatibleMaterial.name,
      })),
    });
  } catch (error) {
    console.error('Replace material error:', error);
    return NextResponse.json({ error: 'Ошибка при замене материала' }, { status: 500 });
  }
}
