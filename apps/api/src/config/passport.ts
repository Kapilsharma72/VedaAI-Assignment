import type { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as authService from '../services/auth.service';
import env from './env';
export function setupPassport(app: Express): void {
    app.use(passport.initialize());
    const googleCallbackUrl = `${env.API_URL}/api/auth/google/callback`;
    passport.use(new GoogleStrategy({
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: googleCallbackUrl,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const result = await authService.handleGoogleCallback(profile);
            done(null, result);
        }
        catch (err) {
            done(err as Error);
        }
    }));
    app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    app.get('/api/auth/google/callback', passport.authenticate('google', {
        session: false,
        failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed`,
    }), (req: Request, res: Response, _next: NextFunction): void => {
        const { token } = req.user as {
            token: string;
        };
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: env.isProduction ? 'none' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: env.isProduction,
        });
        const callbackUrl = new URL('/auth/callback', env.FRONTEND_URL);
        callbackUrl.searchParams.set('token', token);
        res.redirect(callbackUrl.toString());
    });
}
