import { PrismaClient } from "../src/generated/prisma";
import { runSeed } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  await runSeed(prisma);
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
