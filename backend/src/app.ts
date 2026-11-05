import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rate limiting general (RF-008 se refina en rutas específicas)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'barberia-backend' });
});

// Rutas de autenticación
app.use('/auth', authRoutes);
