/*
  Warnings:

  - You are about to drop the column `org_id` on the `security_keys` table. All the data in the column will be lost.
  - You are about to drop the column `org_id` on the `tools_registry` table. All the data in the column will be lost.
  - You are about to drop the column `org_id` on the `user_roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,role_id]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."user_roles_user_id_role_id_org_id_key";

-- AlterTable
ALTER TABLE "public"."security_keys" DROP COLUMN "org_id";

-- AlterTable
ALTER TABLE "public"."tools_registry" DROP COLUMN "org_id";

-- AlterTable
ALTER TABLE "public"."user_roles" DROP COLUMN "org_id";

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "public"."user_roles"("user_id", "role_id");
