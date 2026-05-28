import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import * as authService from '../services/auth.service';
import env from '../config/env';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const registerSchema = Joi.object({
  name:       Joi.string().min(1).max(100).required(),
  email:      Joi.string().email().required(),
  password:   Joi.string().min(8).max(128).required(),
  schoolName: Joi.string().min(1).max(200).required(),
  location:   Joi.string().min(1).max(200).required(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

function validateBody(
  schema: Joi.ObjectSchema,
  data: unknown,
  res: Response,
): boolean {
  const { error } = schema.validate(data, { abortEarly: false });

  if (error) {
    const errors: Record<string, string> = {};
    for (const detail of error.details) {
      const key = detail.path.join('.');
      errors[key] = detail.message.replace(/['"]/g, '');
    }

    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return false;
  }

  return true;
}

router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!validateBody(registerSchema, req.body, res)) return;

    try {
      const { user, token } = await authService.register(req.body);

      res.cookie('token', token, authService.tokenCookieOptions);

      res.status(201).json({
        success: true,
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!validateBody(loginSchema, req.body, res)) return;

    try {
      const { user, token } = await authService.login(req.body);

      res.cookie('token', token, authService.tokenCookieOptions);

      res.status(200).json({
        success: true,
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getMe(req.userId!);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
    secure: env.isProduction,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
