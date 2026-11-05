import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { prisma } from '../test/setup';

describe('Rate limiting (RF-008)', () => {
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
  });

  afterEach(async () => {
    await prisma.usuario.deleteMany();
    await prisma.barberia.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debe aplicar rate limit en POST /auth/register (429 tras exceder intentos)', async () => {
    // Hacer múltiples registros fallidos (barbería no existe o datos inválidos)
    const respuestas = [];
    for (let i = 0; i < 8; i++) {
      const res = await request(app)
        .post('/auth/register')
        .send({
          nombre: 'Usuario',
          email: `usuario${i}@test.com`,
          password: '123', // contraseña inválida (< 8 chars)
          rol: 'cliente',
          barberiaSlug: 'barberia-central',
        });
      respuestas.push(res.status);
    }

    // Al menos una respuesta debe ser 429 (rate limit)
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
