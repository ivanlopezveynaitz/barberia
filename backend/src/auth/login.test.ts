import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient, cleanDatabase, createTestBarberia } from '../test/setup';
import { hashPassword } from '../services/password.service';

describe('POST /auth/login (RF-002)', () => {
  let prisma: PrismaClient;

  const usuarioData = {
    nombre: 'Juan Pérez',
    email: 'juan@test.com',
    password: 'Password123',
    rol: 'cliente' as const,
    barberiaSlug: 'barberia-login',
  };

  let barberiaId: string;

  beforeEach(async () => {
    prisma = createPrismaClient();
    await cleanDatabase(prisma);
    const barberia = await createTestBarberia(prisma, 'barberia-login');
    barberiaId = barberia.id;

    const passwordHash = await hashPassword(usuarioData.password);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: usuarioData.nombre,
        email: usuarioData.email,
        password: passwordHash,
        rol: usuarioData.rol,
        verificado: false,
      },
    });

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { barberiaId },
    });
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  it('debe rechazar credenciales incorrectas (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'juan@test.com', password: 'WrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('debe rechazar correo no verificado (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'juan@test.com', password: 'Password123' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it('debe iniciar sesión exitosamente con correo verificado (200 + JWT + refresh token cookie)', async () => {
    await prisma.usuario.update({
      where: { email: usuarioData.email },
      data: { verificado: true },
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: usuarioData.email, password: usuarioData.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.email).toBe(usuarioData.email);
    expect(res.body.usuario.password).toBeUndefined();

    const setCookie = res.headers['set-cookie'] as string[];
    const refreshCookie = setCookie.find((c) => c.startsWith('refresh_token='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('Path=/');
  });
});
