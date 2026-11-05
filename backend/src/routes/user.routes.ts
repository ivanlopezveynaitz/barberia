import { Router } from 'express';
import { listUsers, changeRole } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();

// RF-010: Listar usuarios (solo superadministrador)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['superadministrador']),
  listUsers
);

// RF-011: Cambiar rol (solo superadministrador y administrador de barbería)
router.patch(
  '/:id/role',
  authMiddleware,
  roleMiddleware(['superadministrador', 'administrador_barberia']),
  changeRole
);

export default router;
