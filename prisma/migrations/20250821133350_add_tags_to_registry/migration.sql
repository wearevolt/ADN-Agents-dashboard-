-- AlterTable
ALTER TABLE "public"."tools_registry" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
