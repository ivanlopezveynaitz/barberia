import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * RF-004: Autenticación de peticiones.
 * Verifica JWT válido en header Authorization: Bearer <token>.
 * Extrae el usuario autenticado y lo adjunta a req.usuario.
 * Sin token → 401 Unauthorized.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de acceso requerido' });
    return;
  }

  const token = authHeader.substring(7); // quitar "Bearer "

  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      verificado: true,
      barberiaId: true,
    },
  });

  if (!usuario) {
    res.status(401).json({ error: 'Usuario no encontrado' });
    return;
  }

  req.usuario = usuario;
  next();
}

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        nombre: string;
        email: string;
        rol: string;
        verificado: boolean;
        barberiaId?: string;
      };
    }
  }
}
