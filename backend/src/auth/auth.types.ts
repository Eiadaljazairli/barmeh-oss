import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  isAdmin: boolean;
  jti: string;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}
