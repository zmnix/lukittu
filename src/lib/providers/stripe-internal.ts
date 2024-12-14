import prisma from '@/lib/database/prisma';
import { logger } from '@/lib/logging/logger';
import { HttpStatus } from '@/types/http-status';
import { NextResponse } from 'next/server';
import 'server-only';
import Stripe from 'stripe';

async function getProductMetadata(stripe: Stripe, priceId: string) {
  const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
  const product = price.product as Stripe.Product;

  return {
    limits: {
      maxLicenses: +product.metadata.max_licenses || 100,
      maxProducts: +product.metadata.max_products || 3,
      logRetention: +product.metadata.log_retention || 30,
      maxCustomers: +product.metadata.max_customers || 100,
      maxTeamMembers: +product.metadata.max_team_members || 10,
      maxBlacklist: +product.metadata.max_blacklist || 100,
      maxStorage: +product.metadata.max_storage || 100,
      maxApiKeys: +product.metadata.max_api_keys || 10,
      maxReleasesPerProduct: +product.metadata.max_releases_per_product || 100,
      maxInvitations: +product.metadata.max_invitations || 100,
    },
    plan: product.metadata.subscription_name || 'free',
  };
}

export async function handleInvoicePaid(event: Stripe.Event, stripe: Stripe) {
  const invoice = event.data.object as Stripe.Invoice;

  if (!invoice.subscription) {
    logger.error('Invoice paid, but not a subscription', { event });
    return NextResponse.json(
      { message: 'Subscription not found' },
      { status: HttpStatus.OK },
    );
  }

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string,
  );

  if (!subscription.customer) {
    logger.error('Customer not found', { event });
    return NextResponse.json(
      { message: 'Customer not found' },
      { status: HttpStatus.OK },
    );
  }

  const customer = await stripe.customers.retrieve(
    subscription.customer as string,
  );

  if (customer.deleted) {
    logger.error('Customer deleted', { event });
    return NextResponse.json(
      { message: 'Customer deleted' },
      { status: HttpStatus.OK },
    );
  }

  const teamId = subscription.metadata.lukittu_team_id;

  if (!teamId) {
    logger.error('Team ID not found', { event });
    return NextResponse.json(
      { message: 'Team ID not found' },
      { status: HttpStatus.OK },
    );
  }

  await stripe.customers.update(customer.id, {
    metadata: { lukittu_team_id: teamId },
  });

  const productMetadata = await getProductMetadata(
    stripe,
    subscription.items.data[0].price.id,
  );

  const lukittuSubscription = await prisma.$transaction(
    async (prisma) => {
      const lukittuSubscription = await prisma.subscription.upsert({
        where: { teamId },
        update: {
          stripeSubscriptionId: invoice.subscription as string,
          billingPeriodEndsAt: new Date(invoice.period_end * 1000),
          status: subscription.status as string,
          plan: productMetadata.plan,
          canceledAt: null,
        },
        create: {
          teamId,
          status: subscription.status as string,
          stripeSubscriptionId: invoice.subscription as string,
          stripeCustomerId: subscription.customer as string,
          billingPeriodEndsAt: new Date(invoice.period_end * 1000),
          plan: productMetadata.plan,
        },
      });

      await prisma.limits.upsert({
        where: { teamId },
        update: productMetadata.limits,
        create: { teamId, ...productMetadata.limits },
      });

      return lukittuSubscription;
    },
    {
      isolationLevel: 'Serializable',
    },
  );

  logger.info('Subscription updated', { lukittuSubscription });
  return NextResponse.json({ success: true });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  const teamId = subscription.metadata.lukittu_team_id;
  if (!teamId) {
    logger.error('Team ID not found', { subscription });
    return NextResponse.json(
      { message: 'Team ID not found' },
      { status: HttpStatus.OK },
    );
  }

  const existingSubscription = await prisma.subscription.findUnique({
    where: { teamId },
  });

  if (!existingSubscription) {
    logger.info('Subscription not found in database, skipping update');
    return NextResponse.json({ success: true });
  }

  await prisma.subscription.update({
    where: { teamId },
    data: { status: 'canceled', canceledAt: new Date() },
  });

  logger.info('Subscription canceled', { subscription });
  return NextResponse.json({ success: true });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  stripe: Stripe,
) {
  const teamId = subscription.metadata.lukittu_team_id;
  if (!teamId) {
    logger.error('Team ID not found', { subscription });
    return NextResponse.json(
      { message: 'Team ID not found' },
      { status: HttpStatus.OK },
    );
  }

  const existingSubscription = await prisma.subscription.findUnique({
    where: { teamId },
  });

  if (!existingSubscription) {
    logger.info('Subscription not found in database, skipping update');
    return NextResponse.json({ success: true });
  }

  const productMetadata = await getProductMetadata(
    stripe,
    subscription.items.data[0].price.id,
  );
  const isActive = subscription.status === 'active';

  const newBillingPeriodEnd = isActive
    ? new Date(subscription.current_period_end * 1000)
    : undefined;

  const shouldUpdateBillingPeriod =
    newBillingPeriodEnd &&
    (!existingSubscription.billingPeriodEndsAt ||
      newBillingPeriodEnd > existingSubscription.billingPeriodEndsAt);

  logger.info('Subscription period evaluation', {
    currentEnd: existingSubscription.billingPeriodEndsAt,
    newEnd: newBillingPeriodEnd,
    willUpdate: shouldUpdateBillingPeriod,
  });

  await prisma.$transaction(
    async (prisma) => {
      await prisma.subscription.update({
        where: { teamId },
        data: {
          status: subscription.status,
          plan: productMetadata.plan,
          billingPeriodEndsAt: shouldUpdateBillingPeriod
            ? newBillingPeriodEnd
            : undefined,
        },
      });

      await prisma.limits.upsert({
        where: { teamId },
        update: productMetadata.limits,
        create: { teamId, ...productMetadata.limits },
      });
    },
    {
      isolationLevel: 'Serializable',
    },
  );

  logger.info('Subscription updated', {
    subscription,
    billingPeriodEndsAt: shouldUpdateBillingPeriod
      ? newBillingPeriodEnd
      : 'unchanged',
  });
  return NextResponse.json({ success: true });
}
