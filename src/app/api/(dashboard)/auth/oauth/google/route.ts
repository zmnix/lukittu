import prisma from '@/lib/database/prisma';
import { createSession } from '@/lib/utils/auth';
import { generateKeyPair } from '@/lib/utils/crypto';
import { logger } from '@/lib/utils/logger';
import { Provider } from '@prisma/client';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

interface IGoogleAuthenticationResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface IGoogleUserResponse {
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
  try {
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
        Accept: 'application/json; charset=utf-8',
        'Accept-Encoding': 'application/json; charset=utf-8',
      },
    });

    if (!accessTokenRes.ok) {
      redirect('/auth/login&error=server_error&provider=google');
    }

    const accessTokenData: IGoogleAuthenticationResponse =
      (await accessTokenRes.json()) as any;

    if (!accessTokenData?.access_token) {
      redirect('/auth/login&error=server_error&provider=google');
    }

    const userRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: 'Bearer ' + accessTokenData.access_token,
          Accept: 'application/json; charset=utf-8',
          'Accept-Encoding': 'application/json; charset=utf-8',
        },
      },
    );

    if (!userRes.ok) {
      redirect('/auth/login&error=server_error&provider=google');
    }

    const user = (await userRes.json()) as IGoogleUserResponse;

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

      const createdSession = await createSession(existingUser.id, true);

      if (!createdSession) {
        redirect('/auth/login?error=server_error&provider=google');
      }

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

      const { privateKey, publicKey } = generateKeyPair();

      await prisma.team.create({
        data: {
          name: 'My first team',
          ownerId: newUser.id,
          privateKeyRsa: privateKey,
          publicKeyRsa: publicKey,
          users: {
            connect: {
              id: newUser.id,
            },
          },
        },
      });

      return newUser;
    });

    const createdSession = await createSession(newUser.id, true);

    if (!createdSession) {
      redirect('/auth/login?error=server_error&provider=google');
    }

    redirect('/dashboard');
  } catch (error) {
    logger.error("Error occurred in 'google' route", error);
    redirect('/auth/login?error=server_error&provider=google');
  }
}
