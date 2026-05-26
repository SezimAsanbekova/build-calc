import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RepairSections, RoomTypes, RoomTypeSections...');

  // ── 1. RepairSections ─────────────────────────────────────────────────────
  const sections = await Promise.all([
    prisma.repairSection.upsert({
      where: { slug: 'walls' },
      update: {},
      create: { name: 'Стены', slug: 'walls', icon: 'Layers', sortOrder: 1 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'floor' },
      update: {},
      create: { name: 'Пол', slug: 'floor', icon: 'PanelBottom', sortOrder: 2 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'ceiling' },
      update: {},
      create: { name: 'Потолок', slug: 'ceiling', icon: 'PanelTop', sortOrder: 3 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'lighting' },
      update: {},
      create: { name: 'Освещение', slug: 'lighting', icon: 'Lightbulb', sortOrder: 4 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'electrical' },
      update: {},
      create: { name: 'Электрика', slug: 'electrical', icon: 'Zap', sortOrder: 5 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'plumbing' },
      update: {},
      create: { name: 'Сантехника', slug: 'plumbing', icon: 'Droplets', sortOrder: 6 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'tiles' },
      update: {},
      create: { name: 'Плитка', slug: 'tiles', icon: 'Grid', sortOrder: 7 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'doors' },
      update: {},
      create: { name: 'Двери', slug: 'doors', icon: 'DoorOpen', sortOrder: 8 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'windows' },
      update: {},
      create: { name: 'Окна', slug: 'windows', icon: 'AppWindow', sortOrder: 9 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'furniture' },
      update: {},
      create: { name: 'Мебель', slug: 'furniture', icon: 'Sofa', sortOrder: 10 },
    }),
    prisma.repairSection.upsert({
      where: { slug: 'decor' },
      update: {},
      create: { name: 'Декор', slug: 'decor', icon: 'Palette', sortOrder: 11 },
    }),
  ]);

  const bySlug = Object.fromEntries(sections.map((s) => [s.slug, s]));
  console.log(`  ✓ ${sections.length} repair sections`);

  // ── 2. RoomTypes ──────────────────────────────────────────────────────────
  const roomTypes = await Promise.all([
    prisma.roomType.upsert({
      where: { slug: 'living_room' },
      update: {},
      create: { name: 'Гостиная', slug: 'living_room', icon: 'Sofa', sortOrder: 1 },
    }),
    prisma.roomType.upsert({
      where: { slug: 'bedroom' },
      update: {},
      create: { name: 'Спальня', slug: 'bedroom', icon: 'BedDouble', sortOrder: 2 },
    }),
    prisma.roomType.upsert({
      where: { slug: 'kitchen' },
      update: {},
      create: { name: 'Кухня', slug: 'kitchen', icon: 'ChefHat', sortOrder: 3 },
    }),
    prisma.roomType.upsert({
      where: { slug: 'bathroom' },
      update: {},
      create: { name: 'Ванная', slug: 'bathroom', icon: 'Bath', sortOrder: 4 },
    }),
    prisma.roomType.upsert({
      where: { slug: 'hallway' },
      update: {},
      create: { name: 'Коридор', slug: 'hallway', icon: 'DoorOpen', sortOrder: 5 },
    }),
    prisma.roomType.upsert({
      where: { slug: 'office' },
      update: {},
      create: { name: 'Кабинет', slug: 'office', icon: 'Briefcase', sortOrder: 6 },
    }),
    prisma.roomType.upsert({
      where: { slug: 'kids_room' },
      update: {},
      create: { name: 'Детская', slug: 'kids_room', icon: 'Gamepad2', sortOrder: 7 },
    }),
    prisma.roomType.upsert({
      where: { slug: 'balcony' },
      update: {},
      create: { name: 'Балкон', slug: 'balcony', icon: 'Flower2', sortOrder: 8 },
    }),
  ]);
  console.log(`  ✓ ${roomTypes.length} room types`);

  // ── 3. RoomTypeSection relations ──────────────────────────────────────────
  const roomSectionMap: Record<string, { slug: string; isDefault: boolean; sortOrder: number }[]> = {
    living_room: [
      { slug: 'walls', isDefault: true, sortOrder: 1 },
      { slug: 'floor', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: true, sortOrder: 3 },
      { slug: 'lighting', isDefault: false, sortOrder: 4 },
      { slug: 'electrical', isDefault: false, sortOrder: 5 },
      { slug: 'doors', isDefault: false, sortOrder: 6 },
      { slug: 'windows', isDefault: false, sortOrder: 7 },
      { slug: 'furniture', isDefault: false, sortOrder: 8 },
      { slug: 'decor', isDefault: false, sortOrder: 9 },
    ],
    bedroom: [
      { slug: 'walls', isDefault: true, sortOrder: 1 },
      { slug: 'floor', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: true, sortOrder: 3 },
      { slug: 'lighting', isDefault: false, sortOrder: 4 },
      { slug: 'electrical', isDefault: false, sortOrder: 5 },
      { slug: 'doors', isDefault: false, sortOrder: 6 },
      { slug: 'windows', isDefault: false, sortOrder: 7 },
      { slug: 'furniture', isDefault: false, sortOrder: 8 },
    ],
    kitchen: [
      { slug: 'walls', isDefault: true, sortOrder: 1 },
      { slug: 'floor', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: true, sortOrder: 3 },
      { slug: 'tiles', isDefault: true, sortOrder: 4 },
      { slug: 'lighting', isDefault: false, sortOrder: 5 },
      { slug: 'electrical', isDefault: false, sortOrder: 6 },
      { slug: 'plumbing', isDefault: false, sortOrder: 7 },
      { slug: 'furniture', isDefault: false, sortOrder: 8 },
    ],
    bathroom: [
      { slug: 'tiles', isDefault: true, sortOrder: 1 },
      { slug: 'plumbing', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: true, sortOrder: 3 },
      { slug: 'lighting', isDefault: false, sortOrder: 4 },
      { slug: 'electrical', isDefault: false, sortOrder: 5 },
      { slug: 'doors', isDefault: false, sortOrder: 6 },
    ],
    hallway: [
      { slug: 'walls', isDefault: true, sortOrder: 1 },
      { slug: 'floor', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: true, sortOrder: 3 },
      { slug: 'lighting', isDefault: false, sortOrder: 4 },
      { slug: 'electrical', isDefault: false, sortOrder: 5 },
      { slug: 'doors', isDefault: false, sortOrder: 6 },
    ],
    office: [
      { slug: 'walls', isDefault: true, sortOrder: 1 },
      { slug: 'floor', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: true, sortOrder: 3 },
      { slug: 'lighting', isDefault: false, sortOrder: 4 },
      { slug: 'electrical', isDefault: false, sortOrder: 5 },
      { slug: 'windows', isDefault: false, sortOrder: 6 },
    ],
    kids_room: [
      { slug: 'walls', isDefault: true, sortOrder: 1 },
      { slug: 'floor', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: true, sortOrder: 3 },
      { slug: 'lighting', isDefault: false, sortOrder: 4 },
      { slug: 'electrical', isDefault: false, sortOrder: 5 },
      { slug: 'furniture', isDefault: false, sortOrder: 6 },
    ],
    balcony: [
      { slug: 'floor', isDefault: true, sortOrder: 1 },
      { slug: 'walls', isDefault: true, sortOrder: 2 },
      { slug: 'ceiling', isDefault: false, sortOrder: 3 },
      { slug: 'windows', isDefault: false, sortOrder: 4 },
    ],
  };

  let relCount = 0;
  for (const rt of roomTypes) {
    const sectionDefs = roomSectionMap[rt.slug] ?? [];
    for (const def of sectionDefs) {
      const section = bySlug[def.slug];
      if (!section) continue;
      await prisma.roomTypeSection.upsert({
        where: { roomTypeId_sectionId: { roomTypeId: rt.id, sectionId: section.id } },
        update: { isDefault: def.isDefault, sortOrder: def.sortOrder },
        create: {
          roomTypeId: rt.id,
          sectionId: section.id,
          isDefault: def.isDefault,
          sortOrder: def.sortOrder,
        },
      });
      relCount++;
    }
  }
  console.log(`  ✓ ${relCount} room-type-section relations`);

  // ── 4. Migrate existing materials: surfaceType → sectionId ────────────────
  const surfaceToSlug: Record<string, string> = {
    wall: 'walls',
    floor: 'floor',
    ceiling: 'ceiling',
  };

  let migrated = 0;
  for (const [surfaceValue, sectionSlug] of Object.entries(surfaceToSlug)) {
    const section = bySlug[sectionSlug];
    if (!section) continue;
    const result = await prisma.material.updateMany({
      where: { surfaceType: surfaceValue as 'wall' | 'floor' | 'ceiling', sectionId: null },
      data: { sectionId: section.id },
    });
    migrated += result.count;
  }
  console.log(`  ✓ ${migrated} existing materials migrated to sectionId`);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
