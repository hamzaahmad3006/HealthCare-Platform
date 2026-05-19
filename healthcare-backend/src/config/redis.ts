import Redis from 'ioredis';
import { env } from './env';

const createRedisClient = (): Redis => {
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
};

export const redis = createRedisClient();
