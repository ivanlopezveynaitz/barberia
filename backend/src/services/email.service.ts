import nodemailer from 'nodemailer';
import { prisma } from '../test/setup';
import { generateVerificationToken } from './token.service';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  connectionTimeout: 5000, // 5 segundos timeout para evitar bloquear tests
});

/**
 * RF-007: Envía token de verificación por correo (Mailpit en desarrollo).
 * El correo nunca se envía a direcciones reales desde desarrollo.
 */
export async function sendVerificationEmail(usuario: {
  id: string;
  email: string;
  nombre: string;
}): Promise<void> {
  const token = await generateVerificationToken(usuario.id);

  const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'Barbería'}" <${process.env.MAIL_FROM || 'no-reply@barberia.local'}>`,
    to: usuario.email,
    subject: 'Verifica tu correo electrónico',
    text: `Hola ${usuario.nombre}, haz clic en el siguiente enlace para verificar tu cuenta: ${verificationUrl}`,
    html: `<p>Hola ${usuario.nombre},</p><p>Haz clic en <a href="${verificationUrl}">este enlace</a> para verificar tu cuenta.</p>`,
  });
}
