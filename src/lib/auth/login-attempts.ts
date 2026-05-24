const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 12;
const LOCK_MS = 10 * 60 * 1000;

type Entry = { failures: number; windowStart: number; lockUntil?: number };

const attempts = new Map<string, Entry>();

export function clientKeyFromHeaders(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function isLoginIpLocked(ip: string): boolean {
  const e = attempts.get(ip);
  if (!e?.lockUntil) return false;
  const now = Date.now();
  if (now >= e.lockUntil) {
    attempts.delete(ip);
    return false;
  }
  return true;
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  let e = attempts.get(ip);
  if (!e) {
    attempts.set(ip, { failures: 1, windowStart: now });
    return;
  }
  if (e.lockUntil && now < e.lockUntil) return;
  if (e.lockUntil && now >= e.lockUntil) {
    attempts.set(ip, { failures: 1, windowStart: now });
    return;
  }
  if (now - e.windowStart > WINDOW_MS) {
    e.failures = 1;
    e.windowStart = now;
    delete e.lockUntil;
  } else {
    e.failures += 1;
  }
  if (e.failures >= MAX_FAILURES) {
    e.lockUntil = now + LOCK_MS;
  }
  attempts.set(ip, e);
}

export function clearLoginFailures(ip: string): void {
  attempts.delete(ip);
}
