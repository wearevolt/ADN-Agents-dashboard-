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

  // Optionally assign ADMIN role to a user if ADMIN_USER_ID env is provided
  const adminUserId = process.env.ADMIN_USER_ID;
  if (adminUserId) {
    await prisma.userRole.upsert({
      where: { userId_roleId_orgId: { userId: adminUserId, roleId: admin.id, orgId: null } },
      update: {},
      create: { userId: adminUserId, roleId: admin.id, orgId: null },
    });
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


