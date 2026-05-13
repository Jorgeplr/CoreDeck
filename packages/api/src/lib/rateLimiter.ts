import { Redis } from "@upstash/redis";

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;
const keyPrefix = process.env.RATE_LIMIT_PREFIX ?? "rate";

// Purge stale buckets every 10 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

export async function checkRateLimit(
  key: string,
  maxAttempts = 10,
  windowMs = 60_000
): Promise<boolean> {
  if (redis) {
    const redisKey = `${keyPrefix}:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }
    return count <= maxAttempts;
  }

  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxAttempts) return false;
  bucket.count++;
  return true;
}
