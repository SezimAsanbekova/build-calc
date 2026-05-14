import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

const materialBrief = {
  id: true,
  name: true,
  price: true,
  isAvailable: true,
  isActive: true,
  imageUrl: true,
  category: { select: { id: true, name: true } },
  manufacturer: { select: { id: true, name: true } },
};

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const records = await prisma.materialAlternative.findMany({
      include: {
        material: { select: materialBrief },
        alternativeMaterial: { select: materialBrief },
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Admin alternatives GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { materialId, alternativeMaterialIds, alternativeMaterialId } = await request.json();

    // Допускаем как одиночный, так и массовый ввод
    const altIds: string[] = Array.isArray(alternativeMaterialIds)
      ? alternativeMaterialIds
      : alternativeMaterialId
        ? [alternativeMaterialId]
        : [];

    if (!materialId || altIds.length === 0) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
    }
    if (altIds.includes(materialId)) {
      return NextResponse.json(
        { error: 'Нельзя указать материал альтернативой самого себя' },
        { status: 400 }
      );
    }

    // Уже существующие связи для этого материала
    const existing = await prisma.materialAlternative.findMany({
      where: { materialId, alternativeMaterialId: { in: altIds } },
      select: { alternativeMaterialId: true },
    });
    const existingSet = new Set(existing.map((e) => e.alternativeMaterialId));

    const toCreate = altIds.filter((id) => !existingSet.has(id));
    if (toCreate.length === 0) {
      return NextResponse.json(
        { error: 'Все указанные альтернативы уже добавлены' },
        { status: 409 }
      );
    }

    await prisma.materialAlternative.createMany({
      data: toCreate.map((altId) => ({
        materialId,
        alternativeMaterialId: altId,
      })),
    });

    const records = await prisma.materialAlternative.findMany({
      where: { materialId, alternativeMaterialId: { in: toCreate } },
      include: {
        material: { select: materialBrief },
        alternativeMaterial: { select: materialBrief },
      },
    });

    return NextResponse.json({ records, created: toCreate.length }, { status: 201 });
  } catch (error) {
    console.error('Admin alternatives POST error:', error);
    return NextResponse.json({ error: 'Ошибка при создании альтернативы' }, { status: 500 });
  }
}
