import "server-only";
import { setDefaultResultOrder } from "node:dns";
import { Prisma, PrismaClient } from "@src/generated/prisma";

// Neon publica AAAA; en redes (sobre todo Windows) el TCP a :5432 por IPv6
// falla y Prisma agota el connect_timeout con "Can't reach database server".
setDefaultResultOrder("ipv4first");

const SOFT_DELETE_REVISION = 1;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSoftDeleteRevision?: number;
};

function mentionsDeletedAt(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(mentionsDeletedAt);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "deletedAt") return true;
    if (child && typeof child === "object" && mentionsDeletedAt(child)) return true;
  }
  return false;
}

function activeWhere<T>(where: T): T {
  if (mentionsDeletedAt(where)) return where;
  if (!where || (typeof where === "object" && Object.keys(where as object).length === 0)) {
    return { deletedAt: null } as T;
  }
  return { AND: [where, { deletedAt: null }] } as T;
}

function aspiranteNotFound(): never {
  throw new Prisma.PrismaClientKnownRequestError("No Aspirante found", {
    code: "P2025",
    clientVersion: Prisma.prismaVersion.client,
  });
}

function withDeletedFlag<T extends { select?: object | null }>(args: T): T {
  if (!args.select || "deletedAt" in args.select) return args;
  return { ...args, select: { ...args.select, deletedAt: true } };
}

function hideDeleted(
  result: unknown,
  args: { select?: object | null },
  orThrow: boolean,
): unknown {
  if (!result || typeof result !== "object") return result;
  const row = result as { deletedAt?: Date | null };
  if (row.deletedAt) {
    if (orThrow) aspiranteNotFound();
    return null;
  }
  if (args.select && !("deletedAt" in args.select)) {
    const copy = { ...row };
    delete copy.deletedAt;
    return copy;
  }
  return result;
}

function createPrisma(): PrismaClient {
  const client = new PrismaClient({
    log: ["error"],
  }).$extends({
    query: {
      aspirante: {
        async findMany({ args, query }) {
          args.where = activeWhere(args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = activeWhere(args.where);
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          args.where = activeWhere(args.where);
          return query(args);
        },
        async count({ args, query }) {
          args.where = activeWhere(args.where);
          return query(args);
        },
        async groupBy({ args, query }) {
          args.where = activeWhere(args.where);
          return query(args);
        },
        async aggregate({ args, query }) {
          args.where = activeWhere(args.where);
          return query(args);
        },
        async findUnique({ args, query }) {
          const original = args;
          return hideDeleted(await query(withDeletedFlag(args)), original, false) as Awaited<
            ReturnType<typeof query>
          >;
        },
        async findUniqueOrThrow({ args, query }) {
          const original = args;
          return hideDeleted(await query(withDeletedFlag(args)), original, true) as Awaited<
            ReturnType<typeof query>
          >;
        },
      },
    },
  });

  return client as unknown as PrismaClient;
}

export const prisma =
  globalForPrisma.prismaSoftDeleteRevision === SOFT_DELETE_REVISION && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSoftDeleteRevision = SOFT_DELETE_REVISION;
}
