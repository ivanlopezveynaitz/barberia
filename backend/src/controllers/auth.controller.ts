import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword, comparePassword } from '../services/password.service';
import { sendVerificationEmail, transporter } from '../services/email.service';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, ACCESS_SECRET } from '../services/token.service';

const prisma = new PrismaClient();

/**
 * RF-001: Registro de usuario asociado a barbería.
 * Valida que el correo no exista, que la barbería exista, y que la contraseña tenga al menos 8 caracteres.
 * La contraseña se hashea con bcrypt. El usuario se crea sin verificar (verificado = false).
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { nombre, email, password, rol, barberiaSlug } = req.body as {
    nombre: string;
    email: string;
    password: string;
    rol: string;
    barberiaSlug: string;
  };

  // Validación: contraseña mínima 8 caracteres
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    return;
  }

  // Validación: barbería existente
  const barberia = await prisma.barberia.findUnique({
    where: { slug: barberiaSlug },
  });

  if (!barberia) {
    res.status(404).json({ error: 'Barbería no encontrada' });
    return;
  }

  // Validación: correo duplicado
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    return;
  }

  // Hashear contraseña
  const passwordHash = await hashPassword(password);

  // Crear usuario sin verificar
  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: passwordHash,
      rol,
      barberiaId: barberia.id,
      verificado: false,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      verificado: true,
      barberiaId: true,
      createdAt: true,
      // password se excluye deliberadamente (nunca se devuelve en texto plano)
    },
  });

  // Generar token de verificación y enviarlo por correo (RF-007)
  // Fire-and-forget: el registro no espera al envío de correo
  sendVerificationEmail(usuario).catch(() => {
    // No fallar el registro si el correo falla; el usuario puede solicitar reenvío
  });

  res.status(201).json({ usuario, message: 'Usuario registrado. Verifica tu correo electrónico.' });
}

/**
 * RF-007: Verificación de correo electrónico.
 * - Token válido → marca usuario como verificado, elimina el token
 * - Token expirado → 400
 * - Token inexistente → 404
 */
export async function verify(req: Request, res: Response): Promise<void> {
  const { token } = req.query as { token: string };

  if (!token) {
    res.status(400).json({ error: 'Token de verificación requerido' });
    return;
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!verificationToken) {
    res.status(404).json({ error: 'Token de verificación no encontrado' });
    return;
  }

  // Verificar que no haya expirado
  if (verificationToken.expires < new Date()) {
    res.status(400).json({ error: 'Token expirado. Solicita uno nuevo.' });
    return;
  }

  // Marcar usuario como verificado
  await prisma.usuario.update({
    where: { id: verificationToken.usuarioId },
    data: { verificado: true },
  });

  // Eliminar el token usado
  await prisma.verificationToken.delete({
    where: { token },
  });

  res.status(200).json({
    verificado: true,
    message: 'Correo electrónico verificado exitosamente',
  });
}

/**
 * RF-009: Reset de contraseña — solicitar.
 * - Email existente → genera PasswordResetToken, envía por correo (fire-and-forget)
 * - Email inexistente → 200 (seguridad: no revelar si el usuario existe)
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };

  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuario) {
    const token = jwt.sign(
      { sub: usuario.id, type: 'password_reset' },
      ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: { token, expires, usuarioId: usuario.id },
    });

    // Enviar correo con el token (fire-and-forget, Mailpit en desarrollo)
    transporter.sendMail({
      from: `"Barbería" <${process.env.MAIL_FROM || 'no-reply@barberia.local'}>`,
      to: usuario.email,
      subject: 'Restablecer tu contraseña',
      text: `Hola ${usuario.nombre}, usa este token para restablecer tu contraseña: ${token}`,
      html: `<p>Hola ${usuario.nombre},</p><p>Usa este token para restablecer tu contraseña: <code>${token}</code></p><p>Expira en 1 hora.</p>`,
    }).catch(() => {
      // No fallar si el correo no se puede enviar
    });
  }

  // Siempre devolver 200 por seguridad (no revelar si el email existe)
  res.status(200).json({
    message: 'Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu contraseña.',
  });
}

/**
 * RF-009: Reset de contraseña — establecer nueva.
 * - Token válido + contraseña >= 8 chars → actualiza contraseña, elimina token
 * - Token expirado → 400
 * - Token inexistente → 404
 * - Contraseña corta → 400
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, nuevaContraseña } = req.body as {
    token: string;
    nuevaContraseña: string;
  };

  if (!nuevaContraseña || nuevaContraseña.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    return;
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!resetToken) {
    res.status(404).json({ error: 'Token de restablecimiento no encontrado' });
    return;
  }

  if (resetToken.expires < new Date()) {
    res.status(400).json({ error: 'Token expirado. Solicita uno nuevo.' });
    return;
  }

  const passwordHash = await hashPassword(nuevaContraseña);

  await prisma.usuario.update({
    where: { id: resetToken.usuarioId },
    data: { password: passwordHash },
  });

  await prisma.passwordResetToken.delete({
    where: { token },
  });

  res.status(200).json({
    message: 'Contraseña restablecida exitosamente',
  });
}

/**
 * RF-002: Inicio de sesión.
 * - Credenciales incorrectas → 401
 * - Correo no verificado → 403
 * - Exitoso → JWT de acceso (24h) + refresh token en cookie httpOnly
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  // Buscar usuario
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { barberia: true },
  });

  if (!usuario) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  // Verificar contraseña
  const passwordValida = await comparePassword(password, usuario.password);
  if (!passwordValida) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  // Verificar que el correo esté verificado
  if (!usuario.verificado) {
    res.status(403).json({ error: 'Correo electrónico pendiente de verificación' });
    return;
  }

  // Generar JWT de acceso (24h)
  const accessToken = generateAccessToken(usuario.id);

  // Generar refresh token y almacenarlo
  const refreshToken = await generateRefreshToken(usuario.id);

  // Cookie httpOnly para refresh token
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });

  // Devolver usuario sin contraseña
  const { password: _, ...usuarioSinPassword } = usuario;

  res.status(200).json({
    token: accessToken,
    usuario: usuarioSinPassword,
    message: 'Inicio de sesión exitoso',
  });
}
