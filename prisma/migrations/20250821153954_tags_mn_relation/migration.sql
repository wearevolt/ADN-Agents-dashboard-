/*
  Warnings:

  - You are about to drop the column `tags` on the `tools_registry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."tools_registry" DROP COLUMN "tags";

-- CreateTable
CREATE TABLE "public"."tools_registry_tags" (
    "tool_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "tools_registry_tags_pkey" PRIMARY KEY ("tool_id","tag_id")
);

-- AddForeignKey
ALTER TABLE "public"."tools_registry_tags" ADD CONSTRAINT "tools_registry_tags_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "public"."tools_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tools_registry_tags" ADD CONSTRAINT "tools_registry_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
