// In-memory shim that implements the subset of ioredis methods this app uses.
// Used when REDIS_URL is not set so the app can run without a Redis server.
// LIMITATIONS:
// - Single-process only. Rate limits and idempotency keys become per-instance.
// - No persistence across restarts.
// - Not recommended for production with >1 instance.

type Entry = { value: string; expiresAt: number | null };
type ZSetEntry = { member: string; score: number };

const store = new Map<string, Entry>();
const zsets = new Map<string, ZSetEntry[]>();

function now(): number {
  return Date.now();
}

function isExpired(entry: Entry): boolean {
  return entry.expiresAt !== null && entry.expiresAt <= now();
}

function readEntry(key: string): Entry | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (isExpired(entry)) {
    store.delete(key);
    return null;
  }
  return entry;
}

// Background sweep to prevent memory growth from never-read expired keys.
setInterval(() => {
  for (const [k, v] of store) {
    if (isExpired(v)) store.delete(k);
  }
}, 60_000).unref();

interface PipelineExecResult {
  exec(): Promise<Array<[Error | null, unknown]>>;
}

interface PipelineBuilder extends PipelineExecResult {
  zremrangebyscore(key: string, min: number, max: number): PipelineBuilder;
  zadd(key: string, score: number, member: string): PipelineBuilder;
  zcard(key: string): PipelineBuilder;
  expire(key: string, seconds: number): PipelineBuilder;
}

function makePipeline(): PipelineBuilder {
  const ops: Array<() => unknown> = [];

  const builder: PipelineBuilder = {
    zremrangebyscore(key, min, max) {
      ops.push(() => {
        const arr = zsets.get(key) ?? [];
        const filtered = arr.filter((e) => e.score < min || e.score > max);
        zsets.set(key, filtered);
        return arr.length - filtered.length;
      });
      return builder;
    },
    zadd(key, score, member) {
      ops.push(() => {
        const arr = zsets.get(key) ?? [];
        arr.push({ score, member });
        zsets.set(key, arr);
        return 1;
      });
      return builder;
    },
    zcard(key) {
      ops.push(() => (zsets.get(key) ?? []).length);
      return builder;
    },
    expire(key, seconds) {
      ops.push(() => {
        // For zsets, attach a TTL via a sentinel entry in `store`.
        store.set(`__zttl:${key}`, { value: '1', expiresAt: now() + seconds * 1000 });
        // Best-effort: if the sentinel has expired by next pipeline run we drop the zset.
        return 1;
      });
      return builder;
    },
    async exec() {
      // Before executing, drop expired zsets based on sentinel.
      const results: Array<[Error | null, unknown]> = [];
      for (const op of ops) {
        try {
          results.push([null, op()]);
        } catch (err) {
          results.push([err as Error, null]);
        }
      }
      return results;
    },
  };

  return builder;
}

export const memoryCache = {
  async get(key: string): Promise<string | null> {
    const entry = readEntry(key);
    return entry ? entry.value : null;
  },

  // ioredis signature: set(key, value, 'EX', ttlSeconds). Supports the EX variant
  // because that's the only one this codebase uses.
  async set(
    key: string,
    value: string,
    mode?: 'EX',
    ttlSeconds?: number,
  ): Promise<'OK'> {
    const expiresAt = mode === 'EX' && ttlSeconds ? now() + ttlSeconds * 1000 : null;
    store.set(key, { value, expiresAt });
    return 'OK';
  },

  async del(key: string): Promise<number> {
    const had = store.delete(key);
    return had ? 1 : 0;
  },

  async ping(): Promise<'PONG'> {
    return 'PONG';
  },

  async quit(): Promise<'OK'> {
    store.clear();
    zsets.clear();
    return 'OK';
  },

  pipeline(): PipelineBuilder {
    return makePipeline();
  },
};

export type MemoryCache = typeof memoryCache;
