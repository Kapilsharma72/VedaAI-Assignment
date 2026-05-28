import http from 'http';
import app from './app';
import env from './config/env';
import { connectDB } from './config/db';
import './config/redis';
import logger from './config/logger';
import { initSockets } from './sockets/index';
import { generationWorker } from './workers/generation.worker';

const httpServer = http.createServer(app);

const io = initSockets(httpServer);

connectDB()
  .then(() => {
    httpServer.listen(env.PORT, () => {
      logger.info({
        message: 'Server is listening',
        port: env.PORT,
        environment: process.env.NODE_ENV ?? 'development',
      });

      logger.info({
        message: 'Generation worker started — consuming "question-generation" queue',
        concurrency: 1,
        workerName: generationWorker.name,
      });
    });
  })
  .catch((err: Error) => {
    logger.error({
      message: 'Failed to connect to MongoDB — server will not start',
      error: err.message,
    });
    process.exit(1);
  });

export { httpServer, io };
