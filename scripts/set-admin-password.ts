/**
 * Fija la contraseña del admin a "admin123".
 * Uso: npx tsx scripts/set-admin-password.ts
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@relectrikapp.com";
const NEW_PASSWORD = "admin123";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (!user) {
    console.error("No existe usuario con email:", ADMIN_EMAIL);
    console.log("Créalo con: npm run db:seed");
    process.exit(1);
  }
  const passwordHash = await hash(NEW_PASSWORD, 12);
  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { passwordHash, status: "ACTIVE", role: "ADMIN" },
  });
  console.log("Listo. Contraseña actualizada para", ADMIN_EMAIL);
  console.log("Entra en /admin/login con:");
  console.log("  Email:", ADMIN_EMAIL);
  console.log("  Contraseña:", NEW_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
