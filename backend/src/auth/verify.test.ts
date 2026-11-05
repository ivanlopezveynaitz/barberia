import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { prisma } from '../test/setup';
import { hashPassword } from '../services/password.service';
import { jwt } from '../services/token.service';

describe('GET /auth/verify (RF-007)', () => {
  let verificationToken: string;
  let usuarioId: string;

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

    const passwordHash = await hashPassword('Password123');

    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Usuario No Verificado',
        email: 'noverificado@test.com',
        password: passwordHash,
        rol: 'cliente',
        verificado: false,
      },
    });

    usuarioId = usuario.id;

    // Crear token de verificación válido (1 hora de expiración)
    const token = jwt.sign(
      { sub: usuario.id, type: 'verification' },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: '1h' }
    );

    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.verificationToken.create({
      data: { token, expires, usuarioId: usuario.id },
    });

    verificationToken = token;
  });

  afterEach(async () => {
    await prisma.verificationToken.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.barberia.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debe verificar el usuario con token válido (200 + verificado = true)', async () => {
    const res = await request(app).get(`/auth/verify?token=${verificationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.verificado).toBe(true);

    // Verificar en base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    expect(usuario?.verificado).toBe(true);

    // El token debe haberse eliminado
    const tokenGuardado = await prisma.verificationToken.findUnique({
      where: { token: verificationToken },
    });
    expect(tokenGuardado).toBeNull();
  });

  it('debe rechazar token inexistente (404)', async () => {
    const res = await request(app).get('/auth/verify?token=token-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('debe rechazar token expirado (400)', async () => {
    const tokenExpirado = jwt.sign(
      { sub: usuarioId, type: 'verification' },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: '-1h' } // ya expirado
    );

    const expires = new Date();
    expires.setHours(expires.getHours() - 1);

    await prisma.verificationToken.create({
      data: { token: tokenExpirado, expires, usuarioId },
    });

    const res = await request(app).get(`/auth/verify?token=${tokenExpirado}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
