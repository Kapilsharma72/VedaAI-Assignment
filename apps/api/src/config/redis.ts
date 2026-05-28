import Redis from 'ioredis';
import env from './env';
import logger from './logger';
const redis = new Redis(env.REDIS_URL);
redis.on('connect', () => {
    logger.info('Redis client connecting');
});
redis.on('ready', () => {
    logger.info('Redis client ready');
});
redis.on('error', (err: Error) => {
    logger.error('Redis client error', { error: err.message });
});
redis.on('close', () => {
    logger.warn('Redis client connection closed');
});
redis.on('reconnecting', () => {
    logger.warn('Redis client reconnecting');
});
export default redis;
