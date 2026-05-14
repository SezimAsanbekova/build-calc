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

    const materials = await prisma.material.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        manufacturer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Admin materials GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const body = await request.json();
    const {
      name,
      categoryId,
      manufacturerId,
      repairLevel,
      surfaceType,
      price,
      consumptionPerM2,
      unit,
      packageQuantity,
      packageUnit,
      stockQuantity,
      description,
      imageUrl,
      isAvailable,
      isActive,
    } = body;

    // Валидация
    if (!name || !categoryId || !manufacturerId || !repairLevel || !surfaceType) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля' },
        { status: 400 }
      );
    }
    if (!unit || !packageUnit) {
      return NextResponse.json({ error: 'Укажите единицы измерения' }, { status: 400 });
    }
    if (price === undefined || consumptionPerM2 === undefined || packageQuantity === undefined) {
      return NextResponse.json({ error: 'Укажите числовые параметры' }, { status: 400 });
    }

    // Генерируем уникальный slug
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = 'material';
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.material.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const material = await prisma.material.create({
      data: {
        name,
        slug,
        categoryId,
        manufacturerId,
        repairLevel,
        surfaceType,
        price: price.toString(),
        consumptionPerM2: consumptionPerM2.toString(),
        unit,
        packageQuantity: packageQuantity.toString(),
        packageUnit,
        stockQuantity: Number(stockQuantity ?? 0),
        description: description || null,
        imageUrl: imageUrl || null,
        isAvailable: isAvailable ?? true,
        isActive: isActive ?? true,
      },
      include: {
        category: { select: { id: true, name: true } },
        manufacturer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('Admin materials POST error:', error);
    return NextResponse.json({ error: 'Ошибка при создании материала' }, { status: 500 });
  }
}
