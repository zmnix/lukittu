import { PrismaClient } from '@prisma/client';
import 'server-only';

declare global {
  // eslint-disable-next-line no-unused-vars
  var prisma:
    | PrismaClient<{
        omit: {
          user: {
            passwordHash: true;
          };
          session: {
            sessionId: true;
          };
          team: {
            privateKeyRsa: true;
          };
        };
      }>
    | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    omit: {
      user: {
        passwordHash: true,
      },
      session: {
        sessionId: true,
      },
      team: {
        privateKeyRsa: true,
      },
    },
  });

if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;
