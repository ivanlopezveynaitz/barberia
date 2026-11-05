import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app } from '../app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient, cleanDatabase, createTestBarberia } from '../test/setup';
import { hashPassword } from '../services/password.service';
import { generateAccessToken } from '../services/token.service';

describe('Usuarios y roles (RF-010, RF-011)', () => {
  let prisma: PrismaClient;
  let superAdminToken: string;
  let adminBarberiaToken: string;
  let barberoToken: string;
  let clienteToken: string;
  let barberiaId: string;
  let usuarioAEditarId: string;

  beforeEach(async () => {
    prisma = createPrismaClient();
    await cleanDatabase(prisma);
    const barberia = await createTestBarberia(prisma, 'barberia-users');
    barberiaId = barberia.id;

    const passwordHash = await hashPassword('Password123');

    const superAdmin = await prisma.usuario.create({
      data: {
        nombre: 'Super Admin',
        email: 'superadmin@test.com',
        password: passwordHash,
        rol: 'superadministrador',
        verificado: true,
      },
    });
    superAdminToken = generateAccessToken(superAdmin.id);

    const adminBarberia = await prisma.usuario.create({
      data: {
        nombre: 'Admin Barbería',
        email: 'admin@test.com',
        password: passwordHash,
        rol: 'administrador_barberia',
        verificado: true,
      },
    });
    await prisma.usuario.update({
      where: { id: adminBarberia.id },
      data: { barberiaId },
    });
    adminBarberiaToken = generateAccessToken(adminBarberia.id);

    const barbero = await prisma.usuario.create({
      data: {
        nombre: 'Barbero',
        email: 'barbero@test.com',
        password: passwordHash,
        rol: 'barbero',
        verificado: true,
      },
    });
    await prisma.usuario.update({
      where: { id: barbero.id },
      data: { barberiaId },
    });
    barberoToken = generateAccessToken(barbero.id);

    const cliente = await prisma.usuario.create({
      data: {
        nombre: 'Cliente',
        email: 'cliente@test.com',
        password: passwordHash,
        rol: 'cliente',
        verificado: true,
      },
    });
    await prisma.usuario.update({
      where: { id: cliente.id },
      data: { barberiaId },
    });
    clienteToken = generateAccessToken(cliente.id);

    const usuarioAEditar = await prisma.usuario.create({
      data: {
        nombre: 'Usuario a Editar',
        email: 'editar@test.com',
        password: passwordHash,
        rol: 'cliente',
        verificado: true,
      },
    });
    await prisma.usuario.update({
      where: { id: usuarioAEditar.id },
      data: { barberiaId },
    });
    usuarioAEditarId = usuarioAEditar.id;
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('GET /users (RF-010)', () => {
    it('debe permitir listar usuarios a superadministrador (200)', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.usuarios)).toBe(true);
      expect(res.body.usuarios.length).toBeGreaterThan(0);
      res.body.usuarios.forEach((u: any) => {
        expect(u.password).toBeUndefined();
      });
    });

    it('debe rechazar listar usuarios a administrador de barbería (403)', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminBarberiaToken}`);

      expect(res.status).toBe(403);
    });

    it('debe rechazar listar usuarios a barbero (403)', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${barberoToken}`);

      expect(res.status).toBe(403);
    });

    it('debe rechazar listar usuarios a cliente (403)', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });

    it('debe rechazar listar usuarios sin token (401)', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /users/:id/role (RF-011)', () => {
    it('debe permitir cambiar rol a superadministrador (200)', async () => {
      const res = await request(app)
        .patch(`/users/${usuarioAEditarId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ rol: 'barbero' });

      expect(res.status).toBe(200);
      expect(res.body.usuario.rol).toBe('barbero');

      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioAEditarId },
      });
      expect(usuario?.rol).toBe('barbero');
    });

    it('debe permitir cambiar rol a administrador de barbería (200)', async () => {
      const res = await request(app)
        .patch(`/users/${usuarioAEditarId}/role`)
        .set('Authorization', `Bearer ${adminBarberiaToken}`)
        .send({ rol: 'recepcion_caja' });

      expect(res.status).toBe(200);
      expect(res.body.usuario.rol).toBe('recepcion_caja');
    });

    it('debe rechazar cambiar rol a barbero (403)', async () => {
      const res = await request(app)
        .patch(`/users/${usuarioAEditarId}/role`)
        .set('Authorization', `Bearer ${barberoToken}`)
        .send({ rol: 'cliente' });

      expect(res.status).toBe(403);
    });

    it('debe rechazar cambiar rol a cliente (403)', async () => {
      const res = await request(app)
        .patch(`/users/${usuarioAEditarId}/role`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ rol: 'cliente' });

      expect(res.status).toBe(403);
    });

    it('debe rechazar cambiar rol sin token (401)', async () => {
      const res = await request(app)
        .patch(`/users/${usuarioAEditarId}/role`)
        .send({ rol: 'cliente' });

      expect(res.status).toBe(401);
    });

    it('debe rechazar rol inválido (400)', async () => {
      const res = await request(app)
        .patch(`/users/${usuarioAEditarId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ rol: 'rol_inexistente' });

      expect(res.status).toBe(400);
    });
  });
});
