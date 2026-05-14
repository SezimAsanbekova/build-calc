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
    const { name, country } = await request.json();
    if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

    const manufacturer = await prisma.manufacturer.update({
      where: { id },
      data: { name, country: country || null },
      include: { _count: { select: { materials: true } } },
    });

    return NextResponse.json({ manufacturer });
  } catch (error) {
    console.error('Admin manufacturer PATCH error:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении производителя' }, { status: 500 });
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

    // Проверяем связанные материалы
    const count = await prisma.material.count({
      where: { manufacturerId: id, deletedAt: null },
    });
    if (count > 0) {
      return NextResponse.json(
        { error: `У производителя есть материалы (${count}). Сначала удалите или перенесите их.` },
        { status: 409 }
      );
    }

    await prisma.manufacturer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin manufacturer DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка при удалении производителя' }, { status: 500 });
  }
}
