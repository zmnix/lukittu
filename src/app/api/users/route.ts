import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  UpdateProfileSchema,
  updateProfileSchema,
} from '@/lib/validation/profile/update-profile-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type UpdateProfileResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function PATCH(
  request: NextRequest,
): Promise<NextResponse<UpdateProfileResponse>> {
  const body = (await request.json()) as UpdateProfileSchema;
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await updateProfileSchema(t).safeParseAsync(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        message: validated.error.errors[0].message,
        field: validated.error.errors[0].path[0],
      },
      { status: 400 },
    );
  }

  const session = await getSession({ user: true });

  if (!session) {
    return NextResponse.json(
      {
        message: t('validation.unauthorized'),
      },
      { status: 401 },
    );
  }

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      fullName: body.fullName,
    },
  });

  return NextResponse.json({ success: true });
}
