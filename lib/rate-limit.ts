type RateLimitOptions = {
  windowMs: number;
  max: number;
  blockMs?: number;
};

type RateLimitState = {
  count: number;
  windowStart: number;
  blockedUntil?: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

const storeKey = "__dtk_rate_limit_store__";

function getStore(): Map<string, RateLimitState> {
  const g = globalThis as typeof globalThis & {
    [storeKey]?: Map<string, RateLimitState>;
  };
  if (!g[storeKey]) g[storeKey] = new Map<string, RateLimitState>();
  return g[storeKey]!;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const prior = store.get(key);
  const maxBlockMs = opts.blockMs ?? opts.windowMs;

  if (prior?.blockedUntil) {
    const absoluteMaxBlockedUntil = prior.windowStart + maxBlockMs;
    if (prior.blockedUntil > absoluteMaxBlockedUntil) {
      prior.blockedUntil = absoluteMaxBlockedUntil;
      store.set(key, prior);
    }
  }

  if (prior?.blockedUntil && prior.blockedUntil > now) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((prior.blockedUntil - now) / 1000),
    };
  }

  if (!prior || now - prior.windowStart >= opts.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true, remaining: Math.max(0, opts.max - 1), retryAfterSec: 0 };
  }

  const nextCount = prior.count + 1;
  if (nextCount > opts.max) {
    const blockedUntil = now + (opts.blockMs ?? opts.windowMs);
    store.set(key, { ...prior, count: nextCount, blockedUntil });
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((blockedUntil - now) / 1000),
    };
  }

  store.set(key, { ...prior, count: nextCount });
  return { ok: true, remaining: Math.max(0, opts.max - nextCount), retryAfterSec: 0 };
}
