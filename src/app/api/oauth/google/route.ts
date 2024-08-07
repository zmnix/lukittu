import prisma from '@/lib/database/prisma';
import { createSession } from '@/lib/utils/auth';
import { Provider } from '@prisma/client';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

interface GoogleAuthRes {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserRes {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code || typeof code !== 'string') {
    redirect('/auth/login');
  }

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
    grant_type: 'authorization_code',
  });

  const formattedUrl =
    'https://oauth2.googleapis.com/token?' + params.toString();

  const accessTokenRes = await fetch(formattedUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',

      // Accept back utf-8 encoded JSON
      Accept: 'application/json; charset=utf-8',
      'Accept-Encoding': 'application/json; charset=utf-8',
    },
  });

  if (!accessTokenRes.ok) {
    redirect('/auth/login&error=server_error&provider=google');
  }

  const accessTokenData: GoogleAuthRes = (await accessTokenRes.json()) as any;

  if (!accessTokenData?.access_token) {
    redirect('/auth/login&error=server_error&provider=google');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: 'Bearer ' + accessTokenData.access_token,
      Accept: 'application/json; charset=utf-8',
      'Accept-Encoding': 'application/json; charset=utf-8',
    },
  });

  if (!userRes.ok) {
    redirect('/auth/login&error=server_error&provider=google');
  }

  const user = (await userRes.json()) as GoogleUserRes;

  if (!user.email_verified) {
    redirect('/auth/login?error=unverified_email&provider=google');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (existingUser) {
    if (existingUser.provider !== Provider.GOOGLE) {
      redirect(
        `/auth/login?error=wrong_provider&provider=${existingUser.provider.toLowerCase()}`,
      );
    }

    await createSession(existingUser.id, true);

    redirect('/dashboard');
  }

  const newUser = await prisma.$transaction(async (prisma) => {
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        fullName: user.name,
        provider: Provider.GOOGLE,
        emailVerified: true,
      },
    });

    await prisma.team.create({
      data: {
        name: 'My first team',
        ownerId: newUser.id,
        users: {
          connect: {
            id: newUser.id,
          },
        },
      },
    });

    return newUser;
  });

  await createSession(newUser.id, true);

  redirect('/dashboard');
}
