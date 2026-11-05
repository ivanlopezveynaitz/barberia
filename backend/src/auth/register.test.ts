import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient, cleanDatabase, createTestBarberia } from '../test/setup';
import { hashPassword } from '../services/password.service';

describe('POST /auth/register (RF-001)', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = createPrismaClient();
    await cleanDatabase(prisma);
    await createTestBarberia(prisma, 'barberia-register');
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  it('debe registrar un usuario nuevo asociado a una barbería existente', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'juan@test.com',
        password: 'Password123',
        rol: 'cliente',
        barberiaSlug: 'barberia-register',
      });

    expect(res.status).toBe(201);
    expect(res.body.usuario.email).toBe('juan@test.com');
    expect(res.body.usuario.verificado).toBe(false);
    expect(res.body.usuario.rol).toBe('cliente');
    expect(res.body.usuario.barberiaId).toBeDefined();
    expect(res.body.usuario.password).toBeUndefined();
  });

  it('debe rechazar correo duplicado (409 Conflict)', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'duplicado@test.com',
        password: 'Password123',
        rol: 'cliente',
        barberiaSlug: 'barberia-register',
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        nombre: 'Otro Usuario',
        email: 'duplicado@test.com',
        password: 'Password123',
        rol: 'cliente',
        barberiaSlug: 'barberia-register',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it('debe rechazar barbería inexistente (404 Not Found)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'sinbarberia@test.com',
        password: 'Password123',
        rol: 'cliente',
        barberiaSlug: 'barberia-inexistente',
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('debe rechazar contraseña menor a 8 caracteres', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'corta@test.com',
        password: '12345',
        rol: 'cliente',
        barberiaSlug: 'barberia-register',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
