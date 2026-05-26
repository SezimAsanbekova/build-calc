import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RepairLevel, SurfaceType } from '@prisma/client';
import { generateRecommendations } from '@/lib/recommendations';

const SURFACE_MAP: Record<string, SurfaceType> = {
  walls: 'wall',
  floor: 'floor',
  ceiling: 'ceiling',
};

const REPAIR_MAP: Record<string, RepairLevel> = {
  economy: 'econom',
  standard: 'standard',
  premium: 'premium',
};

const SURFACE_LABEL: Record<SurfaceType, string> = {
  wall: 'Стены',
  floor: 'Пол',
  ceiling: 'Потолок',
};

interface RecommendationItem {
  materialId: string;
  name: string;
  reason: string;
  surface?: string;
}

interface SurfaceGroup {
  surface: SurfaceType;
  label: string;
  surfaceArea: number;
  items: {
    materialId: string;
    quantity: number;
    packageCount: number;
    unitPrice: number;
    totalPrice: number;
    material: {
      id: string;
      name: string;
      unit: string;
      packageUnit: string;
      packageQuantity: number;
      category: { name: string };
      manufacturer: { name: string };
    };
  }[];
  subtotal: number;
}

// ── Вспомогательная функция: жадный отбор материалов без конфликтов ──────────
async function filterCompatible<T extends { id: string; name: string }>(
  candidates: T[],
  extraIds: string[] = [],
): Promise<{ selected: T[]; skippedWarnings: string[] }> {
  const allIds = [...new Set([...candidates.map((m) => m.id), ...extraIds])];
  if (!allIds.length) return { selected: [], skippedWarnings: [] };

  // Двунаправленная загрузка всех пар incompatible
  const incompatibleRecords = await prisma.materialCompatibility.findMany({
    where: {
      compatibilityType: 'incompatible',
      OR: [
        { materialId: { in: allIds } },
        { compatibleMaterialId: { in: allIds } },
      ],
    },
    select: { materialId: true, compatibleMaterialId: true },
  });

  const incompSet = new Set(
    incompatibleRecords.map((p) => [p.materialId, p.compatibleMaterialId].sort().join(':')),
  );
  const isIncompat = (a: string, b: string) => incompSet.has([a, b].sort().join(':'));

  const selected: T[] = [];
  const skippedWarnings: string[] = [];

  for (const m of candidates) {
    const conflict = selected.find((s) => isIncompat(m.id, s.id));
    if (conflict) {
      skippedWarnings.push(`Пропущен "${m.name}" — несовместим с "${conflict.name}"`);
    } else {
      selected.push(m);
    }
  }

  return { selected, skippedWarnings };
}

async function calcSurface(
  dbSurface: SurfaceType,
  dbRepair: RepairLevel,
  surfaceArea: number,
): Promise<SurfaceGroup & { warnings: string[]; recommendations: RecommendationItem[] }> {
  const candidates = await prisma.material.findMany({
    where: {
      surfaceType: dbSurface,
      repairLevel: dbRepair,
      isActive: true,
      isAvailable: true,
      deletedAt: null,
      stockQuantity: { gt: 0 },
    },
    include: {
      category: { select: { name: true } },
      manufacturer: { select: { name: true } },
      compatibilities: {
        include: { compatibleMaterial: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const warnings: string[] = [];
  const recommendations: RecommendationItem[] = [];

  if (!candidates.length) {
    return { surface: dbSurface, label: SURFACE_LABEL[dbSurface], surfaceArea, items: [], subtotal: 0, warnings, recommendations };
  }

  // Жадный отбор с двунаправленной проверкой incompatible
  const { selected, skippedWarnings } = await filterCompatible(candidates);
  warnings.push(...skippedWarnings);

  // Required / recommended из прямых связей отобранных материалов
  const selectedIds = new Set(selected.map((m) => m.id));
  const requiredIds: string[] = [];

  for (const m of selected) {
    for (const compat of m.compatibilities) {
      const cId = compat.compatibleMaterialId;
      if (compat.compatibilityType === 'incompatible') continue;
      if (compat.compatibilityType === 'required' && !selectedIds.has(cId)) {
        if (!requiredIds.includes(cId)) requiredIds.push(cId);
      }
      if (compat.compatibilityType === 'recommended' && !selectedIds.has(cId)) {
        if (!recommendations.find((r) => r.materialId === cId)) {
          recommendations.push({
            materialId: cId,
            name: compat.compatibleMaterial.name,
            reason: compat.reason ?? `Рекомендуется вместе с "${m.name}"`,
          });
        }
      }
    }
  }

  let requiredToAdd: typeof candidates = [];
  if (requiredIds.length > 0) {
    const rawRequired = await prisma.material.findMany({
      where: { id: { in: requiredIds }, isActive: true, isAvailable: true, deletedAt: null },
      include: {
        category: { select: { name: true } },
        manufacturer: { select: { name: true } },
        compatibilities: {
          include: { compatibleMaterial: { select: { id: true, name: true } } },
        },
      },
    });
    for (const req of rawRequired) {
      const allCurrentIds = [...selected, ...requiredToAdd].map((s) => s.id);
      const conflictRec = await prisma.materialCompatibility.findFirst({
        where: {
          compatibilityType: 'incompatible',
          OR: [
            { materialId: req.id, compatibleMaterialId: { in: allCurrentIds } },
            { materialId: { in: allCurrentIds }, compatibleMaterialId: req.id },
          ],
        },
        include: { material: { select: { name: true } }, compatibleMaterial: { select: { name: true } } },
      });
      if (conflictRec) {
        const conflictName = conflictRec.materialId === req.id
          ? conflictRec.compatibleMaterial.name
          : conflictRec.material.name;
        warnings.push(`Пропущен обязательный "${req.name}" — несовместим с "${conflictName}"`);
      } else {
        requiredToAdd.push(req);
        warnings.push(`Автоматически добавлен: "${req.name}" (обязателен для работы)`);
      }
    }
  }

  const allMaterials = [...selected, ...requiredToAdd];

  const items = allMaterials.map((m) => {
    const consumption = parseFloat(m.consumptionPerM2.toString());
    const pkgQty = parseFloat(m.packageQuantity.toString());
    const price = parseFloat(m.price.toString());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wasteFactor = (m as any).wasteFactor ? parseFloat(String((m as any).wasteFactor)) : 1.1;
    const rawQty = surfaceArea * consumption * wasteFactor;
    const packageCount = Math.ceil(rawQty / pkgQty);
    const quantity = packageCount * pkgQty;
    const totalPrice = packageCount * price;

    return {
      materialId: m.id,
      quantity,
      packageCount,
      unitPrice: price,
      totalPrice,
      material: {
        id: m.id,
        name: m.name,
        unit: m.unit,
        packageUnit: m.packageUnit,
        packageQuantity: pkgQty,
        category: m.category,
        manufacturer: m.manufacturer,
      },
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

  return { surface: dbSurface, label: SURFACE_LABEL[dbSurface], surfaceArea, items, subtotal, warnings, recommendations };
}

async function calcSection(
  sectionId: string,
  sectionSlug: string,
  sectionName: string,
  dbRepair: RepairLevel,
  area: number,
): Promise<SurfaceGroup & { warnings: string[]; recommendations: RecommendationItem[] }> {
  const candidates = await prisma.material.findMany({
    where: {
      sectionId,
      repairLevel: dbRepair,
      isActive: true,
      isAvailable: true,
      deletedAt: null,
      stockQuantity: { gt: 0 },
    },
    include: {
      category: { select: { name: true } },
      manufacturer: { select: { name: true } },
      compatibilities: {
        include: { compatibleMaterial: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const warnings: string[] = [];

  if (!candidates.length) {
    return { surface: sectionSlug as SurfaceType, label: sectionName, surfaceArea: area, items: [], subtotal: 0, warnings, recommendations: [] };
  }

  // Жадный отбор с двунаправленной проверкой incompatible
  const { selected, skippedWarnings } = await filterCompatible(candidates);
  warnings.push(...skippedWarnings);

  const items = selected.map((m) => {
    const consumption = parseFloat(m.consumptionPerM2.toString());
    const pkgQty = parseFloat(m.packageQuantity.toString());
    const price = parseFloat(m.price.toString());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wasteFactor = (m as any).wasteFactor ? parseFloat(String((m as any).wasteFactor)) : 1.1;
    const rawQty = area * consumption * wasteFactor;
    const packageCount = Math.ceil(rawQty / pkgQty);
    const quantity = packageCount * pkgQty;
    const totalPrice = packageCount * price;
    return {
      materialId: m.id, quantity, packageCount, unitPrice: price, totalPrice,
      material: { id: m.id, name: m.name, unit: m.unit, packageUnit: m.packageUnit, packageQuantity: pkgQty, category: m.category, manufacturer: m.manufacturer },
    };
  });

  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  return { surface: sectionSlug as SurfaceType, label: sectionName, surfaceArea: area, items, subtotal, warnings, recommendations: [] };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const calculations = await prisma.calculation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          include: {
            items: { select: { id: true } },
          },
        },
      },
    });

    const LEVEL_MAP: Record<string, string> = { econom: 'economy', standard: 'standard', premium: 'premium' };
    const SURF_MAP_REV: Record<string, string> = { wall: 'walls', floor: 'floor', ceiling: 'ceiling' };

    const result = calculations.map((c) => {
      const isFullRoom = c.variants.length > 1;
      const totalPrice = c.variants.reduce((s, v) => s + parseFloat(v.totalPrice.toString()), 0);
      const budget = c.budget ? parseFloat(c.budget.toString()) : 0;
      const fitsBudget = totalPrice <= budget;
      const materialCount = c.variants.reduce((s, v) => s + v.items.length, 0);

      const firstName = c.variants[0]?.title ?? '';
      const dbProjectName = (c as unknown as { projectName?: string | null }).projectName;
      const projectName = (dbProjectName
        ?? (isFullRoom ? firstName.split(' — ').slice(0, -1).join(' — ') : firstName))
        || `Расчёт от ${new Date(c.createdAt).toLocaleDateString('ru-RU')}`;

      return {
        id: c.id,
        projectName,
        roomType: c.roomType,
        surfaceType: isFullRoom ? 'full_room' : (c.surfaceType ? SURF_MAP_REV[c.surfaceType] ?? c.surfaceType : 'walls'),
        repairLevel: LEVEL_MAP[c.repairLevel] ?? c.repairLevel,
        length: c.length,
        width: c.width,
        height: c.height,
        area: c.area,
        budget,
        createdAt: c.createdAt,
        totalPrice: Math.round(totalPrice),
        fitsBudget,
        isFullRoom,
        surfaceCount: c.variants.length,
        materialCount,
        remaining: Math.round(budget - totalPrice),
      };
    });

    return NextResponse.json({ calculations: result });
  } catch (error) {
    console.error('Calculations list error:', error);
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
    const {
      projectName, roomType: rawRoomType, surfaceType, sections: sectionsInput, length, width, height, repairLevel, budget,
      windowCount = '0', windowWidth = '1.4', windowHeight = '1.2',
      doorCount = '1', doorWidth = '0.9', doorHeight = '2.1',
    } = body;

    const sectionsMap: Record<string, boolean> = sectionsInput && typeof sectionsInput === 'object'
      ? sectionsInput as Record<string, boolean>
      : {};

    let roomType: string = rawRoomType ?? '';
    if (roomType.startsWith('custom:')) {
      const customId = roomType.slice(7);
      const customRoom = await prisma.customRoom.findUnique({ where: { id: customId } });
      roomType = customRoom?.name ?? 'custom';
    }

    const isFullRoom = surfaceType === 'full_room';
    const needsHeight = isFullRoom || surfaceType === 'walls';

    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const budgetVal = parseFloat(budget);

    const errors: Record<string, string> = {};
    if (!roomType) errors.roomType = 'Выберите тип помещения';
    if (!surfaceType) errors.surfaceType = 'Выберите тип поверхности';
    if (!repairLevel) errors.repairLevel = 'Выберите уровень ремонта';
    if (!length || isNaN(l) || l <= 0) errors.length = 'Длина должна быть больше 0';
    if (!width || isNaN(w) || w <= 0) errors.width = 'Ширина должна быть больше 0';
    if (needsHeight && (!height || isNaN(h) || h <= 0)) errors.height = 'Высота должна быть больше 0';
    if (budget === undefined || budget === null || budget === '' || isNaN(budgetVal) || budgetVal < 0) {
      errors.budget = 'Укажите корректный бюджет (0 или больше)';
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Ошибка валидации', errors }, { status: 400 });
    }

    const dbRepair = REPAIR_MAP[repairLevel];
    if (!dbRepair) return NextResponse.json({ error: 'Неверный уровень ремонта' }, { status: 400 });

    const area = l * w;
    const perimeter = 2 * (l + w);

    const wc = Math.max(0, parseInt(windowCount) || 0);
    const ww = Math.max(0, parseFloat(windowWidth) || 0);
    const wh = Math.max(0, parseFloat(windowHeight) || 0);
    const dc = Math.max(0, parseInt(doorCount) || 0);
    const dw = Math.max(0, parseFloat(doorWidth) || 0);
    const dh = Math.max(0, parseFloat(doorHeight) || 0);
    const openingsArea = wc * ww * wh + dc * dw * dh;

    const surfacesToCalc: SurfaceType[] = isFullRoom
      ? ['wall', 'floor', 'ceiling']
      : [SURFACE_MAP[surfaceType]];

    if (!isFullRoom && !SURFACE_MAP[surfaceType]) {
      return NextResponse.json({ error: 'Неверный тип поверхности' }, { status: 400 });
    }

    const rawGroups: (SurfaceGroup & { warnings: string[]; recommendations: RecommendationItem[] })[] = [];
    let totalPrice = 0;

    for (const surface of surfacesToCalc) {
      let surfaceArea = surface === 'wall' ? perimeter * h : area;
      if (surface === 'wall' && openingsArea > 0) {
        surfaceArea = Math.max(0, surfaceArea - openingsArea);
      }
      const group = await calcSurface(surface, dbRepair, surfaceArea);
      rawGroups.push(group);
      totalPrice += group.subtotal;
    }

    const fitsBudget = totalPrice <= budgetVal;

    const budgetAnalysis = {
      total: Math.round(totalPrice),
      budget: Math.round(budgetVal),
      usedPercent: budgetVal > 0 ? Math.round((totalPrice / budgetVal) * 100) : 0,
      remaining: Math.round(budgetVal - totalPrice),
      bySurface: rawGroups.map((g) => ({
        label: g.label,
        subtotal: Math.round(g.subtotal),
        percent: totalPrice > 0 ? Math.round((g.subtotal / totalPrice) * 100) : 0,
      })),
      mostExpensive: (() => {
        const all = rawGroups.flatMap((g) => g.items);
        if (!all.length) return null;
        const max = all.reduce((m, i) => Number(i.totalPrice) > Number(m.totalPrice) ? i : m);
        return { name: max.material.name, category: max.material.category.name, totalPrice: Math.round(Number(max.totalPrice)) };
      })(),
    };

    type BudgetOpt = {
      currentMaterial: string; currentMaterialId: string;
      alternativeMaterial: string; alternativeMaterialId: string; alternativeManufacturer: string;
      currentUnitPrice: number; alternativeUnitPrice: number; savings: number; savingsPercent: number; reason: string | null;
    };
    let budgetOptimizations: BudgetOpt[] = [];
    if (!fitsBudget) {
      const allItems = rawGroups.flatMap((g) => g.items);
      const top5Ids = [...allItems]
        .sort((a, b) => Number(b.totalPrice) - Number(a.totalPrice))
        .slice(0, 5)
        .map((i) => i.materialId);
      const altData = await prisma.materialAlternative.findMany({
        where: { materialId: { in: top5Ids } },
        include: {
          material: {
            select: { categoryId: true, sectionId: true, surfaceType: true, unit: true, repairLevel: true },
          },
          alternativeMaterial: {
            select: {
              name: true, price: true,
              categoryId: true, sectionId: true, surfaceType: true, unit: true, repairLevel: true,
              manufacturer: { select: { name: true } },
            },
          },
        },
      });
      const REPAIR_ORDER_OPT: Record<string, number> = { econom: 0, standard: 1, premium: 2 };
      budgetOptimizations = altData
        .filter((alt) => {
          const m = alt.material;
          const a = alt.alternativeMaterial;
          if (m.categoryId !== a.categoryId) return false;
          if (m.unit !== a.unit) return false;
          if (m.surfaceType && a.surfaceType && m.surfaceType !== a.surfaceType) return false;
          if (m.sectionId && a.sectionId && m.sectionId !== a.sectionId) return false;
          const repairDiff = Math.abs((REPAIR_ORDER_OPT[m.repairLevel] ?? 0) - (REPAIR_ORDER_OPT[a.repairLevel] ?? 0));
          if (repairDiff > 1) return false;
          return true;
        })
        .map((alt) => {
          const cur = allItems.find((i) => i.materialId === alt.materialId);
          if (!cur) return null;
          const altPrice = parseFloat(alt.alternativeMaterial.price.toString());
          const savings = Number(cur.totalPrice) - cur.packageCount * altPrice;
          if (savings <= 0) return null;
          return {
            currentMaterial: cur.material.name,
            currentMaterialId: cur.materialId,
            alternativeMaterial: alt.alternativeMaterial.name,
            alternativeMaterialId: alt.alternativeMaterialId,
            alternativeManufacturer: alt.alternativeMaterial.manufacturer.name,
            currentUnitPrice: Math.round(cur.unitPrice),
            alternativeUnitPrice: Math.round(altPrice),
            savings: Math.round(savings),
            savingsPercent: Math.round((savings / Number(cur.totalPrice)) * 100),
            reason: (alt as any).reason ?? null,
          } as BudgetOpt;
        })
        .filter((x): x is BudgetOpt => x !== null);
    }

    const allWarnings = rawGroups.flatMap((g) =>
      g.warnings.map((w) => (isFullRoom ? `[${g.label}] ${w}` : w)),
    );
    const allRecommendations: RecommendationItem[] = rawGroups.flatMap((g) =>
      g.recommendations.map((r) => ({ ...r, surface: isFullRoom ? g.label : undefined })),
    );

    const dbSurfaceFirst: SurfaceType | undefined = isFullRoom ? 'wall' : SURFACE_MAP[surfaceType] ?? undefined;

    const calculation = await prisma.calculation.create({
      data: {
        userId: session.user.id,
        ...(projectName ? { projectName } : {}),
        roomType,
        ...(dbSurfaceFirst ? { surfaceType: dbSurfaceFirst } : {}),
        length: l,
        width: w,
        height: needsHeight && !isNaN(h) ? h : null,
        area,
        perimeter,
        budget: budgetVal,
        repairLevel: dbRepair,
        variants: {
          create: rawGroups.map((group) => ({
            title: isFullRoom
              ? `${projectName || 'Расчет'} — ${group.label}`
              : projectName || `Расчет ${new Date().toLocaleDateString('ru-RU')}`,
            totalPrice: group.subtotal,
            fitsBudget: group.subtotal <= budgetVal,
            items: {
              create: group.items.map(({ materialId, quantity, packageCount, unitPrice, totalPrice: tp }) => ({
                materialId,
                quantity,
                packageCount,
                unitPrice,
                totalPrice: tp,
              })),
            },
          })),
        },
      },
      select: { id: true },
    });

    // Сохраняем выбранные секции для расчёта
    const activeSlugs = Object.entries(sectionsMap).filter(([, v]) => v).map(([k]) => k);
    if (activeSlugs.length > 0) {
      const dbSections = await prisma.repairSection.findMany({
        where: { slug: { in: activeSlugs } },
        select: { id: true, slug: true },
      });
      const subtotalMap = new Map(rawGroups.map((g) => [g.surface.toString(), g.subtotal]));
      const slugToSurface: Record<string, string> = { walls: 'wall', floor: 'floor', ceiling: 'ceiling' };
      await prisma.calculationSection.createMany({
        data: dbSections.map((sec) => ({
          calculationId: calculation.id,
          sectionId: sec.id,
          enabled: true,
          subtotal: subtotalMap.get(slugToSurface[sec.slug] ?? sec.slug) ?? 0,
        })),
        skipDuplicates: true,
      });
    }

    // Получаем ID созданных VariantItem для возврата в ответе
    const createdVariants = await prisma.variant.findMany({
      where: { calculationId: calculation.id },
      include: {
        items: { where: { isDeleted: false }, select: { id: true, materialId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const surfaceGroups = rawGroups.map(({ warnings: _w, recommendations: _r, ...g }, gi) => {
      const variant = createdVariants[gi];
      const idQueue = new Map<string, string[]>();
      if (variant) {
        for (const vi of variant.items) {
          const q = idQueue.get(vi.materialId) ?? [];
          q.push(vi.id);
          idQueue.set(vi.materialId, q);
        }
      }
      return {
        ...g,
        variantId: variant?.id ?? null,
        items: g.items.map((item) => {
          const q = idQueue.get(item.materialId) ?? [];
          const variantItemId = q.shift() ?? null;
          idQueue.set(item.materialId, q);
          return { ...item, variantItemId };
        }),
      };
    });

    const allItems = rawGroups.flatMap((g) => g.items);
    const uniqueCategories = [...new Set(allItems.map((i) => i.material.category.name))];
    const uniqueNames = [...new Set(allItems.map((i) => i.material.name))];

    const langCookie = request.cookies.get('lang')?.value ?? 'ru';

    const smartRecommendations = generateRecommendations({
      roomType,
      surfaceType,
      repairLevel,
      budget: budgetVal,
      totalPrice,
      area,
      categories: uniqueCategories,
      materialNames: uniqueNames,
      budgetOptimizations,
      lang: langCookie,
    });

    return NextResponse.json({
      calculationId: calculation.id,
      projectName: projectName || `Расчет ${new Date().toLocaleDateString('ru-RU')}`,
      roomType,
      surfaceType,
      repairLevel,
      length: l,
      width: w,
      height: needsHeight && !isNaN(h) ? h : null,
      area,
      openingsArea: Math.round(openingsArea * 100) / 100,
      budget: budgetVal,
      totalPrice,
      fitsBudget,
      isFullRoom,
      surfaceGroups,
      warnings: allWarnings,
      recommendations: allRecommendations,
      budgetAnalysis,
      budgetOptimizations,
      smartRecommendations,
    });
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Ошибка при выполнении расчёта' }, { status: 500 });
  }
}
