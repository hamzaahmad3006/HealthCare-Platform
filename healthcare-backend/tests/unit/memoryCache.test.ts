import { memoryCache } from '../../src/config/memoryCache';

describe('memoryCache', () => {
  beforeEach(async () => {
    await memoryCache.quit();
  });

  describe('get/set/del', () => {
    it('round-trips a string value', async () => {
      await memoryCache.set('k', 'v');
      expect(await memoryCache.get('k')).toBe('v');
    });

    it('returns null for missing keys', async () => {
      expect(await memoryCache.get('missing')).toBeNull();
    });

    it('expires values after TTL', async () => {
      jest.useFakeTimers();
      await memoryCache.set('temp', 'value', 'EX', 1);
      expect(await memoryCache.get('temp')).toBe('value');
      jest.advanceTimersByTime(1500);
      expect(await memoryCache.get('temp')).toBeNull();
      jest.useRealTimers();
    });

    it('del removes a key', async () => {
      await memoryCache.set('k', 'v');
      const removed = await memoryCache.del('k');
      expect(removed).toBe(1);
      expect(await memoryCache.get('k')).toBeNull();
    });

    it('del returns 0 for missing key', async () => {
      expect(await memoryCache.del('missing')).toBe(0);
    });
  });

  describe('ping', () => {
    it('replies PONG', async () => {
      expect(await memoryCache.ping()).toBe('PONG');
    });
  });

  describe('pipeline (sorted set for rate limiter)', () => {
    it('zadd then zcard reports the count', async () => {
      const p = memoryCache.pipeline();
      p.zadd('rl', 100, 'a').zadd('rl', 200, 'b').zcard('rl');
      const results = await p.exec();
      expect(results[2]?.[1]).toBe(2);
    });

    it('zremrangebyscore removes entries in range', async () => {
      const seed = memoryCache.pipeline();
      seed.zadd('rl', 100, 'a').zadd('rl', 200, 'b').zadd('rl', 300, 'c');
      await seed.exec();

      const removal = memoryCache.pipeline();
      removal.zremrangebyscore('rl', 0, 200).zcard('rl');
      const results = await removal.exec();
      // After removing scores 0..200 (inclusive), only 'c' (score 300) remains.
      expect(results[1]?.[1]).toBe(1);
    });
  });
});
