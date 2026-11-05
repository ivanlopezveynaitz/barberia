import { Router } from 'express';
import { register, login, verify } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verify);

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
