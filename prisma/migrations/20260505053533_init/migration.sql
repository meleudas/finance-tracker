/*
  Warnings:

  - You are about to drop the column `url` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `recurring_rules` table. All the data in the column will be lost.
  - Added the required column `name` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency_id` to the `recurring_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency_id` to the `recurring_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `recurring_rules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurringIntervalUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "url",
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "currencies" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recurring_rules" DROP COLUMN "frequency",
ADD COLUMN     "currency_id" TEXT NOT NULL,
ADD COLUMN     "frequency_id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transfers" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropEnum
DROP TYPE "RecurringFrequency";

-- CreateTable
CREATE TABLE "recurring_frequencies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "every" INTEGER NOT NULL DEFAULT 1,
    "unit" "RecurringIntervalUnit" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "recurring_frequencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_frequencies_user_id_is_deleted_idx" ON "recurring_frequencies"("user_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_frequencies_user_id_name_is_deleted_key" ON "recurring_frequencies"("user_id", "name", "is_deleted");

-- CreateIndex
CREATE INDEX "recurring_rules_currency_id_idx" ON "recurring_rules"("currency_id");

-- CreateIndex
CREATE INDEX "recurring_rules_frequency_id_idx" ON "recurring_rules"("frequency_id");

-- AddForeignKey
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_frequency_id_fkey" FOREIGN KEY ("frequency_id") REFERENCES "recurring_frequencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_frequencies" ADD CONSTRAINT "recurring_frequencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
