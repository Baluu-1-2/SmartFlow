import jwt, { SignOptions } from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
