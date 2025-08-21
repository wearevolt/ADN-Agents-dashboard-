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

  // Optional: create a demo SecurityKey
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


