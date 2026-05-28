import type { RedisOptions } from 'ioredis';
import env from './env';

export function getRedisOptions(): RedisOptions {
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    retryStrategy: (times) => Math.min(times * 200, 3000),
  };

  if (env.REDIS_URL.startsWith('rediss://')) {
    options.tls = { rejectUnauthorized: false };
  }

  return options;
}

export function getBullMQConnection(): RedisOptions & { url: string } {
  return {
    url: env.REDIS_URL,
    ...getRedisOptions(),
  };
}
