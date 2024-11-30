import 'server-only';
import Stripe from 'stripe';
import { regex } from '../constants/regex';
import prisma from '../database/prisma';
import { sendLicenseDistributionEmail } from '../emails/templates/send-license-distribution-email';
import { generateUniqueLicense } from '../licenses/generate-license';
import { logger } from '../logging/logger';
import { encryptLicenseKey, generateHMAC } from '../security/crypto';

export const handleInvoicePaid = async (
  invoice: Stripe.Invoice,
  teamId: string,
  stripe: Stripe,
) => {
  try {
    if (!invoice.billing_reason) {
      logger.info('Skipping: No billing reason associated with invoice');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string,
    );

    const lukittuLicenseId = subscription.metadata.lukittu_license_id;

    if (invoice.billing_reason === 'subscription_create') {
      if (lukittuLicenseId) {
        logger.info('Skipping: License already exists for subscription');
        return;
      }

      const stripeCustomerId = subscription.customer as string;
      const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

      if (stripeCustomer.deleted) {
        logger.info('Skipping: Customer not found or deleted');
        return;
      }

      const item = subscription.items.data[0];

      const product = await stripe.products.retrieve(
        item.price.product as string,
      );

      const lukittuProductId = product.metadata.product_id;
      const ipLimit = product.metadata.ip_limit as string | undefined;
      const seats = product.metadata.seats as string | undefined;

      if (!lukittuProductId || !regex.uuidV4.test(lukittuProductId)) {
        logger.info('Skipping: Invalid or missing product_id in metadata');
        return;
      }

      const productExists = await prisma.product.findUnique({
        where: {
          id: lukittuProductId,
        },
      });

      if (!productExists) {
        logger.info('Skipping: Product not found in database', {
          productId: lukittuProductId,
        });
        return;
      }

      const parsedIpLimit = parseInt(ipLimit || '');
      if (ipLimit && (isNaN(parsedIpLimit) || parsedIpLimit < 0)) {
        logger.info('Skipping: Invalid ip_limit');
        return;
      }

      const parsedSeats = parseInt(seats || '');
      if (seats && (isNaN(parsedSeats) || parsedSeats < 0)) {
        logger.info('Skipping: Invalid seats');
        return;
      }

      const metadata = [
        {
          key: 'STRIPE_SUB',
          value: subscription.id,
          locked: true,
        },
        {
          key: 'STRIPE_CS',
          value: stripeCustomerId,
          locked: true,
        },
        {
          key: 'STRIPE_PROD',
          value: product.id,
          locked: true,
        },
      ];

      const license = await prisma.$transaction(async (prisma) => {
        const lukittuCustomer = await prisma.customer.upsert({
          where: {
            email_teamId: {
              email: stripeCustomer.email!,
              teamId,
            },
          },
          create: {
            email: stripeCustomer.email!,
            fullName: stripeCustomer.name ?? undefined,
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
            ipLimit: ipLimit ? parsedIpLimit : null,
            seats: seats ? parsedSeats : null,
            expirationType: 'DATE',
            expirationDate: new Date(subscription.current_period_end * 1000),
          },
          include: {
            team: {
              include: {
                settings: true,
              },
            },
            products: true,
          },
        });

        await stripe.subscriptions.update(subscription.id, {
          metadata: {
            ...subscription.metadata,
            lukittu_license_id: license.id,
            lukittu_customer_id: lukittuCustomer.id,
            lukittu_license_key: licenseKey,
            lukittu_event_description: 'Recurring subscription',
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

      logger.info('License created for subscription', {
        subscriptionId: subscription.id,
        teamId,
      });

      return license;
    }

    if (invoice.billing_reason === 'subscription_cycle') {
      if (!lukittuLicenseId || !regex.uuidV4.test(lukittuLicenseId)) {
        logger.info('Skipping: No license ID found for subscription renewal');
        return;
      }

      const license = await prisma.license.findUnique({
        where: { id: lukittuLicenseId },
      });

      if (!license) {
        logger.info('Skipping: License not found for renewal', {
          lukittuLicenseId,
          subscriptionId: subscription.id,
        });
        return;
      }

      const updatedLicense = await prisma.license.update({
        where: { id: lukittuLicenseId },
        data: {
          expirationDate: new Date(subscription.current_period_end * 1000),
        },
      });

      logger.info('License expiration updated on subscription renewal', {
        licenseId: updatedLicense.id,
        subscriptionId: subscription.id,
        teamId,
      });

      return updatedLicense;
    }

    logger.info('Skipping: Unhandled billing reason', {
      billingReason: invoice.billing_reason,
    });
  } catch (error) {
    logger.error('Error in handleInvoicePaid', error);
  }
};

export const handleSubscriptionDeleted = async (
  subscription: Stripe.Subscription,
  teamId: string,
) => {
  try {
    const licenseId = subscription.metadata.lukittu_license_id;

    if (!licenseId || !regex.uuidV4.test(licenseId)) {
      logger.info('Skipping: License ID not found in subscription metadata');
      return;
    }

    const license = await prisma.license.findUnique({
      where: {
        id: licenseId,
      },
    });

    if (!license) {
      logger.info('Skipping: License not found', {
        licenseId,
        subscriptionId: subscription.id,
      });
      return;
    }

    const updatedLicense = await prisma.license.update({
      where: {
        id: licenseId,
      },
      data: {
        expirationDate: new Date(),
      },
    });

    logger.info('Subscription deleted and license expired', {
      licenseId,
      subscriptionId: subscription.id,
      teamId,
    });

    return updatedLicense;
  } catch (error) {
    logger.error('Error occurred in handleSubscriptionDeleted', error);
  }
};

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
  teamId: string,
  stripe: Stripe,
) => {
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

    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string,
    );

    if (paymentIntent.metadata.lukittu_license_id) {
      logger.info('Skipping: License already exists for payment intent');
      return;
    }

    const product = await stripe.products.retrieve(
      item.price.product as string,
    );
    const lukittuProductId = product.metadata.product_id;
    const ipLimit = product.metadata.ip_limit as string | undefined;
    const seats = product.metadata.seats as string | undefined;
    const expirationDays = product.metadata.expiration_days as
      | string
      | undefined;
    const expirationStart = product.metadata.expiration_start as
      | string
      | undefined;

    if (!lukittuProductId || !regex.uuidV4.test(lukittuProductId)) {
      logger.info(
        'Skipping: No product_id found in the product metadata or inva lid product_id.',
      );
      return;
    }

    const productExists = await prisma.product.findUnique({
      where: {
        id: lukittuProductId,
        teamId,
      },
    });

    if (!productExists) {
      logger.info('Skipping: Product not found in database', {
        productId: lukittuProductId,
      });
      return;
    }

    const parsedIpLimit = parseInt(ipLimit || '');
    if (ipLimit && (isNaN(parsedIpLimit) || parsedIpLimit < 0)) {
      logger.info('Skipping: Invalid ip_limit.');
      return;
    }

    const parsedSeats = parseInt(seats || '');
    if (seats && (isNaN(parsedSeats) || parsedSeats < 0)) {
      logger.info('Skipping: Invalid seats.');
      return;
    }

    const parsedExpirationDays = parseInt(expirationDays || '');
    if (
      expirationDays &&
      (isNaN(parsedExpirationDays) || parsedExpirationDays < 0)
    ) {
      logger.info('Skipping: Invalid expiration_days.');
      return;
    }

    if (expirationStart && !expirationDays) {
      logger.info(
        'Skipping: expiration_start is set but expiration_days is not.',
      );
      return;
    }

    const allowedExpirationStarts = ['ACTIVATION', 'CREATION'];

    if (
      expirationStart &&
      !allowedExpirationStarts.includes(expirationStart.toUpperCase())
    ) {
      logger.info(
        'Skipping: Invalid expiration_start. Must be one of ACTIVATION or CREATION.',
      );
      return;
    }

    const expirationStartFormatted =
      expirationStart?.toUpperCase() === 'ACTIVATION'
        ? 'ACTIVATION'
        : 'CREATION';
    const expirationDate =
      (!expirationStart || expirationStart.toUpperCase() === 'CREATION') &&
      expirationDays
        ? new Date(Date.now() + parsedExpirationDays * 24 * 60 * 60 * 1000)
        : null;

    const metadata = [
      {
        key: 'STRIPE_CS',
        value: session.id,
        locked: true,
      },
      {
        key: 'STRIPE_PI',
        value: item.price!.id,
        locked: true,
      },
      {
        key: 'STRIPE_PROD',
        value: product.id,
        locked: true,
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
          ipLimit: ipLimit ? parsedIpLimit : null,
          seats: seats ? parsedSeats : null,
          expirationType: expirationDays ? 'DURATION' : 'NEVER',
          expirationDays: expirationDays ? parsedExpirationDays : null,
          expirationStart: expirationStartFormatted,
          expirationDate,
        },
        include: {
          team: {
            include: {
              settings: true,
            },
          },
          products: true,
        },
      });

      await sendLicenseDistributionEmail({
        customer: lukittuCustomer,
        licenseKey,
        license,
        team: license.team,
      });

      await stripe.paymentIntents.update(session.payment_intent as string, {
        metadata: {
          ...session.metadata,
          lukittu_license_id: license.id,
          lukittu_customer_id: lukittuCustomer.id,
          lukittu_license_key: licenseKey,
          lukittu_event_description: 'One-time purchase',
        },
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
};
