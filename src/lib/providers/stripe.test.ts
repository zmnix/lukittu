import { Stripe } from 'stripe';
import { prismaMock } from '../../../jest.setup';
import { sendLicenseDistributionEmail } from '../emails/templates/send-license-distribution-email';
import { generateUniqueLicense } from '../licenses/generate-license';
import { logger } from '../logging/logger';
import { encryptLicenseKey, generateHMAC } from '../security/crypto';
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from './stripe';

jest.mock('../logging/logger', () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../licenses/generate-license', () => ({
  __esModule: true,
  generateUniqueLicense: jest.fn(),
}));

jest.mock('../security/crypto', () => ({
  __esModule: true,
  encryptLicenseKey: jest.fn(),
  generateHMAC: jest.fn(),
}));

jest.mock('../emails/templates/send-license-distribution-email', () => ({
  __esModule: true,
  sendLicenseDistributionEmail: jest.fn(),
}));

describe('Stripe Integration', () => {
  let mockStripe: jest.Mocked<Stripe>;
  const teamId = 'team-123';
  const mockSession = {
    id: 'cs_test_123',
    payment_status: 'paid',
    mode: 'payment',
    customer_details: {
      email: 'test@example.com',
      name: 'Test User',
      address: {
        city: 'Test City',
        country: 'US',
        line1: '123 Test St',
        line2: null,
        postal_code: '12345',
        state: 'CA',
      },
    },
  } as unknown as Stripe.Checkout.Session;

  const mockSubscription = {
    id: 'sub_123',
    customer: 'cus_123',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
    items: {
      data: [
        {
          price: {
            product: 'prod_123',
          },
        },
      ],
    },
    metadata: {},
  } as unknown as Stripe.Subscription;

  beforeEach(() => {
    mockStripe = {
      checkout: {
        sessions: {
          retrieve: jest.fn(),
        },
      },
      products: {
        retrieve: jest.fn(),
      },
      customers: {
        retrieve: jest.fn(),
      },
      paymentIntents: {
        update: jest.fn(),
      },
      subscriptions: {
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<Stripe>;

    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    prismaMock.customer.upsert.mockResolvedValue({
      id: 'cust_123',
      email: 'test@example.com',
    } as any);

    prismaMock.license.create.mockResolvedValue({
      id: 'license_123',
      licenseKey: 'encrypted-license-key',
      teamId,
      team: { name: 'Test Team' },
      products: [{ name: 'Test Product' }],
    } as any);

    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod_123',
      name: 'Test Product',
    } as any);

    (mockStripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      line_items: {
        data: [
          {
            price: {
              id: 'price_123',
              type: 'one_time',
              product: 'prod_123',
            },
          },
        ],
      },
    });

    (mockStripe.products.retrieve as jest.Mock).mockResolvedValue({
      id: 'prod_123',
      metadata: {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        ip_limit: '5',
        seats: '10',
        expiration_days: '365',
        expiration_start: 'CREATION',
      },
    });

    (mockStripe.customers.retrieve as jest.Mock).mockResolvedValue({
      deleted: false,
    });

    (generateUniqueLicense as jest.Mock).mockResolvedValue('test-license-key');
    (generateHMAC as jest.Mock).mockReturnValue('test-hmac');
    (encryptLicenseKey as jest.Mock).mockReturnValue('encrypted-license-key');
    (sendLicenseDistributionEmail as jest.Mock).mockResolvedValue(undefined);
  });

  describe('handleCheckoutSessionCompleted', () => {
    test('successfully processes a valid checkout session', async () => {
      const result = await handleCheckoutSessionCompleted(
        mockSession,
        teamId,
        mockStripe,
      );

      expect(result).toBeDefined();
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        mockSession.id,
        { expand: ['line_items'] },
      );
      expect(prismaMock.customer.upsert).toHaveBeenCalled();
      expect(prismaMock.license.create).toHaveBeenCalled();
      expect(sendLicenseDistributionEmail).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Stripe checkout session completed',
        expect.any(Object),
      );
    });

    test('skips processing when payment status is not paid', async () => {
      const unpaidSession = {
        ...mockSession,
        payment_status: 'unpaid',
      } as Stripe.Checkout.Session;

      await handleCheckoutSessionCompleted(unpaidSession, teamId, mockStripe);

      expect(mockStripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Skipping: Payment status is not 'paid' or session is not a payment session.",
      );
    });

    it('should skip if product not found from database', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await handleCheckoutSessionCompleted(mockSession, teamId, mockStripe);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: Product not found in database',
        {
          productId: '123e4567-e89b-12d3-a456-426614174000',
        },
      );
      expect(prismaMock.license.update).not.toHaveBeenCalled();
    });

    test('skips processing when customer email is missing', async () => {
      const sessionWithoutEmail = {
        ...mockSession,
        customer_details: { name: 'Test User' },
      } as unknown as Stripe.Checkout.Session;

      await handleCheckoutSessionCompleted(
        sessionWithoutEmail,
        teamId,
        mockStripe,
      );

      expect(mockStripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: No customer email found in the checkout session.',
      );
    });

    test('handles invalid product metadata', async () => {
      (mockStripe.products.retrieve as jest.Mock).mockResolvedValue({
        id: 'prod_123',
        metadata: {
          product_id: 'invalid-uuid',
        },
      });

      await handleCheckoutSessionCompleted(mockSession, teamId, mockStripe);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: No product_id found in the product metadata or inva lid product_id.',
      );
      expect(prismaMock.customer.upsert).not.toHaveBeenCalled();
    });

    test('handles invalid expiration configuration', async () => {
      (mockStripe.products.retrieve as jest.Mock).mockResolvedValue({
        id: 'prod_123',
        metadata: {
          product_id: '123e4567-e89b-12d3-a456-426614174000',
          expiration_start: 'ACTIVATION',
        },
      });

      await handleCheckoutSessionCompleted(mockSession, teamId, mockStripe);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: expiration_start is set but expiration_days is not.',
      );
      expect(prismaMock.customer.upsert).not.toHaveBeenCalled();
    });

    test('handles license generation failure', async () => {
      (generateUniqueLicense as jest.Mock).mockResolvedValue(null);

      await handleCheckoutSessionCompleted(mockSession, teamId, mockStripe);

      expect(logger.error).toHaveBeenCalledWith('Failed to create a license');
      expect(prismaMock.license.create).not.toHaveBeenCalled();
    });

    test('handles database transaction error', async () => {
      const error = new Error('Database error');
      prismaMock.$transaction.mockRejectedValue(error);

      await handleCheckoutSessionCompleted(mockSession, teamId, mockStripe);

      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred in handleCheckoutSessionCompleted',
        error,
      );
    });
  });

  describe('handleSubscriptionCreated', () => {
    test('successfully creates a license for valid subscription', async () => {
      const result = await handleSubscriptionCreated(
        mockSubscription,
        teamId,
        mockStripe,
      );

      expect(result).toBeDefined();
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_123');
      expect(mockStripe.products.retrieve).toHaveBeenCalledWith('prod_123');
      expect(prismaMock.customer.upsert).toHaveBeenCalled();
      expect(prismaMock.license.create).toHaveBeenCalled();
      expect(mockStripe.subscriptions.update).toHaveBeenCalled();
      expect(sendLicenseDistributionEmail).toHaveBeenCalled();
    });

    test('skips processing when customer is deleted', async () => {
      (mockStripe.customers.retrieve as jest.Mock).mockResolvedValue({
        deleted: true,
      });

      await handleSubscriptionCreated(mockSubscription, teamId, mockStripe);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: Customer not found or deleted',
      );
      expect(prismaMock.customer.upsert).not.toHaveBeenCalled();
    });

    it('should skip if product not found from database', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await handleSubscriptionCreated(mockSubscription, teamId, mockStripe);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: Product not found in database',
        {
          productId: '123e4567-e89b-12d3-a456-426614174000',
        },
      );
      expect(prismaMock.license.update).not.toHaveBeenCalled();
    });

    test('handles invalid product metadata', async () => {
      (mockStripe.products.retrieve as jest.Mock).mockResolvedValue({
        id: 'prod_123',
        metadata: {
          product_id: 'invalid-uuid',
        },
      });

      (mockStripe.customers.retrieve as jest.Mock).mockResolvedValue({
        deleted: false,
      });

      await handleSubscriptionCreated(mockSubscription, teamId, mockStripe);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: Invalid or missing product_id in metadata',
      );
      expect(prismaMock.customer.upsert).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionUpdated', () => {
    beforeEach(() => {
      mockSubscription.metadata.lukittu_license_id = 'license_123';
      prismaMock.license.findUnique.mockResolvedValue({
        id: 'license_123',
      } as any);
      prismaMock.license.update.mockResolvedValue({
        id: 'license_123',
      } as any);
    });

    test('successfully updates license expiration date', async () => {
      const result = await handleSubscriptionUpdated(mockSubscription, teamId);

      expect(result).toBeDefined();
      expect(prismaMock.license.update).toHaveBeenCalledWith({
        where: { id: 'license_123' },
        data: {
          expirationDate: expect.any(Date),
        },
      });
    });

    test('skips processing when subscription is not active', async () => {
      const inactiveSubscription = {
        ...mockSubscription,
        status: 'canceled',
      } as Stripe.Subscription;

      await handleSubscriptionUpdated(inactiveSubscription, teamId);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: Subscription status is not active',
      );
      expect(prismaMock.license.update).not.toHaveBeenCalled();
    });

    test('handles missing license ID in metadata', async () => {
      const subscriptionWithoutLicenseId = {
        ...mockSubscription,
        metadata: {},
      } as Stripe.Subscription;

      await handleSubscriptionUpdated(subscriptionWithoutLicenseId, teamId);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: License ID not found in subscription metadata',
      );
      expect(prismaMock.license.update).not.toHaveBeenCalled();
    });

    test('handles non-existent license', async () => {
      prismaMock.license.findUnique.mockResolvedValue(null);

      await handleSubscriptionUpdated(mockSubscription, teamId);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: License not found',
        expect.any(Object),
      );
      expect(prismaMock.license.update).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionDeleted', () => {
    beforeEach(() => {
      mockSubscription.metadata.lukittu_license_id = 'license_123';
      prismaMock.license.findUnique.mockResolvedValue({
        id: 'license_123',
      } as any);
      prismaMock.license.update.mockResolvedValue({
        id: 'license_123',
      } as any);
    });

    test('successfully expires license on subscription deletion', async () => {
      await handleSubscriptionDeleted(mockSubscription, teamId);

      expect(prismaMock.license.update).toHaveBeenCalledWith({
        where: { id: 'license_123' },
        data: {
          expirationDate: expect.any(Date),
        },
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Subscription deleted and license expired',
        expect.any(Object),
      );
    });

    test('handles missing license ID in metadata', async () => {
      const subscriptionWithoutLicenseId = {
        ...mockSubscription,
        metadata: {},
      } as Stripe.Subscription;

      await handleSubscriptionDeleted(subscriptionWithoutLicenseId, teamId);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: License ID not found in subscription metadata',
      );
      expect(prismaMock.license.update).not.toHaveBeenCalled();
    });

    test('handles non-existent license', async () => {
      prismaMock.license.findUnique.mockResolvedValue(null);

      await handleSubscriptionDeleted(mockSubscription, teamId);

      expect(logger.info).toHaveBeenCalledWith(
        'Skipping: License not found',
        expect.any(Object),
      );
      expect(prismaMock.license.update).not.toHaveBeenCalled();
    });
  });
});
