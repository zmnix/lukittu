/* eslint-disable no-unused-vars */
import { PrismaClient } from '@prisma/client';
import 'server-only';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;
