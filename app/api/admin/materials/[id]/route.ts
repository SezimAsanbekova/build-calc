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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    const fields = [
      'name', 'categoryId', 'manufacturerId', 'repairLevel', 'surfaceType',
      'unit', 'packageUnit', 'description', 'imageUrl', 'isAvailable', 'isActive',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    // Числовые поля
    if (body.price !== undefined) data.price = body.price.toString();
    if (body.consumptionPerM2 !== undefined) data.consumptionPerM2 = body.consumptionPerM2.toString();
    if (body.packageQuantity !== undefined) data.packageQuantity = body.packageQuantity.toString();
    if (body.stockQuantity !== undefined) data.stockQuantity = Number(body.stockQuantity);

    const material = await prisma.material.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        manufacturer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ material });
  } catch (error) {
    console.error('Admin materials PATCH error:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении материала' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { id } = await params;

    // Soft delete — ставим deletedAt вместо физического удаления
    await prisma.material.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin materials DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка при удалении материала' }, { status: 500 });
  }
}
