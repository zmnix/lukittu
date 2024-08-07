'use server';
import prisma from '@/lib/database/prisma';
import { cookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

export default async function signOut() {
  const sessionId = cookies().get('session')?.value;

  if (sessionId) {
    await prisma.session.delete({
      where: { sessionId: sessionId },
    });

    cookies().set('session', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  redirect('/auth/login', RedirectType.replace);
}
