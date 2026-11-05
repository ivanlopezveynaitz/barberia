import { Request, Response, NextFunction } from 'express';

/**
 * RF-005: Autorización por rol.
 * Declara los roles permitidos para un endpoint.
 * Si el usuario no tiene el rol requerido → 403 Forbidden.
 *
 * Solo 'superadministrador' y 'administrador_barberia' pueden crear/asignar roles.
 */
export function roleMiddleware(rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = req.usuario;

    if (!usuario) {
      res.status(401).json({ error: 'Autenticación requerida' });
      return;
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      res.status(403).json({
        error: 'No tienes permisos para acceder a este recurso',
        rolRequerido: rolesPermitidos,
        rolUsuario: usuario.rol,
      });
      return;
    }

    next();
  };
}

/**
 * Verifica si el usuario puede crear/asignar roles a otros usuarios.
 * Solo superadministrador y administrador de barbería.
 */
export function puedeAsignarRoles(usuario: { rol: string }): boolean {
  return usuario.rol === 'superadministrador' || usuario.rol === 'administrador_barberia';
}
