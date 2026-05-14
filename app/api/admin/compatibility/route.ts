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

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const records = await prisma.materialCompatibility.findMany({
      include: {
        material: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
            manufacturer: { select: { name: true } },
          },
        },
        compatibleMaterial: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
            manufacturer: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Admin compatibility GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { materialId, compatibleMaterialId, compatibilityType, reason } = await request.json();

    if (!materialId || !compatibleMaterialId || !compatibilityType) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля' },
        { status: 400 }
      );
    }
    if (materialId === compatibleMaterialId) {
      return NextResponse.json(
        { error: 'Нельзя связать материал с самим собой' },
        { status: 400 }
      );
    }

    // Запрещаем дубликаты
    const existing = await prisma.materialCompatibility.findFirst({
      where: { materialId, compatibleMaterialId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Связь между этими материалами уже задана' },
        { status: 409 }
      );
    }

    const record = await prisma.materialCompatibility.create({
      data: {
        materialId,
        compatibleMaterialId,
        compatibilityType,
        reason: reason || null,
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
            manufacturer: { select: { name: true } },
          },
        },
        compatibleMaterial: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
            manufacturer: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Admin compatibility POST error:', error);
    return NextResponse.json({ error: 'Ошибка при создании связи' }, { status: 500 });
  }
}
