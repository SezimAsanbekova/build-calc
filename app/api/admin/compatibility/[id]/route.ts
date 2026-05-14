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
    const { compatibilityType, reason } = await request.json();

    const data: Record<string, unknown> = {};
    if (compatibilityType !== undefined) data.compatibilityType = compatibilityType;
    if (reason !== undefined) data.reason = reason || null;

    const record = await prisma.materialCompatibility.update({
      where: { id },
      data,
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

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Admin compatibility PATCH error:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении' }, { status: 500 });
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
    await prisma.materialCompatibility.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin compatibility DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 });
  }
}
