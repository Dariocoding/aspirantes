import { defineConfig } from "prisma/config";

// Solo útil en local (.env.local). En Docker/Coolify DATABASE_URL ya viene del entorno.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require("dotenv") as typeof import("dotenv");
  dotenv.config({ path: ".env.local" });
} catch {
  // dotenv ausente en imagen standalone — OK
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] as string,
  },
});
