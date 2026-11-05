import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient, cleanDatabase, createTestBarberia } from '../test/setup';

describe('Rate limiting (RF-008)', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = createPrismaClient();
    await cleanDatabase(prisma);
    await createTestBarberia(prisma, 'barberia-ratelimit');
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  it('debe aplicar rate limit en POST /auth/register (429 tras exceder intentos)', async () => {
    const respuestas = [];
    for (let i = 0; i < 8; i++) {
      const res = await request(app)
        .post('/auth/register')
        .send({
          nombre: 'Usuario',
          email: `usuario${i}@test.com`,
          password: '123',
          rol: 'cliente',
          barberiaSlug: 'barberia-ratelimit',
        });
      respuestas.push(res.status);
    }

    const tieneRateLimit = respuestas.some((status) => status === 429);
    expect(tieneRateLimit).toBe(true);
  });

  it('debe aplicar rate limit en POST /auth/login (429 tras exceder intentos)', async () => {
    const respuestas = [];
    for (let i = 0; i < 8; i++) {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: `usuario${i}@test.com`, password: 'WrongPassword123' });
      respuestas.push(res.status);
    }

    const tieneRateLimit = respuestas.some((status) => status === 429);
    expect(tieneRateLimit).toBe(true);
  });
});
