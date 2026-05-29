import { Redis } from 'ioredis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }
  return redisInstance;
}

export function createConnection(): Redis {
  return new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
}
