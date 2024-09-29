import LicenseDistributionEmailTemplate from '@/emails/LicenseDistributionTemplate';
import { regex } from '@/lib/constants/regex';
import { getSession } from '@/lib/utils/auth';
import { decryptLicenseKey } from '@/lib/utils/crypto';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { sendEmail } from '@/lib/utils/nodemailer';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { render } from '@react-email/components';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ILicenseEmailDeliverySuccessResponse = {
  success: boolean;
};

export type ILicenseEmailDeliveryResponse =
  | ILicenseEmailDeliverySuccessResponse
  | ErrorResponse;

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ILicenseEmailDeliveryResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const licenseId = params.slug;

    if (!licenseId || !regex.uuidV4.test(licenseId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

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
              settings: true,
              licenses: {
                where: {
                  id: licenseId,
                },
                include: {
                  customers: true,
                  products: true,
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

    if (!team.licenses.length) {
      return NextResponse.json(
        {
          message: t('validation.license_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const license = team.licenses[0];

    const customerEmails = license.customers
      .map((customer) => customer.email)
      .filter(Boolean) as string[];

    if (customerEmails.length === 0) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const licenseKey = decryptLicenseKey(license.licenseKey);

    const emails = license.customers
      .filter((customer) => customer.email)
      .map(async (customer) => {
        const html = await render(
          LicenseDistributionEmailTemplate({
            customerName: customer.fullName ?? customer.email!,
            licenseKey,
            businessLogoUrl: 'https://app.lukittu.com/customers/karhu.png',
            products: license.products.map((product) => product.name),
            teamName: team.name,
            businessMessage: team.settings?.emailMessage ?? undefined,
          }),
        );

        const text = await render(
          LicenseDistributionEmailTemplate({
            customerName: customer.fullName ?? customer.email!,
            licenseKey,
            businessLogoUrl: 'https://app.lukittu.com/customers/karhu.png',
            products: license.products.map((product) => product.name),
            teamName: team.name,
            businessMessage: team.settings?.emailMessage ?? undefined,
          }),
          {
            plainText: true,
          },
        );

        return await sendEmail({
          to: customer.email!,
          subject: `${team.name} | Your License Key`,
          fromName: `${team.name} (via Lukittu)`,
          html,
          text,
        });
      });

    await Promise.all(emails);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error(
      "Error occurred in 'licenses/[slug]/email-delivery' route",
      error,
    );
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
