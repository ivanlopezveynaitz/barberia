import rateLimit from 'express-rate-limit';

/**
 * RF-008: Rate limiting en endpoints de autenticación.
 * Límite más estricto para evitar fuerza bruta en login y registro.
 * 5 intentos por ventana de 15 minutos por IP.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.' },
});
