import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { prisma } from '../test/setup';

describe('POST /auth/register (RF-001)', () => {
  beforeEach(async () => {
    // Barbería de prueba — debe existir antes de registrar usuarios (principio de aislamiento)
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
    await prisma.passwordResetToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.barberia.deleteMany();
  });

  afterAll(async () => {
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
        barberiaSlug: 'barberia-central',
      });

    expect(res.status).toBe(201);
    expect(res.body.usuario.email).toBe('juan@test.com');
    expect(res.body.usuario.verificado).toBe(false);
    expect(res.body.usuario.rol).toBe('cliente');
    expect(res.body.usuario.barberiaId).toBeDefined();
    // La contraseña nunca se devuelve en texto plano (principio de dinero/seguridad)
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
        barberiaSlug: 'barberia-central',
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        nombre: 'Otro Usuario',
        email: 'duplicado@test.com',
        password: 'Password123',
        rol: 'cliente',
        barberiaSlug: 'barberia-central',
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
        barberiaSlug: 'barberia-central',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
