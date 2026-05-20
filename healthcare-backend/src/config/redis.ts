import Redis from 'ioredis';
import { env } from './env';
import { memoryCache, type MemoryCache } from './memoryCache';

// When REDIS_URL is set, exports a real ioredis client. When it isn't, exports
// the in-memory shim that implements the methods this app uses. See
// memoryCache.ts for the supported subset and limitations.

export type RedisLike = Redis | MemoryCache;

function createClient(): RedisLike {
  if (!env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set — using in-memory cache (single-process only)');
    return memoryCache;
  }

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  client.on('connect', () => console.log('✅ Redis connected'));
  client.on('error', (err: Error) => console.error('❌ Redis error:', err.message));
  client.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));

  return client;
}

export const redis = createClient();

export const usingRedis = Boolean(env.REDIS_URL);
