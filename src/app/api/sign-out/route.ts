import prisma from '@/lib/database/prisma';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Workaround to sign out from layout
export async function GET() {
  const sessionId = cookies().get('session')?.value;

  if (sessionId) {
    await prisma.session
      .delete({
        where: { sessionId: sessionId },
      })
      .catch((e) => {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          // If the session does not exist, we can ignore the error
          if (e.code !== 'P2025' && e.code !== 'P2016') {
            throw e;
          }
        }
      });
  }

  cookies().set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  redirect('/auth/login');
}
