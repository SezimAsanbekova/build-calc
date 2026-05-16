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

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { materials: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { name, forceCreate } = await request.json();
    if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

    // Проверка на дубликаты (только если не принудительное создание)
    if (!forceCreate) {
      // Точное совпадение
      const exactMatch = await prisma.category.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (exactMatch) {
        return NextResponse.json(
          {
            error: 'Категория с таким названием уже существует',
            existingCategory: {
              id: exactMatch.id,
              name: exactMatch.name,
            },
          },
          { status: 409 }
        );
      }

      // Похожие категории
      const similarCategories = await prisma.category.findMany({
        where: {
          name: {
            contains: name.trim(),
            mode: 'insensitive',
          },
        },
        take: 5,
      });

      if (similarCategories.length > 0) {
        return NextResponse.json(
          {
            warning: 'Найдены похожие категории',
            similarCategories: similarCategories.map((c) => ({
              id: c.id,
              name: c.name,
            })),
          },
          { status: 200 }
        );
      }
    }

    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = 'category';
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const category = await prisma.category.create({ data: { name, slug } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json({ error: 'Ошибка при создании категории' }, { status: 500 });
  }
}
