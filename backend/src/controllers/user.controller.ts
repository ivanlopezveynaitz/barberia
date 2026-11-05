import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { puedeAsignarRoles } from '../middleware/role.middleware';

const prisma = new PrismaClient();

const ROLES_VALIDOS = [
  'superadministrador',
  'administrador_barberia',
  'barbero',
  'recepcion_caja',
  'cliente',
];

/**
 * RF-010: Listar usuarios.
 * Solo accesible por superadministrador.
 * Nunca devuelve contraseñas.
 */
export async function listUsers(req: Request, res: Response): Promise<void> {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      verificado: true,
      barberiaId: true,
      createdAt: true,
      // password se excluye deliberadamente
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ usuarios });
}

/**
 * RF-011: Cambiar rol de usuario.
 * Solo accesible por superadministrador y administrador de barbería.
 */
export async function changeRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { rol } = req.body as { rol: string };
  const usuarioAutenticado = req.usuario!;

  // Validar rol entrante
  if (!ROLES_VALIDOS.includes(rol)) {
    res.status(400).json({ error: 'Rol inválido' });
    return;
  }

  // Verificar que el usuario autenticado puede asignar roles
  if (!puedeAsignarRoles(usuarioAutenticado)) {
    res.status(403).json({ error: 'No tienes permisos para asignar roles' });
    return;
  }

  // Buscar usuario objetivo
  const usuarioObjetivo = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuarioObjetivo) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  // Actualizar rol
  const usuarioActualizado = await prisma.usuario.update({
    where: { id },
    data: { rol },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      barberiaId: true,
    },
  });

  res.status(200).json({
    usuario: usuarioActualizado,
    message: 'Rol actualizado exitosamente',
  });
}
