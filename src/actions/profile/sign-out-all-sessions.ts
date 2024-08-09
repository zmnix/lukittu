'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';

export default async function signoutAllSessions() {
  const session = await getSession({ user: true });

  await prisma.session.deleteMany({
    where: {
      userId: session.user.id,
      sessionId: {
        not: session.sessionId,
      },
    },
  });

  return {
    isError: false,
  };
}
