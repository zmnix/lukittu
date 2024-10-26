import prisma from '@/lib/database/prisma';
import { createAuditLog } from '@/lib/logging/audit-log';
import { logger } from '@/lib/logging/logger';
import { deleteFileFromS3, uploadFileToS3 } from '@/lib/providers/aws-s3';
import { getSession } from '@/lib/security/session';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { AuditLogAction, AuditLogTargetType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_DIMENSION = 600; // pixels

export type ITeamsImageSetSuccessResponse = {
  url: string;
};

export type ITeamsImageSetResponse =
  | ITeamsImageSetSuccessResponse
  | ErrorResponse;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ITeamsImageSetResponse>> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: t('validation.file_too_large'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: t('validation.invalid_file_type'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const selectedTeam = await getSelectedTeam();

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

    const fileBuffer = await file.arrayBuffer();
    let processedImageBuffer: Buffer;
    try {
      processedImageBuffer = await sharp(Buffer.from(fileBuffer))
        .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (error) {
      logger.error('Error occurred while resizing image', error);
      return NextResponse.json(
        {
          message: t('general.server_error'),
        },
        { status: HttpStatus.INTERNAL_SERVER_ERROR },
      );
    }

    if (team.imageUrl) {
      const imageUrlParts = team.imageUrl.split('/');
      const fileKey = `teams/${imageUrlParts[imageUrlParts.length - 1]}`;
      await deleteFileFromS3(process.env.OBJECT_STORAGE_BUCKET_NAME!, fileKey);
    }

    const imageUuid = randomUUID();

    const fileKey = `teams/${imageUuid}.${file.type.split('/')[1]}`;
    await uploadFileToS3(
      process.env.OBJECT_STORAGE_BUCKET_NAME!,
      fileKey,
      processedImageBuffer,
      file.type,
    );

    const imageUrl = `${process.env.OBJECT_STORAGE_ENDPOINT}/${process.env.OBJECT_STORAGE_BUCKET_NAME}/${fileKey}`;

    await prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        imageUrl,
      },
    });

    const response = {
      url: imageUrl,
    };

    createAuditLog({
      userId: session.user.id,
      teamId: team.id,
      action: AuditLogAction.UPDATE_TEAM_PICTURE,
      targetId: team.id,
      targetType: AuditLogTargetType.TEAM,
      requestBody: null,
      responseBody: response,
    });

    return NextResponse.json(response, { status: HttpStatus.OK });
  } catch (error) {
    logger.error("Error occurred in 'teams/image' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const selectedTeam = await getSelectedTeam();

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

    if (!team.imageUrl) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const imageUrlParts = team.imageUrl.split('/');
    const fileKey = `teams/${imageUrlParts[imageUrlParts.length - 1]}`;
    await deleteFileFromS3(process.env.OBJECT_STORAGE_BUCKET_NAME!, fileKey);

    await prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        imageUrl: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: HttpStatus.OK },
    );
  } catch (error) {
    logger.error("Error occurred in 'teams/image' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
