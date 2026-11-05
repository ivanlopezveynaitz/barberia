import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { prisma } from '../test/setup';
import { hashPassword } from '../services/password.service';
import { jwt } from '../services/token.service';

describe('Reset de contraseña (RF-009)', () => {
  let passwordHash: string;

  beforeEach(async () => {
    await prisma.barberia.create({
      data: {
        nombre: 'Barbería Central',
        slug: 'barberia-central',
        direccion: 'Calle Falsa 123',
        telefono: '555-0199',
        activo: true,
      },
    });

    passwordHash = await hashPassword('Password123');

    await prisma.usuario.create({
      data: {
        nombre: 'Usuario Test',
        email: 'usuario@test.com',
        password: passwordHash,
        rol: 'cliente',
        verificado: true,
      },
    });
  });

  afterEach(async () => {
    await prisma.passwordResetToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.barberia.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debe solicitar reset de contraseña para email existente (200)', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'usuario@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();

    // Verificar que se creó un PasswordResetToken
    const tokenGuardado = await prisma.passwordResetToken.findFirst({
      where: { usuario: { email: 'usuario@test.com' } },
    });
    expect(tokenGuardado).toBeDefined();
    expect(tokenGuardado!.expires.getTime()).toBeGreaterThan(Date.now());
  });

  it('debe devolver 200 incluso si el email no existe (seguridad: no revelar usuarios)', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'noexiste@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('debe restablecer contraseña con token válido (200)', async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'usuario@test.com' },
    });

    const token = jwt.sign(
      { sub: usuario!.id, type: 'password_reset' },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: '1h' }
    );

    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: { token, expires, usuarioId: usuario!.id },
    });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token, nuevaContraseña: 'NuevaClave123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();

    // Verificar que la contraseña se actualizó (el usuario puede hacer login con la nueva)
    const usuarioActualizado = await prisma.usuario.findUnique({
      where: { email: 'usuario@test.com' },
    });
    expect(usuarioActualizado).toBeDefined();
    // El hash debería ser diferente al original
    expect(usuarioActualizado?.password).not.toBe(passwordHash);
  });

  it('debe rechazar token expirado en reset (400)', async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'usuario@test.com' },
    });

    const tokenExpirado = jwt.sign(
      { sub: usuario!.id, type: 'password_reset' },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: '-1h' }
    );

    const expires = new Date();
    expires.setHours(expires.getHours() - 1);

    await prisma.passwordResetToken.create({
      data: { token: tokenExpirado, expires, usuarioId: usuario!.id },
    });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: tokenExpirado, nuevaContraseña: 'NuevaClave123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('debe rechazar contraseña menor a 8 caracteres en reset (400)', async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'usuario@test.com' },
    });

    const token = jwt.sign(
      { sub: usuario!.id, type: 'password_reset' },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: '1h' }
    );

    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: { token, expires, usuarioId: usuario!.id },
    });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token, nuevaContraseña: 'corta' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
