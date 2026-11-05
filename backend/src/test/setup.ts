import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function truncateTables() {
  // Orden importa por las claves foráneas
  await prisma.passwordResetToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.barberia.deleteMany();
}
