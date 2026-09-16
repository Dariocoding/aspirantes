import "server-only";
import { setDefaultResultOrder } from "node:dns";
import { PrismaClient } from "@src/generated/prisma";

// Neon publica AAAA; en redes (sobre todo Windows) el TCP a :5432 por IPv6
// falla y Prisma agota el connect_timeout con "Can't reach database server".
setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
