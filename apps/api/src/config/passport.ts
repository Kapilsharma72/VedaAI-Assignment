import type { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as authService from '../services/auth.service';
import env from './env';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setupPassport(app: Express): void {
  app.use(passport.initialize());

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const result = await authService.handleGoogleCallback(profile);
          done(null, result);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );

  app.get(
    '/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }),
  );

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/login?error=oauth_failed',
    }),
    (req: Request, res: Response, _next: NextFunction): void => {
      const { token } = req.user as { token: string };

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE_MS,
        secure: process.env['NODE_ENV'] === 'production',
      });

      res.redirect(`${env.FRONTEND_URL}/assignments`);
    },
  );
}
