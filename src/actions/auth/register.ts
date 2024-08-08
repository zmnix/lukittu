'use server';
import prisma from '@/lib/database/prisma';
import { hashPassword } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import { sendEmail } from '@/lib/utils/nodemailer';
import {
  RegisterSchema,
  registerSchema,
} from '@/lib/validation/auth/register-schema';
import { JwtTypes } from '@/types/jwt-types-enum';
import { Provider } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getTranslations } from 'next-intl/server';

export default async function register({
  email,
  password,
  fullName,
  terms,
}: RegisterSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await registerSchema(t).safeParseAsync({
    email,
    password,
    fullName,
    terms,
  });

  if (!validated.success) {
    return {
      isError: true,
      message: validated.error.errors[0].message,
      field: validated.error.errors[0].path[0],
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.provider !== Provider.CREDENTIALS) {
    return {
      isError: true,
      message: t('general.wrong_provider', {
        provider: t(`auth.oauth.${existingUser.provider.toLowerCase()}` as any),
      }),
    };
  }

  if (existingUser && existingUser.emailVerified) {
    return {
      isError: true,
      message: t('auth.register.email_already_in_use'),
      field: 'email',
    };
  }

  if (existingUser && !existingUser.emailVerified) {
    return {
      isError: true,
      reverifyEmail: true,
    };
  }

  const passwordHash = hashPassword(password);

  const user = await prisma.$transaction(async (prisma) => {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
      },
    });

    await prisma.team.create({
      data: {
        name: 'My first team',
        ownerId: user.id,
        users: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return user;
  });

  const token = jwt.sign(
    {
      userId: user.id,
      type: JwtTypes.NEW_ACCOUNT_EMAIL_VERIFICATION,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '30m',
    },
  );

  const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${token}`;

  const success = await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
            <p>
                Welcome to our app! To get started, please verify your email address by clicking the link below.
            </p>
            <a href="${verifyLink}">Verify email address</a>
        `,
  });

  if (!success) {
    return {
      isError: true,
      message: t('auth.emails.sending_failed_title'),
    };
  }

  return {
    isError: false,
  };
}
