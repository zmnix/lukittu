import TeamInviteEmailTemplate from '@/emails/TeamInviteTemplate';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { sendEmail } from '@/lib/utils/nodemailer';
import {
  inviteMemberSchema,
  InviteMemberSchema,
} from '@/lib/validation/team/invite-member-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { render } from '@react-email/components';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ITeamsInviteSuccessResponse = {
  success: boolean;
};

export type ITeamsInviteResponse = ErrorResponse | ITeamsInviteSuccessResponse;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ITeamsInviteResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const body = (await request.json()) as InviteMemberSchema;
    const validated = await inviteMemberSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          message: validated.error.errors[0].message,
          field: validated.error.errors[0].path[0],
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const email = body.email;

    const selectedTeam = getSelectedTeam();

    if (!selectedTeam) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              id: selectedTeam,
              deletedAt: null,
            },
            include: {
              users: true,
              invitations: {
                where: {
                  email,
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

    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (team.users.find((user) => user.email === email)) {
      return NextResponse.json(
        {
          message: t('validation.user_already_in_team'),
          field: 'email',
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    let existingInvitation = false;
    if (team.invitations.find((invitation) => invitation.email === email)) {
      if (
        new Date().getTime() - team.invitations[0].createdAt.getTime() <
        15 * 60 * 1000 // 15 minutes
      ) {
        return NextResponse.json(
          {
            message: t('validation.invitation_already_sent'),
            field: 'email',
          },
          { status: HttpStatus.BAD_REQUEST },
        );
      } else {
        existingInvitation = true;
      }
    }

    const invitation = await prisma.$transaction(async (prisma) => {
      if (existingInvitation) {
        await prisma.invitation.deleteMany({
          where: {
            email,
            teamId: team.id,
          },
        });
      }

      const invitation = await prisma.invitation.create({
        data: {
          email,
          teamId: team.id,
          createdByUserId: session.user.id,
        },
      });

      return invitation;
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitation.id}`;

    const html = await render(
      TeamInviteEmailTemplate({
        inviteLink,
        senderName: session.user.fullName,
        teamName: team.name,
      }),
    );

    const text = await render(
      TeamInviteEmailTemplate({
        inviteLink,
        senderName: session.user.fullName,
        teamName: team.name,
      }),
      {
        plainText: true,
      },
    );

    const success = await sendEmail({
      to: email,
      subject: 'You have been invited to join a team on Lukittu',
      html,
      text,
    });

    if (!success) {
      return NextResponse.json(
        {
          message: t('auth.emails.sending_failed_title'),
        },
        { status: HttpStatus.INTERNAL_SERVER_ERROR },
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: HttpStatus.OK },
    );
  } catch (error) {
    logger.error("Error occurred in 'teams/invite' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
