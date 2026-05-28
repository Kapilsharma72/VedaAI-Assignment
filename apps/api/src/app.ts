import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import logger from './config/logger';
import uploadRouter from './routes/upload.routes';
import authRouter from './routes/auth.routes';
import paperRouter from './routes/paper.routes';
import assignmentRouter from './routes/assignment.routes';
import { setupPassport } from './config/passport';
import { HttpError } from './utils/errors';

const app = express();

app.use(helmet());

const frontendUrl = process.env['FRONTEND_URL'];

if (!frontendUrl || frontendUrl.trim() === '') {
  logger.warn(
    'FRONTEND_URL environment variable is not set. ' +
      'All cross-origin requests will be denied.',
  );
}

app.use(
  cors({
    origin: frontendUrl && frontendUrl.trim() !== '' ? frontendUrl : false,
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      const retryAfter = Math.ceil(
        (res.getHeader('RateLimit-Reset') as number) - Date.now() / 1000,
      );
      res.setHeader('Retry-After', retryAfter > 0 ? retryAfter : 1);
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    },
  }),
);

app.use((req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
    });
  });

  next();
});

app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/assignments', paperRouter);

setupPassport(app);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  logger.error('Unhandled error', { error: err });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
