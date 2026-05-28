import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function readToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return req.cookies?.token;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = readToken(req);

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;
    req.userId = String(payload.sub);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token has expired' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
