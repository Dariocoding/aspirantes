import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Acepta `Authorization: Bearer …` o header `x-cron-secret`. */
export function autorizarCron(request: Request): boolean {
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) return false;

  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token && safeEqual(token, secreto)) return true;
  }

  const header = request.headers.get("x-cron-secret")?.trim();
  if (header && safeEqual(header, secreto)) return true;

  return false;
}
