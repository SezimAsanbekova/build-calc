-- AlterTable
ALTER TABLE "calculations" ALTER COLUMN "surface_type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "material_alternatives" ADD COLUMN     "cheaper_by" DECIMAL(10,2),
ADD COLUMN     "compatibility_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "section_id" UUID,
ALTER COLUMN "surface_type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "variant_items" ADD COLUMN     "custom_price" DECIMAL(10,2),
ADD COLUMN     "custom_quantity" DOUBLE PRECISION,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_custom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replaced_from_id" UUID;

-- CreateTable
CREATE TABLE "repair_sections" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "is_custom_allowed" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_type_sections" (
    "id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "room_type_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_sections" (
    "id" UUID NOT NULL,
    "calculation_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "calculation_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repair_sections_slug_key" ON "repair_sections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_slug_key" ON "room_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "room_type_sections_room_type_id_section_id_key" ON "room_type_sections"("room_type_id", "section_id");

-- CreateIndex
CREATE INDEX "materials_section_id_idx" ON "materials"("section_id");

-- AddForeignKey
ALTER TABLE "room_type_sections" ADD CONSTRAINT "room_type_sections_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_sections" ADD CONSTRAINT "room_type_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "repair_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_sections" ADD CONSTRAINT "calculation_sections_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_sections" ADD CONSTRAINT "calculation_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "repair_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "repair_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
