-- CreateEnum
CREATE TYPE "public"."ToolType" AS ENUM ('HARD_CODED', 'N8N', 'DUST');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_keys" (
    "id" TEXT NOT NULL,
    "system_name" TEXT NOT NULL,
    "description" TEXT,
    "org_id" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tools_registry" (
    "id" TEXT NOT NULL,
    "explicit_call_name" TEXT NOT NULL,
    "readable_name" TEXT NOT NULL,
    "tool_type" "public"."ToolType" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "org_id" TEXT,
    "owner_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hardcoded_tools" (
    "id" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "hardcoded_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."n8n_tools" (
    "id" TEXT NOT NULL,
    "return_direct" BOOLEAN NOT NULL DEFAULT false,
    "is_isolated" BOOLEAN NOT NULL DEFAULT false,
    "stream_if_single_tool" BOOLEAN NOT NULL DEFAULT false,
    "flash_answer_needed" BOOLEAN NOT NULL DEFAULT false,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "external_url" TEXT NOT NULL,
    "security_key_id" TEXT NOT NULL,

    CONSTRAINT "n8n_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dust_tools" (
    "id" TEXT NOT NULL,
    "return_direct" BOOLEAN NOT NULL DEFAULT false,
    "is_isolated" BOOLEAN NOT NULL DEFAULT false,
    "stream_if_single_tool" BOOLEAN NOT NULL DEFAULT false,
    "dust_workspace_sid" TEXT NOT NULL,
    "dust_agent_sid" TEXT NOT NULL,
    "api_timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "message_events_timeout_seconds" INTEGER NOT NULL DEFAULT 180,
    "conversation_events_timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "security_key_id" TEXT NOT NULL,

    CONSTRAINT "dust_tools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_org_id_key" ON "public"."user_roles"("user_id", "role_id", "org_id");

-- CreateIndex
CREATE UNIQUE INDEX "security_keys_system_name_key" ON "public"."security_keys"("system_name");

-- CreateIndex
CREATE UNIQUE INDEX "tools_registry_explicit_call_name_key" ON "public"."tools_registry"("explicit_call_name");

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hardcoded_tools" ADD CONSTRAINT "hardcoded_tools_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."tools_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."n8n_tools" ADD CONSTRAINT "n8n_tools_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."tools_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."n8n_tools" ADD CONSTRAINT "n8n_tools_security_key_id_fkey" FOREIGN KEY ("security_key_id") REFERENCES "public"."security_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dust_tools" ADD CONSTRAINT "dust_tools_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."tools_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dust_tools" ADD CONSTRAINT "dust_tools_security_key_id_fkey" FOREIGN KEY ("security_key_id") REFERENCES "public"."security_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
