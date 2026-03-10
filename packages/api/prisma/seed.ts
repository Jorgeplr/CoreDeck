import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default labels
  const labels = [
    { name: "Bug", color: "#ef4444" },
    { name: "Feature", color: "#3b82f6" },
    { name: "Improvement", color: "#8b5cf6" },
    { name: "Documentation", color: "#6b7280" },
    { name: "Critical", color: "#dc2626" },
  ];

  for (const label of labels) {
    await prisma.label.upsert({
      where: { name: label.name },
      update: {},
      create: label,
    });
  }

  // Default admin user (change password after first login)
  const passwordHash = await bcrypt.hash("CoreDesk@2024!", 12);
  await prisma.user.upsert({
    where: { email: "admin@coredesk.app" },
    update: {},
    create: {
      email: "admin@coredesk.app",
      username: "admin",
      passwordHash,
      displayName: "Admin",
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
