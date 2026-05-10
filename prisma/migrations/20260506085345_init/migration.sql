/*
  Warnings:

  - Added the required column `account_id` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "account_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "budgets_account_id_idx" ON "budgets"("account_id");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
