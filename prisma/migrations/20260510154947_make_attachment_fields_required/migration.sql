/*
  Warnings:

  - Made the column `storage_key` on table `attachments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mime_type` on table `attachments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `original_name` on table `attachments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "attachments" ALTER COLUMN "storage_key" SET NOT NULL,
ALTER COLUMN "mime_type" SET NOT NULL,
ALTER COLUMN "original_name" SET NOT NULL;
