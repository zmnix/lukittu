import { getIp, getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { isRateLimited } from '@/lib/utils/rate-limit';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type IWaitlistSuccessResponse = {
  success: boolean;
};

export type IWaitlistResponse = IWaitlistSuccessResponse | ErrorResponse;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<IWaitlistResponse>> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const body = (await request.json()) as { email: string };
    const { email } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json(
        {
          message: t('validation.invalid_email'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const ip = await getIp();
    if (ip) {
      const key = `waitlist:${email}`;
      const isLimited = await isRateLimited(key, 5, 1800); // 5 requests per 30 minutes

      if (isLimited) {
        return NextResponse.json(
          {
            message: t('validation.too_many_requests'),
          },
          { status: HttpStatus.TOO_MANY_REQUESTS },
        );
      }
    }

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

    await fetch(discordWebhookUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `New waitlist request: ${email}`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error occurred in 'waitlist' route:", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
