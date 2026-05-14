-- CreateTable
CREATE TABLE "admin_telegram_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_telegram_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_telegram_codes_user_id_idx" ON "admin_telegram_codes"("user_id");
