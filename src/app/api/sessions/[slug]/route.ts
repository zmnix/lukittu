import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type SignOutSessionResponse = ErrorResponse | { success: boolean };

export async function DELETE(
  _: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<SignOutSessionResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  const sessionId = params.slug;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json(
      {
        message: t('validation.bad_request'),
      },
      { status: 400 },
    );
  }

  const session = await getSession({
    user: {
      include: {
        sessions: true,
      },
    },
  });

  if (!session) {
    return NextResponse.json(
      {
        message: t('validation.unauthorized'),
      },
      { status: 401 },
    );
  }

  const sessionToLogout = session.user.sessions.find(
    (s) => s.sessionId === sessionId,
  );

  if (!sessionToLogout) {
    return NextResponse.json(
      {
        message: t('validation.invalid_session'),
      },
      { status: 404 },
    );
  }

  await prisma.session.delete({
    where: {
      userId: session.user.id,
      sessionId,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
