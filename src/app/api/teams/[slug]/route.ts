import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export interface TeamDeleteRequest {
  teamNameConfirmation: string;
}

export type TeamDeleteResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const t = await getTranslations({ locale: getLanguage() });
  const body = await request.json();

  const { teamNameConfirmation } = body as TeamDeleteRequest;
  const teamId = parseInt(params.slug);

  if (isNaN(teamId) || teamId <= 0) {
    return NextResponse.json(
      {
        message: t('validation.bad_request'),
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

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      deletedAt: null,
    },
    include: {
      users: true,
    },
  });

  if (!team) {
    return NextResponse.json(
      {
        message: t('validation.team_not_found'),
      },
      { status: 404 },
    );
  }

  if (teamNameConfirmation !== team.name.toUpperCase()) {
    return NextResponse.json(
      {
        message: t('validation.bad_request'),
      },
      { status: 400 },
    );
  }

  if (team.ownerId !== session.user.id) {
    return NextResponse.json(
      {
        message: t('validation.unauthorized'),
      },
      { status: 401 },
    );
  }

  if (team.users.length > 1) {
    return NextResponse.json(
      {
        message: t('validation.team_has_users'),
      },
      { status: 400 },
    );
  }

  await prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
  });
}
