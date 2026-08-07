import { PrismaClient } from '@prisma/client';

// Di dev, Next.js hot-reload bikin modul dievaluasi ulang berkali-kali.
// Tanpa cache global, tiap reload membuka koneksi baru sampai kehabisan.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
