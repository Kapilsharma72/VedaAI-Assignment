import type { RedisOptions } from 'ioredis';
import env from './env';

export function getRedisOptions(): RedisOptions {
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  if (env.REDIS_URL.startsWith('rediss://')) {
    options.tls = { rejectUnauthorized: false };
  }

  return options;
}

export function getBullMQConnection(): { url: string } & RedisOptions {
  return {
    url: env.REDIS_URL,
    ...getRedisOptions(),
  };
}
