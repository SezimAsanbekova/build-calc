import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SuggestedAlternative {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  imageUrl: string | null;
  category: { id: string; name: string };
  manufacturer: { id: string; name: string };
  priceDifference: number;
  priceDifferencePct: number;
  cheaper: boolean;
  withinBudget: boolean | null;
  compatibilityScore: number;
  cheaperBy: number | null;
  reason: string | null;
}

interface AltMat {
  id: string;
  name: string;
  price: { toString(): string };
  isAvailable: boolean;
  isActive: boolean;
  imageUrl: string | null;
  categoryId: string;
  sectionId: string | null;
  surfaceType: string | null;
  repairLevel: string;
  unit: string;
  category: { id: string; name: string };
  manufacturer: { id: string; name: string };
}

interface AltEntry {
  mat: AltMat;
  compatibilityScore: number;
  cheaperBy: number | null;
  reason: string | null;
}

// Порядок уровней ремонта
const REPAIR_ORDER: Record<string, number> = { econom: 0, standard: 1, premium: 2 };

function isRepairCompatible(a: string, b: string): boolean {
  return Math.abs((REPAIR_ORDER[a] ?? 0) - (REPAIR_ORDER[b] ?? 0)) <= 1;
}

type AttrCheck = {
  categoryId: string;
  sectionId: string | null;
  surfaceType: string | null;
  repairLevel: string;
  unit: string;
};

function isAttributeCompatible(orig: AttrCheck, alt: AttrCheck): boolean {
  if (orig.categoryId !== alt.categoryId) return false;
  if (orig.unit !== alt.unit) return false;
  if (orig.surfaceType && alt.surfaceType && orig.surfaceType !== alt.surfaceType) return false;
  if (orig.sectionId && alt.sectionId && orig.sectionId !== alt.sectionId) return false;
  if (!isRepairCompatible(orig.repairLevel, alt.repairLevel)) return false;
  return true;
}

interface SuggestResponse {
  material: {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
    isActive: boolean;
  };
  reason: 'unavailable' | 'over-budget' | 'manual';
  budget: number | null;
  alternatives: SuggestedAlternative[];
}

/**
 * POST /api/alternatives/suggest
 * Body: { materialId: string, budget?: number }
 *
 * Возвращает альтернативные материалы:
 *  - если основной материал недоступен → reason='unavailable'
 *  - если указан budget и цена выше → reason='over-budget' (только дешевле бюджета)
 *  - иначе → reason='manual' (все альтернативы для информации)
 *
 * Альтернативы сортируются от самых дешёвых к самым дорогим.
 */
export async function POST(request: NextRequest) {
  try {
    const { materialId, budget } = await request.json();

    if (!materialId) {
      return NextResponse.json({ error: 'materialId обязателен' }, { status: 400 });
    }

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: {
        id: true,
        name: true,
        price: true,
        isAvailable: true,
        isActive: true,
        categoryId: true,
        sectionId: true,
        surfaceType: true,
        repairLevel: true,
        unit: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Материал не найден' }, { status: 404 });
    }

    const basePrice = Number(material.price);
    const budgetNum = typeof budget === 'number' ? budget : null;

    // Определяем причину поиска альтернатив
    const isUnavailable = !material.isAvailable || !material.isActive;
    const isOverBudget = budgetNum !== null && basePrice > budgetNum;

    let reason: 'unavailable' | 'over-budget' | 'manual';
    if (isUnavailable) reason = 'unavailable';
    else if (isOverBudget) reason = 'over-budget';
    else reason = 'manual';

    // Загружаем все альтернативы (двунаправленно — связь симметрична)
    const records = await prisma.materialAlternative.findMany({
      where: {
        OR: [
          { materialId },
          { alternativeMaterialId: materialId },
        ],
      },
      include: {
        material: {
          select: {
            id: true, name: true, price: true, isAvailable: true, isActive: true,
            imageUrl: true,
            categoryId: true, sectionId: true, surfaceType: true, repairLevel: true, unit: true,
            category: { select: { id: true, name: true } },
            manufacturer: { select: { id: true, name: true } },
          },
        },
        alternativeMaterial: {
          select: {
            id: true, name: true, price: true, isAvailable: true, isActive: true,
            imageUrl: true,
            categoryId: true, sectionId: true, surfaceType: true, repairLevel: true, unit: true,
            category: { select: { id: true, name: true } },
            manufacturer: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Атрибуты исходного материала для строгой проверки
    const origAttrs: AttrCheck = {
      categoryId: material.categoryId,
      sectionId: material.sectionId,
      surfaceType: material.surfaceType as string | null,
      repairLevel: material.repairLevel as string,
      unit: material.unit,
    };

    // Извлекаем уникальные альтернативы с AI-полями + строгой фильтрацией
    const altMap = new Map<string, AltEntry>();
    for (const r of records) {
      const isForward = r.materialId === materialId;
      const altMat = isForward ? (r.alternativeMaterial as AltMat) : (r.material as AltMat);
      if (altMat.id === materialId || altMap.has(altMat.id)) continue;

      // Строгая проверка атрибутов
      const altAttrs: AttrCheck = {
        categoryId: altMat.categoryId,
        sectionId: altMat.sectionId,
        surfaceType: altMat.surfaceType,
        repairLevel: altMat.repairLevel,
        unit: altMat.unit,
      };
      if (!isAttributeCompatible(origAttrs, altAttrs)) continue;

      altMap.set(altMat.id, {
        mat: altMat,
        compatibilityScore: r.compatibilityScore,
        cheaperBy: r.cheaperBy != null ? Number(r.cheaperBy) : null,
        reason: r.reason ?? null,
      });
    }

    let alternatives: SuggestedAlternative[] = Array.from(altMap.values())
      .filter(({ mat }) => mat.isActive)
      .map(({ mat: a, compatibilityScore, cheaperBy, reason }) => {
        const altPrice = Number(a.price);
        const diff = altPrice - basePrice;
        const diffPct = basePrice > 0 ? (diff / basePrice) * 100 : 0;
        return {
          id: a.id,
          name: a.name,
          price: altPrice,
          isAvailable: a.isAvailable,
          isActive: a.isActive,
          imageUrl: a.imageUrl,
          category: a.category,
          manufacturer: a.manufacturer,
          priceDifference: diff,
          priceDifferencePct: diffPct,
          cheaper: diff < 0,
          withinBudget: budgetNum !== null ? altPrice <= budgetNum : null,
          compatibilityScore,
          cheaperBy,
          reason,
        };
      });

    // При over-budget оставляем только варианты в рамках бюджета
    if (reason === 'over-budget' && budgetNum !== null) {
      alternatives = alternatives.filter((a) => a.price <= budgetNum && a.isAvailable);
    }
    // При unavailable — только доступные
    if (reason === 'unavailable') {
      alternatives = alternatives.filter((a) => a.isAvailable);
    }

    // Сортировка: доступные → compatibilityScore desc → цена asc
    alternatives.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      const scoreDiff = (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.price - b.price;
    });

    const response: SuggestResponse = {
      material: {
        id: material.id,
        name: material.name,
        price: basePrice,
        isAvailable: material.isAvailable,
        isActive: material.isActive,
      },
      reason,
      budget: budgetNum,
      alternatives,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Alternatives suggest error:', error);
    return NextResponse.json({ error: 'Ошибка подбора альтернатив' }, { status: 500 });
  }
}
