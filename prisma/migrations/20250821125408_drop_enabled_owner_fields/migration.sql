/*
  Warnings:

  - You are about to drop the column `is_enabled` on the `tools_registry` table. All the data in the column will be lost.
  - You are about to drop the column `owner_user_id` on the `tools_registry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."tools_registry" DROP COLUMN "is_enabled",
DROP COLUMN "owner_user_id";
