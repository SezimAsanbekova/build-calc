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
  priceDifference: number;     // отрицательное = дешевле
  priceDifferencePct: number;  // отрицательное = дешевле
  cheaper: boolean;
  withinBudget: boolean | null; // null если бюджет не указан
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
            category: { select: { id: true, name: true } },
            manufacturer: { select: { id: true, name: true } },
          },
        },
        alternativeMaterial: {
          select: {
            id: true, name: true, price: true, isAvailable: true, isActive: true,
            imageUrl: true,
            category: { select: { id: true, name: true } },
            manufacturer: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Извлекаем уникальные альтернативные материалы (исключая основной)
    const altMap = new Map<string, typeof records[number]['alternativeMaterial']>();
    for (const r of records) {
      if (r.materialId === materialId) {
        altMap.set(r.alternativeMaterial.id, r.alternativeMaterial);
      } else if (r.alternativeMaterialId === materialId) {
        altMap.set(r.material.id, r.material);
      }
    }

    let alternatives: SuggestedAlternative[] = Array.from(altMap.values())
      .filter((a) => a.isActive) // не показываем выключенные
      .map((a) => {
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

    // Сортировка: сначала дешёвые, потом доступные, потом всё
    alternatives.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
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
