import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient, cleanDatabase, createTestBarberia } from '../test/setup';
import { hashPassword } from '../services/password.service';
import { generateAccessToken } from '../services/token.service';

describe('Middleware auth (RF-004)', () => {
  let prisma: PrismaClient;
  let accessToken: string;
  let usuarioId: string;

  beforeEach(async () => {
    prisma = createPrismaClient();
    await cleanDatabase(prisma);
    await createTestBarberia(prisma, 'barberia-middleware');

    const passwordHash = await hashPassword('Password123');

    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Usuario Test',
        email: 'test@test.com',
        password: passwordHash,
        rol: 'cliente',
        verificado: true,
      },
    });
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { barberiaId: undefined },
    });

    usuarioId = usuario.id;
    accessToken = generateAccessToken(usuario.id);
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  it('debe rechazar petición sin token (401 Unauthorized)', async () => {
    const res = await request(app).get('/auth/test-me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('debe rechazar token inválido (401 Unauthorized)', async () => {
    const res = await request(app)
      .get('/auth/test-me')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  it('debe autenticar usuario con token válido (200 + usuario en req)', async () => {
    const res = await request(app)
      .get('/auth/test-me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.id).toBe(usuarioId);
    expect(res.body.usuario.email).toBe('test@test.com');
    expect(res.body.usuario.password).toBeUndefined();
  });
});

describe('Middleware role (RF-005)', () => {
  let prisma2: PrismaClient;
  let adminToken: string;
  let clienteToken: string;

  beforeEach(async () => {
    prisma2 = createPrismaClient();
    await cleanDatabase(prisma2);
    await createTestBarberia(prisma2, 'barberia-middleware-role');

    const passwordHash = await hashPassword('Password123');

    const admin = await prisma2.usuario.create({
      data: {
        nombre: 'Admin',
        email: 'admin@test.com',
        password: passwordHash,
        rol: 'administrador_barberia',
        verificado: true,
      },
    });

    const cliente = await prisma2.usuario.create({
      data: {
        nombre: 'Cliente',
        email: 'cliente@test.com',
        password: passwordHash,
        rol: 'cliente',
        verificado: true,
      },
    });

    adminToken = generateAccessToken(admin.id);
    clienteToken = generateAccessToken(cliente.id);
  });

  afterEach(async () => {
    await cleanDatabase(prisma2);
    await prisma2.$disconnect();
  });

  it('debe permitir acceso a rol autorizado (administrador_barberia)', async () => {
    const res = await request(app)
      .get('/auth/test-admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('debe rechazar acceso a rol no autorizado (cliente → 403 Forbidden)', async () => {
    const res = await request(app)
      .get('/auth/test-admin-only')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });
});
