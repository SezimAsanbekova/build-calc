import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        roomTypeSections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            section: {
              select: { id: true, name: true, slug: true, icon: true },
            },
          },
        },
      },
    });

    const result = roomTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      slug: rt.slug,
      icon: rt.icon,
      isCustomAllowed: rt.isCustomAllowed,
      sections: rt.roomTypeSections.map((rts) => ({
        ...rts.section,
        isDefault: rts.isDefault,
        sortOrder: rts.sortOrder,
      })),
    }));

    return NextResponse.json({ roomTypes: result });
  } catch (error) {
    console.error('RoomTypes GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
