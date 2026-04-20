import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 12);
  const editorHash = await bcrypt.hash("editor123", 12);
  const readerHash = await bcrypt.hash("reader123", 12);

  await prisma.user.upsert({
    where: { email: "admin@familytree.local" },
    update: {},
    create: { email: "admin@familytree.local", passwordHash: adminHash, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "editor@familytree.local" },
    update: {},
    create: { email: "editor@familytree.local", passwordHash: editorHash, role: "EDITOR" },
  });

  await prisma.user.upsert({
    where: { email: "reader@familytree.local" },
    update: {},
    create: { email: "reader@familytree.local", passwordHash: readerHash, role: "READER" },
  });

  console.log("Seed réussi. Comptes créés :");
  console.log("  admin@familytree.local / admin123");
  console.log("  editor@familytree.local / editor123");
  console.log("  reader@familytree.local / reader123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
