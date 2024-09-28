import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { createAuditLog } from '@/lib/utils/audit-log';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import {
  SetTeamSchema,
  setTeamSchema,
} from '@/lib/validation/team/set-team-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { AuditLogAction, AuditLogTargetType, Team, User } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export interface ITeamsDeleteRequest {
  teamNameConfirmation: string;
}

type ITeamsDeleteSuccessResponse = {
  success: boolean;
};

export type ITeamsDeleteResponse = ErrorResponse | ITeamsDeleteSuccessResponse;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ITeamsDeleteResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const body = await request.json();
    const { teamNameConfirmation } = body as ITeamsDeleteRequest;
    const teamId = params.slug;

    if (!teamId || !regex.uuidV4.test(teamId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const session = await getSession({ user: true });

    if (!session) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
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
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (teamNameConfirmation !== team.name.toUpperCase()) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (team.users.length > 1) {
      return NextResponse.json(
        {
          message: t('validation.team_has_users'),
        },
        { status: HttpStatus.BAD_REQUEST },
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

    const response = {
      success: true,
    };

    createAuditLog({
      action: AuditLogAction.DELETE_TEAM,
      userId: session.user.id,
      teamId: team.id,
      targetType: AuditLogTargetType.TEAM,
      targetId: team.id,
      requestBody: body,
      responseBody: response,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error("Error occurred in 'teams/[slug]' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

type ITeamsEditSuccessResponse = {
  team: Omit<Team, 'privateKeyRsa' | 'publicKeyRsa'>;
};

export type ITeamsEditResponse = ErrorResponse | ITeamsEditSuccessResponse;

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ITeamsEditResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const teamId = params.slug;

    if (!teamId || !regex.uuidV4.test(teamId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const body = (await request.json()) as SetTeamSchema;
    const validated = await setTeamSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          message: validated.error.errors[0].message,
          field: validated.error.errors[0].path[0],
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const { name } = validated.data;

    const session = await getSession({
      user: {
        include: {
          teams: true,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (!teamId || !session.user.teams.some((team) => team.id === teamId)) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
          field: 'id',
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        name,
      },
    });

    const response = {
      team: updatedTeam,
    };

    createAuditLog({
      action: AuditLogAction.UPDATE_TEAM,
      userId: session.user.id,
      teamId,
      targetType: AuditLogTargetType.TEAM,
      targetId: teamId,
      requestBody: body,
      responseBody: response,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error occurred in 'teams' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

export type ITeamGetSuccessResponse = {
  team: Omit<Team, 'privateKeyRsa'> & {
    owner: Omit<User, 'passwordHash'>;
    memberCount: number;
  };
};

export type ITeamGetResponse = ErrorResponse | ITeamGetSuccessResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const teamId = params.slug;

    if (!teamId || !regex.uuidV4.test(teamId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              id: teamId,
              deletedAt: null,
            },
            omit: {
              publicKeyRsa: false,
            },
            include: {
              owner: true,
              _count: {
                select: {
                  users: true,
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (!session.user.teams.length) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const team = session.user.teams[0];

    return NextResponse.json({
      team: {
        ...team,
        owner: team.owner,
        memberCount: team._count.users,
        _count: undefined,
      },
    });
  } catch (error) {
    logger.error("Error occurred in 'teams/[slug]' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
