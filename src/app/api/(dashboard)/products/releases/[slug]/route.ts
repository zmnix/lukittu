import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { createAuditLog } from '@/lib/logging/audit-log';
import { logger } from '@/lib/logging/logger';
import {
  deleteFileFromPrivateS3,
  uploadFileToPrivateS3,
} from '@/lib/providers/aws-s3';
import { generateMD5Hash } from '@/lib/security/crypto';
import { isRateLimited } from '@/lib/security/rate-limiter';
import { getSession } from '@/lib/security/session';
import {
  getIp,
  getLanguage,
  getSelectedTeam,
} from '@/lib/utils/header-helpers';
import { getMainClassFromJar } from '@/lib/utils/java-helpers';
import {
  SetReleaseSchema,
  setReleaseSchema,
} from '@/lib/validation/products/set-release-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { AuditLogAction, AuditLogTargetType, Release } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

export type IProductsReleasesUpdateSuccessResponse = {
  release: Release;
};

export type IProductsReleasesUpdateResponse =
  | IProductsReleasesUpdateSuccessResponse
  | ErrorResponse;

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const t = await getTranslations({ locale: await getLanguage() });
  const params = await props.params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const data = formData.get('data') as string | null;

    const releaseId = params.slug;

    if (!releaseId || !regex.uuidV4.test(releaseId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: t('validation.bad_request') },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const body = JSON.parse(data) as SetReleaseSchema;
    const validated = await setReleaseSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          message: validated.error.errors[0].message,
          field: validated.error.errors[0].path[0],
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const { metadata, productId, status, version } = validated.data;

    if (file) {
      if (!(file instanceof File)) {
        return NextResponse.json(
          { message: t('validation.bad_request') },
          { status: HttpStatus.BAD_REQUEST },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: t('validation.file_too_large') },
          { status: HttpStatus.BAD_REQUEST },
        );
      }
    }

    const ip = await getIp();
    if (ip) {
      const key = `releases-update:${ip}`;
      const isLimited = await isRateLimited(key, 5, 300);
      if (isLimited) {
        return NextResponse.json(
          { message: t('validation.too_many_requests') },
          { status: HttpStatus.TOO_MANY_REQUESTS },
        );
      }
    }

    const selectedTeam = await getSelectedTeam();
    if (!selectedTeam) {
      return NextResponse.json(
        { message: t('validation.team_not_found') },
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
              releases: true,
              products: {
                where: { id: validated.data.productId },
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

    if (!team.products.length) {
      return NextResponse.json(
        {
          message: t('validation.product_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const existingRelease = team.releases.find((r) => r.id === releaseId);

    if (!existingRelease) {
      return NextResponse.json(
        { message: t('validation.release_not_found') },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (
      team.releases.find(
        (release) =>
          release.version === version &&
          release.productId === productId &&
          release.id !== releaseId,
      )
    ) {
      return NextResponse.json(
        {
          message: t('validation.release_exists'),
          field: 'version',
        },
        { status: HttpStatus.CONFLICT },
      );
    }

    const existingReleaseFile = await prisma.releaseFile.findUnique({
      where: { releaseId },
    });

    if (existingReleaseFile) {
      await deleteFileFromPrivateS3(
        process.env.PRIVATE_OBJECT_STORAGE_BUCKET_NAME!,
        existingReleaseFile.key,
      );
    }

    let fileKey: string | null = null;
    let checksum: string | null = null;
    let mainClassName: string | null = null;
    if (file) {
      const generatedChecksum = await generateMD5Hash(file);

      if (!generatedChecksum) {
        return NextResponse.json(
          {
            message: t('general.server_error'),
          },
          { status: HttpStatus.INTERNAL_SERVER_ERROR },
        );
      }

      checksum = generatedChecksum;

      if (file.type === 'application/java-archive') {
        const foundMainClassName = await getMainClassFromJar(file);
        if (!foundMainClassName) {
          return NextResponse.json(
            {
              message: t('validation.main_class_not_found'),
            },
            { status: HttpStatus.BAD_REQUEST },
          );
        }

        mainClassName = foundMainClassName;
      }

      fileKey = `releases/${team.id}/${productId}-${version}.${file.type.split('/')[1]}`;
      const fileStream = file.stream();
      await uploadFileToPrivateS3(
        process.env.PRIVATE_OBJECT_STORAGE_BUCKET_NAME!,
        fileKey,
        fileStream,
        file.type,
      );
    }

    const release = await prisma.release.update({
      where: { id: releaseId },
      data: {
        metadata,
        productId,
        status,
        version,
        teamId: team.id,
        file: file
          ? {
              upsert: {
                create: {
                  key: fileKey!,
                  size: file.size,
                  checksum: checksum!,
                  name: file.name,
                  mainClassName,
                },
                update: {
                  key: fileKey!,
                  size: file.size,
                  checksum: checksum!,
                  name: file.name,
                  mainClassName,
                },
              },
            }
          : undefined,
      },
    });

    const response = {
      release,
    };

    createAuditLog({
      userId: session.user.id,
      teamId: selectedTeam,
      action: AuditLogAction.UPDATE_RELEASE,
      targetId: release.id,
      targetType: AuditLogTargetType.RELEASE,
      responseBody: response,
      requestBody: body,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      "Error occurred in PUT '/api/products/releases/[slug]' route",
      error,
    );
    return NextResponse.json(
      { message: t('general.server_error') },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
