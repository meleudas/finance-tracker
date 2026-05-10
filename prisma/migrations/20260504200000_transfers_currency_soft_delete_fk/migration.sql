-- Drop FKs (children before parents) to alter enums and columns
ALTER TABLE "attachments" DROP CONSTRAINT IF EXISTS "attachments_transaction_id_fkey";
ALTER TABLE "recurring_rules" DROP CONSTRAINT IF EXISTS "recurring_rules_category_id_fkey";
ALTER TABLE "recurring_rules" DROP CONSTRAINT IF EXISTS "recurring_rules_account_id_fkey";
ALTER TABLE "recurring_rules" DROP CONSTRAINT IF EXISTS "recurring_rules_user_id_fkey";
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_category_id_fkey";
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_currency_id_fkey";
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_user_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_category_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_account_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_fkey";
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_parent_id_fkey";
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_user_id_fkey";
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_currency_id_fkey";
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_user_id_fkey";

-- Remove BOTH from CategoryKind (migrate existing rows)
UPDATE "categories" SET "kind" = 'EXPENSE' WHERE "kind"::text = 'BOTH';

ALTER TYPE "CategoryKind" RENAME TO "CategoryKind_old";
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE');
ALTER TABLE "categories" ALTER COLUMN "kind" TYPE "CategoryKind" USING ("kind"::text::"CategoryKind");
DROP TYPE "CategoryKind_old";

-- Transaction stores currency (denormalized / explicit FX context)
ALTER TABLE "transactions" ADD COLUMN "currency_id" TEXT;

UPDATE "transactions" AS t
SET "currency_id" = a."currency_id"
FROM "accounts" AS a
WHERE t."account_id" = a."id";

ALTER TABLE "transactions" ALTER COLUMN "currency_id" SET NOT NULL;

CREATE INDEX "transactions_currency_id_idx" ON "transactions"("currency_id");

-- Transfers between accounts (same user; enforced in app layer)
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_account_id" TEXT NOT NULL,
    "to_account_id" TEXT NOT NULL,
    "currency_id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transfers_distinct_accounts" CHECK ("from_account_id" <> "to_account_id")
);

CREATE INDEX "transfers_user_id_is_deleted_occurred_at_idx" ON "transfers"("user_id", "is_deleted", "occurred_at");
CREATE INDEX "transfers_from_account_id_idx" ON "transfers"("from_account_id");
CREATE INDEX "transfers_to_account_id_idx" ON "transfers"("to_account_id");

-- FKs: soft-delete policy — no ON DELETE CASCADE / SET NULL (use RESTRICT)
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attachments" ADD CONSTRAINT "attachments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
