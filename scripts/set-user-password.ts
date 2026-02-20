/**
 * Sets password for a user by email.
 * Usage: npx tsx scripts/set-user-password.ts <email> <new-password>
 * Example: npx tsx scripts/set-user-password.ts fitmast11@gmail.com newpassword123
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = process.argv[2];
const NEW_PASSWORD = process.argv[3];

async function main() {
  if (!EMAIL || !NEW_PASSWORD) {
    console.error("Usage: npx tsx scripts/set-user-password.ts <email> <new-password>");
    console.error("Example: npx tsx scripts/set-user-password.ts fitmast11@gmail.com newpassword123");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
  });
  
  if (!user) {
    console.error(`User with email "${EMAIL}" not found.`);
    process.exit(1);
  }

  const passwordHash = await hash(NEW_PASSWORD, 12);
  // Update only passwordHash to avoid trigger/column name issues
  await prisma.$executeRaw`
    UPDATE "User"
    SET "passwordHash" = ${passwordHash}
    WHERE email = ${EMAIL}
  `;
  
  console.log(`Password updated for ${EMAIL}`);
  console.log(`Email: ${EMAIL}`);
  console.log(`Password: ${NEW_PASSWORD}`);
  console.log(`\nYou can now sign in at /tech/login with these credentials.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
