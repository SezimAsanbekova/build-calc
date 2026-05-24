import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') ?? '';
    const categoryId = searchParams.get('categoryId') ?? '';
    const manufacturerId = searchParams.get('manufacturerId') ?? '';
    const repairLevel = searchParams.get('repairLevel') ?? '';
    const surfaceType = searchParams.get('surfaceType') ?? '';
    const minPrice = parseFloat(searchParams.get('minPrice') ?? '0') || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice') ?? '0') || 0;
    const sortBy = searchParams.get('sortBy') ?? 'name_asc';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1);
    const pageSize = 12;

    const where: Record<string, unknown> = {
      isActive: true,
      isAvailable: true,
      deletedAt: null,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) where.categoryId = categoryId;
    if (manufacturerId) where.manufacturerId = manufacturerId;
    if (repairLevel) where.repairLevel = repairLevel;
    if (surfaceType) where.surfaceType = surfaceType;
    if (minPrice > 0 || maxPrice > 0) {
      where.price = {
        ...(minPrice > 0 ? { gte: minPrice } : {}),
        ...(maxPrice > 0 ? { lte: maxPrice } : {}),
      };
    }

    const orderBy =
      sortBy === 'price_asc'
        ? { price: 'asc' as const }
        : sortBy === 'price_desc'
        ? { price: 'desc' as const }
        : sortBy === 'name_desc'
        ? { name: 'desc' as const }
        : { name: 'asc' as const };

    const [total, materials, categories, manufacturers] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true } },
          manufacturer: { select: { id: true, name: true, country: true } },
          properties: { select: { name: true, value: true } },
        },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.manufacturer.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const formatted = materials.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      price: parseFloat(m.price.toString()),
      unit: m.unit,
      packageQuantity: parseFloat(m.packageQuantity.toString()),
      packageUnit: m.packageUnit,
      consumptionPerM2: parseFloat(m.consumptionPerM2.toString()),
      wasteFactor: parseFloat(((m as unknown as { wasteFactor?: unknown }).wasteFactor?.toString()) ?? '1.1'),
      stockQuantity: m.stockQuantity,
      description: m.description,
      imageUrl: m.imageUrl,
      repairLevel: m.repairLevel,
      surfaceType: m.surfaceType,
      category: m.category,
      manufacturer: m.manufacturer,
      properties: m.properties,
    }));

    return NextResponse.json({
      materials: formatted,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      categories,
      manufacturers,
    });
  } catch (error) {
    console.error('Catalog error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
