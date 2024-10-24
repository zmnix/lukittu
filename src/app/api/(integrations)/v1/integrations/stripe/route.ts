import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
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
    const isLimited = await isRateLimited(key, 30, 60); // 30 requests per 60 seconds

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
        await handleSubscriptionUpdated(event.data.object, teamId);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, teamId);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, teamId);
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
) {
  // TODO:
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  teamId: string,
) {
  // TODO:
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  teamId: string,
) {
  // TODO:
}
