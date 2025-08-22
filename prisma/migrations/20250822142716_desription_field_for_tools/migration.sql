/*
  Warnings:

  - You are about to drop the column `notes` on the `hardcoded_tools` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."hardcoded_tools" DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "public"."tools_registry" ADD COLUMN     "description" TEXT;
