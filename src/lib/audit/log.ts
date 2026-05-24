import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type AuditWriteInput = {
  userId: string;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/** Registro asíncrono de auditoría; no interrumpe la acción principal si falla. */
export async function writeAuditLog(input: AuditWriteInput): Promise<void> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? null;
    const userAgent = h.get("user-agent") ?? null;
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userEmail: input.userEmail ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
        ip,
        userAgent,
      },
    });
  } catch (e) {
    console.error("[audit]", e);
  }
}
