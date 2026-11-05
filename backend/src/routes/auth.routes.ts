import { Router } from 'express';
import { register, login, verify, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { authRateLimit } from '../middleware/rate-limit.auth.middleware';

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/verify', verify);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);

// Endpoints de prueba para validar middlewares (RF-004, RF-005)
router.get('/test-me', authMiddleware, (req, res) => {
  res.json({ usuario: req.usuario });
});

router.get(
  '/test-admin-only',
  authMiddleware,
  roleMiddleware(['superadministrador', 'administrador_barberia']),
  (req, res) => {
    try {
      res.json({ acceso: 'concedido', rol: req.usuario?.rol });
    } catch (err) {
      res.status(500).json({ error: 'Error interno', detalle: String(err) });
    }
  }
);

export default router;
