import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { hashPassword, verifyPassword } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  changePasswordSchema,
  ChangePasswordSchema,
} from '@/lib/validation/profile/change-password-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { Provider } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ChangePasswordResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ChangePasswordResponse>> {
  const body = (await request.json()) as ChangePasswordSchema & {
    token: string;
  };

  const t = await getTranslations({ locale: getLanguage() });
  const validated = await changePasswordSchema(t).safeParseAsync(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        message: validated.error.errors[0].message,
        field: validated.error.errors[0].path[0],
      },
      { status: 400 },
    );
  }

  const { password, newPassword } = body;

  const session = await getSession({ user: true });

  if (!session) {
    return NextResponse.json(
      {
        message: t('validation.unauthorized'),
      },
      { status: 401 },
    );
  }

  if (session.user.provider !== Provider.CREDENTIALS) {
    return NextResponse.json(
      {
        message: t('validation.invalid_provider'),
      },
      { status: 400 },
    );
  }

  const passwordMatch = verifyPassword(password, session.user.passwordHash!);

  if (!passwordMatch) {
    return NextResponse.json(
      {
        message: t('validation.wrong_password'),
        field: 'password',
      },
      { status: 400 },
    );
  }

  const passwordHash = hashPassword(newPassword);

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      passwordHash,
    },
  });

  return NextResponse.json({ success: true });
}
