import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { prisma } from '../test/setup';
import { hashPassword } from '../services/password.service';

describe('POST /auth/login (RF-002)', () => {
  const usuarioData = {
    nombre: 'Juan Pérez',
    email: 'juan@test.com',
    password: 'Password123',
    rol: 'cliente' as const,
    barberiaSlug: 'barberia-central',
  };

  let barberiaId: string;

  beforeEach(async () => {
    const barberia = await prisma.barberia.create({
      data: {
        nombre: 'Barbería Central',
        slug: 'barberia-central',
        direccion: 'Calle Falsa 123',
        telefono: '555-0199',
        activo: true,
      },
    });
    barberiaId = barberia.id;

    const passwordHash = await hashPassword(usuarioData.password);

    await prisma.usuario.create({
      data: {
        nombre: usuarioData.nombre,
        email: usuarioData.email,
        password: passwordHash,
        rol: usuarioData.rol,
        barberiaId,
        verificado: false,
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
    // Marcar usuario como verificado
    await prisma.usuario.update({
      where: { email: usuarioData.email },
      data: { verificado: true },
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: usuarioData.email, password: usuarioData.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined(); // JWT de acceso
    expect(res.body.usuario.email).toBe(usuarioData.email);
    expect(res.body.usuario.password).toBeUndefined();

    // Refresh token en cookie httpOnly
    const setCookie = res.headers['set-cookie'] as string[];
    const refreshCookie = setCookie.find((c) => c.startsWith('refresh_token='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('Path=/');
  });
});
