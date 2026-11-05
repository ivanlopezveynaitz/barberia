import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

/**
 * Genera JWT de acceso con expiración de 24 horas (RF-002, RF-004).
 */
export function generateAccessToken(usuarioId: string): string {
  return jwt.sign({ sub: usuarioId, type: 'access' }, ACCESS_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

/**
 * Genera refresh token y lo almacena en la base de datos.
 */
export async function generateRefreshToken(usuarioId: string): Promise<string> {
  const token = jwt.sign({ sub: usuarioId, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  await prisma.verificationToken.create({
    // Reutilizamos VerificationToken para almacenar refresh tokens (simplicidad ciclo 001)
    data: {
      token,
      expires,
      usuarioId,
    },
  });

  return token;
}

/**
 * Genera token de verificación de correo (RF-007).
 */
export async function generateVerificationToken(usuarioId: string): Promise<string> {
  const token = jwt.sign({ sub: usuarioId, type: 'verification' }, ACCESS_SECRET, {
    expiresIn: '1h',
  });

  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  await prisma.verificationToken.create({
    data: {
      token,
      expires,
      usuarioId,
    },
  });

  return token;
}

/**
 * Verifica un token de acceso JWT.
 */
export function verifyAccessToken(token: string): { sub: string; type: string } | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as { sub: string; type: string };
  } catch {
    return null;
  }
}
