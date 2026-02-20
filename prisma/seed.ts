import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  if (existing) {
    console.log("Admin user already exists, skip seed.");
    return;
  }
  const passwordHash = await hash("admin123", 12);
  await prisma.user.create({
    data: {
      email: "admin@relectrikapp.com",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  console.log("Created admin user: admin@relectrikapp.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
