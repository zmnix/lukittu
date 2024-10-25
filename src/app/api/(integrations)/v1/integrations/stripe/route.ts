import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { sendLicenseDistributionEmail } from '@/lib/emails/send-license-distribution-email';
import { generateUniqueLicense } from '@/lib/licenses/generate-license';
import { encryptLicenseKey, generateHMAC } from '@/lib/utils/crypto';
import { logger } from '@/lib/utils/logger';
import { isRateLimited } from '@/lib/utils/rate-limit';
import { HttpStatus } from '@/types/http-status';
import { NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');

    if (!teamId || !regex.uuidV4.test(teamId)) {
      return NextResponse.json(
        {
          message: 'Invalid teamId',
        },
        { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
      );
    }

    const key = `stripe-integration:${teamId}`;
    const isLimited = await isRateLimited(key, 60, 10); // 60 requests per 10 seconds

    if (isLimited) {
      return NextResponse.json(
        {
          message: 'Too many requests. Please try again later.',
        },
        { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
      );
    }

    const rawBody = await request.text();
    const sig = request.headers.get('stripe-signature')!;

    if (!sig || !rawBody) {
      return NextResponse.json(
        {
          message: 'Invalid request',
        },
        { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
      );
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        stripeIntegration: true,
      },
    });

    if (!team || !team.stripeIntegration) {
      return NextResponse.json(
        {
          message: 'Team not found',
        },
        { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
      );
    }

    const integration = team.stripeIntegration;

    if (!integration.active) {
      return NextResponse.json(
        {
          message: 'Stripe integration is not active',
        },
        { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
      );
    }

    const stripe = new Stripe(team.stripeIntegration.apiKey, {
      apiVersion: '2024-09-30.acacia',
    });

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      team.stripeIntegration.webhookSecret,
    );

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, teamId, stripe);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, teamId, stripe);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, teamId, stripe);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, teamId, stripe);
        break;
      default:
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "Error occurred in '(integrations)/v1/integrations/stripe' route",
      error,
    );

    return NextResponse.json(
      {
        message: 'An error occurred while processing the request',
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  teamId: string,
  stripe: Stripe,
) {
  // const stripeCustomerId = subscription.customer as string;
  // const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
  // TODO:
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  teamId: string,
  stripe: Stripe,
) {
  // TODO:
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  teamId: string,
  stripe: Stripe,
) {
  // TODO:
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  teamId: string,
  stripe: Stripe,
) {
  try {
    if (session.payment_status !== 'paid' || session.mode !== 'payment') {
      logger.info(
        "Skipping: Payment status is not 'paid' or session is not a payment session.",
      );
      return;
    }

    const customer = session.customer_details;

    if (!customer || !customer.email) {
      logger.info('Skipping: No customer email found in the checkout session.');
      return;
    }

    const lineItems = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });

    const item = lineItems.line_items?.data[0];
    if (!item || !item.price) {
      logger.info(
        'Skipping: No line items or price found in the checkout session.',
      );
      return;
    }

    if (item.price.type !== 'one_time') {
      logger.info('Skipping: Price type is not one_time.');
      return;
    }

    const product = await stripe.products.retrieve(
      item.price.product as string,
    );
    const lukittuProductId = product.metadata.product_id;

    if (!lukittuProductId || !regex.uuidV4.test(lukittuProductId)) {
      logger.info(
        'Skipping: No product_id found in the product metadata or inva lid product_id.',
      );
      return;
    }

    // TODO: Other data from metadata
    const metadata = [
      {
        key: 'Stripe cs',
        value: session.id,
      },
      {
        key: 'Stripe pi',
        value: item.price!.id,
      },
      {
        key: 'Stripe prod',
        value: product.id,
      },
    ];

    const license = await prisma.$transaction(async (prisma) => {
      const lukittuCustomer = await prisma.customer.upsert({
        where: {
          email_teamId: {
            email: customer.email!,
            teamId,
          },
        },
        create: {
          email: customer.email!,
          fullName: customer.name,
          address: customer.address
            ? {
                create: {
                  city: customer.address.city,
                  country: customer.address.country,
                  line1: customer.address.line1,
                  line2: customer.address.line2,
                  postalCode: customer.address.postal_code,
                  state: customer.address.state,
                },
              }
            : undefined,
          teamId,
          metadata,
        },
        update: {},
      });

      const licenseKey = await generateUniqueLicense(teamId);
      const hmac = generateHMAC(`${licenseKey}:${teamId}`);

      if (!licenseKey) {
        logger.error('Failed to generate a unique license key');
        return;
      }

      const encryptedLicenseKey = encryptLicenseKey(licenseKey);

      const license = await prisma.license.create({
        data: {
          licenseKey: encryptedLicenseKey,
          teamId,
          customers: {
            connect: {
              id: lukittuCustomer.id,
            },
          },
          licenseKeyLookup: hmac,
          metadata,
          products: {
            connect: {
              id: lukittuProductId,
            },
          },
        },
        include: {
          team: true,
          products: true,
        },
      });

      await sendLicenseDistributionEmail({
        customer: lukittuCustomer,
        licenseKey,
        license,
        team: license.team,
      });

      return license;
    });

    if (!license) {
      logger.error('Failed to create a license');
      return;
    }

    logger.info('Stripe checkout session completed', {
      licenseId: license.id,
      licenseKey: license.licenseKey,
      teamId: license.teamId,
    });

    return license;
  } catch (error) {
    logger.error('Error occurred in handleCheckoutSessionCompleted', error);
  }
}
