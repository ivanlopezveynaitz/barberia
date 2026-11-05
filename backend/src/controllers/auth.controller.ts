import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword, comparePassword } from '../services/password.service';
import { sendVerificationEmail } from '../services/email.service';
import { generateAccessToken, generateRefreshToken } from '../services/token.service';

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
