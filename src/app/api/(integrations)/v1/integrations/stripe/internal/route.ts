import prisma from '@/lib/database/prisma';
import { logger } from '@/lib/logging/logger';
import { HttpStatus } from '@/types/http-status';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get('stripe-signature')!;

    if (!sig || !rawBody) {
      logger.error('Invalid request', { sig, rawBody });
      return NextResponse.json(
        {
          message: 'Invalid request',
        },
        { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
    });

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case 'invoice.paid':
        const invoice = event.data.object as Stripe.Invoice;

        if (!invoice.subscription) {
          logger.error('Invoice paid, but not a subscription', { event });
          return NextResponse.json(
            {
              message: 'Subscription not found',
            },
            { status: HttpStatus.OK },
          );
        }

        logger.info('Invoice paid', { event });

        if (!invoice.subscription) {
          logger.error('Subscription not found', { event });
          return NextResponse.json(
            {
              message: 'Subscription not found',
            },
            { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
          );
        }

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string,
        );

        if (!subscription.customer) {
          logger.error('Customer not found', { event });
          return NextResponse.json(
            {
              message: 'Customer not found',
            },
            { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
          );
        }

        const customer = await stripe.customers.retrieve(
          subscription.customer as string,
        );

        if (customer.deleted) {
          logger.error('Customer deleted', { event });
          return NextResponse.json(
            {
              message: 'Customer deleted',
            },
            { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
          );
        }

        if (!subscription.metadata.lukittu_team_id) {
          logger.error('Team ID not found', { event });
          return NextResponse.json(
            {
              message: 'Team ID not found',
            },
            { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
          );
        }

        // Add team ID to the customer metadata
        await stripe.customers.update(customer.id, {
          metadata: {
            lukittu_team_id: subscription.metadata.lukittu_team_id,
          },
        });

        const teamId = subscription.metadata.lukittu_team_id;

        const lukittuSubscription = await prisma.subscription.upsert({
          where: {
            teamId,
          },
          update: {
            stripeSubscriptionId: invoice.subscription as string,
            billingPeriodEndsAt: new Date(invoice.period_end * 1000),
            status: subscription.status as string,
            canceledAt: null,
          },
          create: {
            teamId,
            status: subscription.status as string,
            stripeSubscriptionId: invoice.subscription as string,
            stripeCustomerId: subscription.customer as string,
            billingPeriodEndsAt: new Date(invoice.period_end * 1000),
          },
        });

        logger.info('Subscription updated', { lukittuSubscription });
        return NextResponse.json({ success: true });

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;

        if (!deletedSubscription.metadata.lukittu_team_id) {
          logger.error('Team ID not found', { event });
          return NextResponse.json(
            { message: 'Team ID not found' },
            { status: HttpStatus.OK },
          );
        }

        const existingDeletedSubscription =
          await prisma.subscription.findUnique({
            where: { teamId: deletedSubscription.metadata.lukittu_team_id },
          });

        if (!existingDeletedSubscription) {
          logger.info('Subscription not found in database, skipping update', {
            event,
          });
          return NextResponse.json({ success: true });
        }

        await prisma.subscription.update({
          where: { teamId: deletedSubscription.metadata.lukittu_team_id },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          },
        });

        logger.info('Subscription canceled', { event });
        return NextResponse.json({ success: true });

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;

        if (!updatedSubscription.metadata.lukittu_team_id) {
          logger.error('Team ID not found', { event });
          return NextResponse.json(
            { message: 'Team ID not found' },
            { status: HttpStatus.OK },
          );
        }

        const existingSubscription = await prisma.subscription.findUnique({
          where: { teamId: updatedSubscription.metadata.lukittu_team_id },
        });

        if (!existingSubscription) {
          logger.info('Subscription not found in database, skipping update', {
            event,
          });
          return NextResponse.json({ success: true });
        }

        await prisma.subscription.update({
          where: { teamId: updatedSubscription.metadata.lukittu_team_id },
          data: {
            status: updatedSubscription.status,
            billingPeriodEndsAt: new Date(
              updatedSubscription.current_period_end * 1000,
            ),
          },
        });

        logger.info('Subscription updated', { event });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: true });
    }
  } catch (error) {
    logger.error(
      "Error occurred in '(integrations)/v1/integrations/stripe/internal' route",
      { error },
    );
    return NextResponse.json(
      {
        message: 'Error processing request',
      },
      { status: HttpStatus.OK }, // Return 200 to prevent Stripe from retrying the request
    );
  }
}
