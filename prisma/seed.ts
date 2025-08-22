import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed roles
  const admin = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Administrator with full access" },
  });

  const user = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER", description: "Regular user with limited access" },
  });

  // Optionally assign ADMIN role to one or multiple users
  // Supports ADMIN_USER_IDS="id1,id2 id3" (comma or whitespace separated) or legacy ADMIN_USER_ID
  const adminUserIdsEnv = process.env.ADMIN_USER_IDS || process.env.ADMIN_USER_ID || "";
  const adminUserIds = adminUserIdsEnv
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminUserIds.length > 0) {
    for (const uid of adminUserIds) {
      // Use findFirst + create because upsert with a compound unique key does not accept null parts in `where`
      const existing = await prisma.userRole.findFirst({
        where: { userId: uid, roleId: admin.id },
      });
      if (!existing) {
        await prisma.userRole.create({ data: { userId: uid, roleId: admin.id } });
      }
    }
  }

  // Seed default tags dictionary
  const defaultTags = [
    "Experimental",
    "KPI",
    "Banking",
    "Financial",
    "Analytics",
    "Marketing",
    "Sales",
    "Operations",
    "Research",
  ];
  for (const name of defaultTags) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Seed security keys from env variable SECURITY_KEYS_SEED
  // Expected formats (comma or newline separated):
  // - "system_a"
  // - "system_a|Description A"
  // Example: SECURITY_KEYS_SEED="vault_main|Main org vault,internal_n8n|N8N shared key,external_dust|Dust workspace key"
  const securityKeysSeedRaw = (process.env.SECURITY_KEYS_SEED || "").trim();
  if (securityKeysSeedRaw.length > 0) {
    const entries = securityKeysSeedRaw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const entry of entries) {
      const [nameRaw, descriptionRaw] = entry.split("|");
      const systemName = (nameRaw || "").trim();
      const description = (descriptionRaw || "").trim();
      if (!systemName) continue;

      await prisma.securityKey.upsert({
        where: { systemName },
        update: description ? { description } : {},
        create: { systemName, description: description || undefined },
      });
    }
  }

  // Optional: create a demo SecurityKey (legacy toggle)
  if (process.env.SEED_CREATE_SECURITY_KEY === "1") {
    await prisma.securityKey.upsert({
      where: { systemName: "demo-key" },
      update: {},
      create: { systemName: "demo-key", description: "Demo security key" },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


