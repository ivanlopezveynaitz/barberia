import { PrismaClient } from '@prisma/client';

export function createPrismaClient() {
  return new PrismaClient();
}

export async function cleanDatabase(prisma: PrismaClient) {
  // TRUNCATE CASCADE respeta todas las claves foráneas de forma automática
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "PasswordResetToken", "VerificationToken", "Usuario", "Barberia" RESTART IDENTITY CASCADE'
  );
}

export async function createTestBarberia(prisma: PrismaClient, slug: string) {
  return prisma.barberia.create({
    data: {
      nombre: 'Barbería Central',
      slug,
      direccion: 'Calle Falsa 123',
      telefono: '555-0199',
      activo: true,
    },
  });
}
