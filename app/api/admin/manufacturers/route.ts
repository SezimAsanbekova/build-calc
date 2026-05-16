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

    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { materials: true } },
      },
    });

    return NextResponse.json({ manufacturers });
  } catch (error) {
    console.error('Admin manufacturers GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { name, country, forceCreate } = await request.json();
    if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

    // Проверка на дубликаты (только если не принудительное создание)
    if (!forceCreate) {
      // Точное совпадение
      const exactMatch = await prisma.manufacturer.findFirst({
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
            error: 'Производитель с таким названием уже существует',
            existingManufacturer: {
              id: exactMatch.id,
              name: exactMatch.name,
              country: exactMatch.country,
            },
          },
          { status: 409 }
        );
      }

      // Похожие производители
      const similarManufacturers = await prisma.manufacturer.findMany({
        where: {
          name: {
            contains: name.trim(),
            mode: 'insensitive',
          },
        },
        take: 5,
      });

      if (similarManufacturers.length > 0) {
        return NextResponse.json(
          {
            warning: 'Найдены похожие производители',
            similarManufacturers: similarManufacturers.map((m) => ({
              id: m.id,
              name: m.name,
              country: m.country,
            })),
          },
          { status: 200 }
        );
      }
    }

    const manufacturer = await prisma.manufacturer.create({
      data: { name, country: country || null },
    });
    return NextResponse.json({ manufacturer }, { status: 201 });
  } catch (error) {
    console.error('Admin manufacturers POST error:', error);
    return NextResponse.json({ error: 'Ошибка при создании производителя' }, { status: 500 });
  }
}
