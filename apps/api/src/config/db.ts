import mongoose from 'mongoose';
import env from './env';
import logger from './logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

mongoose.connection.on('connected', () => {
  logger.info({ message: 'MongoDB connected', uri: env.MONGO_URI.replace(/\/\/.*@/, '//<credentials>@') });
});

mongoose.connection.on('disconnected', () => {
  logger.warn({ message: 'MongoDB disconnected' });
});

mongoose.connection.on('error', (err: Error) => {
  logger.error({ message: 'MongoDB connection error', error: err.message, stack: err.stack });
});

export async function connectDB(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    logger.error({
      message: 'MongoDB connection attempt failed',
      attempt,
      maxRetries: MAX_RETRIES,
      error: error.message,
    });

    if (attempt >= MAX_RETRIES) {
      logger.error({
        message: 'MongoDB connection failed after maximum retries. Giving up.',
        maxRetries: MAX_RETRIES,
      });
      throw error;
    }

    logger.info({
      message: `Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`,
      nextAttempt: attempt + 1,
      maxRetries: MAX_RETRIES,
    });

    await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectDB(attempt + 1);
  }
}
