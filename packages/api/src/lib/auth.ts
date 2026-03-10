import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function createRefreshToken(userId: string): Promise<string> {
  const { randomBytes } = await import("crypto");
  const token = randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ userId: string; newToken: string } | null> {
  const record = await prisma.refreshToken.findUnique({ where: { token: oldToken } });

  if (!record || record.revoked || record.expiresAt < new Date()) {
    return null;
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revoked: true },
  });

  const newToken = await createRefreshToken(record.userId);
  return { userId: record.userId, newToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
}

export function setRefreshCookie(res: Response, token: string): Response {
  const expiresMs = REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
  const headers = new Headers(res.headers);
  headers.append(
    "Set-Cookie",
    `refreshToken=${token}; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=${expiresMs / 1000}; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`
  );
  return new Response(res.body, { status: res.status, headers });
}

export function clearRefreshCookie(): string {
  return `refreshToken=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0`;
}
