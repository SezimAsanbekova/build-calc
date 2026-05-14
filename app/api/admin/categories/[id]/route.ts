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

function slugify(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
    ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return input
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { id } = await params;
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });

    // Перегенерируем slug если изменилось имя
    const data: { name: string; slug?: string } = { name };
    if (existing.name !== name) {
      let baseSlug = slugify(name);
      if (!baseSlug) baseSlug = 'category';
      let slug = baseSlug;
      let counter = 1;
      // Slug должен быть уникальным, но не должен конфликтовать сам с собой
      while (true) {
        const conflict = await prisma.category.findUnique({ where: { slug } });
        if (!conflict || conflict.id === id) break;
        slug = `${baseSlug}-${counter++}`;
      }
      data.slug = slug;
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: { _count: { select: { materials: true } } },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Admin category PATCH error:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении категории' }, { status: 500 });
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

    // Проверяем — есть ли материалы в этой категории
    const count = await prisma.material.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (count > 0) {
      return NextResponse.json(
        { error: `В категории есть материалы (${count}). Сначала удалите или перенесите их.` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin category DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка при удалении категории' }, { status: 500 });
  }
}
