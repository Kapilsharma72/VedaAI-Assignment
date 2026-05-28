import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { IUser, RegisterDto, LoginDto } from '@vedaai/shared';
import { User, type IUserDocument } from '../models/user.model';
import env from '../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
}

const BCRYPT_COST = 10;
const JWT_EXPIRY = '7d';
const JWT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function toIUser(doc: IUserDocument): IUser {
  const obj = doc.toObject({ versionKey: false });
  return {
    _id: obj._id.toString(),
    name: obj.name,
    email: obj.email,
    password: obj.password ?? null,
    schoolName: obj.schoolName,
    location: obj.location,
    googleId: obj.googleId ?? null,
    avatar: obj.avatar ?? null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function register(
  dto: RegisterDto,
): Promise<{ user: IUser; token: string }> {
  const existing = await User.findOne({ email: dto.email.toLowerCase() });
  if (existing) {
    throw new ConflictError('An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);

  const doc = await User.create({
    name: dto.name,
    email: dto.email.toLowerCase(),
    password: hashedPassword,
    schoolName: dto.schoolName,
    location: dto.location,
  });

  const token = signToken(doc._id.toString());
  return { user: toIUser(doc), token };
}

export async function login(
  dto: LoginDto,
): Promise<{ user: IUser; token: string }> {
  const doc = await User.findOne({ email: dto.email.toLowerCase() });

  const invalidCredentials = new UnauthorizedError('Invalid email or password.');

  if (!doc) throw invalidCredentials;
  if (!doc.password) throw invalidCredentials;

  const passwordMatch = await bcrypt.compare(dto.password, doc.password);
  if (!passwordMatch) throw invalidCredentials;

  const token = signToken(doc._id.toString());
  return { user: toIUser(doc), token };
}

export async function handleGoogleCallback(
  profile: GoogleProfile,
): Promise<{ user: IUser; token: string }> {
  const email = profile.emails?.[0]?.value?.toLowerCase() ?? '';
  const avatar = profile.photos?.[0]?.value ?? null;
  const name = profile.displayName || 'Google User';

  let doc = await User.findOne({ googleId: profile.id });

  if (!doc && email) {
    doc = await User.findOne({ email });
    if (doc) {
      doc.googleId = profile.id;
      if (!doc.avatar && avatar) doc.avatar = avatar;
      await doc.save();
    }
  }

  if (!doc) {
    doc = await User.create({
      name,
      email,
      password: null,
      schoolName: '',
      location: '',
      googleId: profile.id,
      avatar,
    });
  }

  const token = signToken(doc._id.toString());
  return { user: toIUser(doc), token };
}

export function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token.');
  }
}

export async function getMe(userId: string): Promise<IUser> {
  const doc = await User.findById(userId);
  if (!doc) throw new NotFoundError('User not found.');
  return toIUser(doc);
}

/** Cross-origin frontends (e.g. Vercel) require SameSite=None cookies on the API domain. */
export const tokenCookieOptions = {
  httpOnly: true,
  sameSite: (env.isProduction ? 'none' : 'lax') as 'lax' | 'none',
  path: '/',
  maxAge: JWT_MAX_AGE_SECONDS * 1000,
  secure: env.isProduction,
};
