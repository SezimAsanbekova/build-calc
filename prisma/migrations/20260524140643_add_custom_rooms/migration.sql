-- CreateTable
CREATE TABLE "custom_rooms" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(10),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_rooms_user_id_idx" ON "custom_rooms"("user_id");

-- AddForeignKey
ALTER TABLE "custom_rooms" ADD CONSTRAINT "custom_rooms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
