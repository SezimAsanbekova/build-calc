import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CompatibilityIssue {
  materialId: string;
  materialName: string;
  conflictsWith: string;
  conflictsWithName: string;
  reason: string | null;
}

interface CompatibilityRecommendation {
  materialId: string;
  materialName: string;
  type: 'required' | 'recommended';
  reason: string | null;
}

/**
 * POST /api/compatibility/check
 * Body: { materialIds: string[] }
 *
 * Проверяет попарно совместимость указанных материалов.
 * Возвращает:
 *  - compatible: можно ли использовать вместе (нет несовместимостей)
 *  - incompatibilities: список конфликтов
 *  - missingRequired: обязательные связки, которые не учтены
 *  - recommendations: рекомендованные дополнения для уже выбранных материалов
 */
export async function POST(request: NextRequest) {
  try {
    const { materialIds } = await request.json();

    if (!Array.isArray(materialIds) || materialIds.length === 0) {
      return NextResponse.json({ error: 'Передайте массив materialIds' }, { status: 400 });
    }

    const ids: string[] = Array.from(new Set(materialIds));

    // Загружаем материалы для имён
    const materials = await prisma.material.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(materials.map((m) => [m.id, m.name]));

    // Все связи где хотя бы один из материалов входит в выбранные
    const allRecords = await prisma.materialCompatibility.findMany({
      where: {
        OR: [{ materialId: { in: ids } }, { compatibleMaterialId: { in: ids } }],
      },
      include: {
        material: { select: { id: true, name: true } },
        compatibleMaterial: { select: { id: true, name: true } },
      },
    });

    const incompatibilities: CompatibilityIssue[] = [];
    const missingRequired: CompatibilityRecommendation[] = [];
    const recommendationsMap = new Map<string, CompatibilityRecommendation>();

    for (const rec of allRecords) {
      const aSelected = ids.includes(rec.materialId);
      const bSelected = ids.includes(rec.compatibleMaterialId);

      // Оба выбраны
      if (aSelected && bSelected) {
        if (rec.compatibilityType === 'incompatible') {
          incompatibilities.push({
            materialId: rec.materialId,
            materialName: rec.material.name,
            conflictsWith: rec.compatibleMaterialId,
            conflictsWithName: rec.compatibleMaterial.name,
            reason: rec.reason,
          });
        }
        continue;
      }

      // Только A выбран — B может быть рекомендован/обязателен
      if (aSelected && !bSelected) {
        if (rec.compatibilityType === 'required') {
          missingRequired.push({
            materialId: rec.compatibleMaterialId,
            materialName: rec.compatibleMaterial.name,
            type: 'required',
            reason: rec.reason,
          });
        } else if (rec.compatibilityType === 'recommended') {
          if (!recommendationsMap.has(rec.compatibleMaterialId)) {
            recommendationsMap.set(rec.compatibleMaterialId, {
              materialId: rec.compatibleMaterialId,
              materialName: rec.compatibleMaterial.name,
              type: 'recommended',
              reason: rec.reason,
            });
          }
        }
      }

      // Только B выбран — A может быть рекомендован/обязателен (связь двунаправленная)
      if (!aSelected && bSelected) {
        if (rec.compatibilityType === 'required') {
          missingRequired.push({
            materialId: rec.materialId,
            materialName: rec.material.name,
            type: 'required',
            reason: rec.reason,
          });
        } else if (rec.compatibilityType === 'recommended') {
          if (!recommendationsMap.has(rec.materialId)) {
            recommendationsMap.set(rec.materialId, {
              materialId: rec.materialId,
              materialName: rec.material.name,
              type: 'recommended',
              reason: rec.reason,
            });
          }
        }
      }
    }

    return NextResponse.json({
      compatible: incompatibilities.length === 0,
      hasMissingRequired: missingRequired.length > 0,
      incompatibilities,
      missingRequired,
      recommendations: Array.from(recommendationsMap.values()),
      checkedMaterials: ids.map((id) => ({ id, name: nameMap.get(id) || 'Неизвестно' })),
    });
  } catch (error) {
    console.error('Compatibility check error:', error);
    return NextResponse.json({ error: 'Ошибка проверки совместимости' }, { status: 500 });
  }
}
