import { prisma } from "@src/lib/prisma";
import { runSeed } from "../../prisma/seed-data";

let initialized = false;

export async function ensureSeedData() {
  if (initialized) return;
  await runSeed(prisma);
  initialized = true;
}
