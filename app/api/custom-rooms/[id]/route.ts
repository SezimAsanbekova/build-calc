import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.customRoom.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const name = (body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const updated = await prisma.customRoom.update({
    where: { id },
    data: {
      name,
      icon: body.icon?.trim() || null,
      description: body.description?.trim() || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.customRoom.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.customRoom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
