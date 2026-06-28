import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const env = process.env;
const SECRET = env["JWT_SECRET"] ?? "cluster-dev-secret-change-me";
const EXPIRES = "7d";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; plan: string };
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: { id: string; email: string; plan: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, plan: user.plan }, SECRET, {
    expiresIn: EXPIRES,
  });
}

export function verifyToken(token: string): { sub: string; email: string; plan: string } {
  return jwt.verify(token, SECRET) as { sub: string; email: string; plan: string };
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email, plan: payload.plan };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      req.user = { id: payload.sub, email: payload.email, plan: payload.plan };
    } catch {
      /* ignore */
    }
  }
  next();
}
