import { Stripe } from 'stripe';
import { prismaMock } from '../../../jest.setup';
import { sendLicenseDistributionEmail } from '../emails/templates/send-license-distribution-email';
import { generateUniqueLicense } from '../licenses/generate-license';
import { logger } from '../logging/logger';
import { encryptLicenseKey, generateHMAC } from '../security/crypto';
import { handleCheckoutSessionCompleted } from './stripe';

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

    (generateUniqueLicense as jest.Mock).mockResolvedValue('test-license-key');
    (generateHMAC as jest.Mock).mockReturnValue('test-hmac');
    (encryptLicenseKey as jest.Mock).mockReturnValue('encrypted-license-key');
    (sendLicenseDistributionEmail as jest.Mock).mockResolvedValue(undefined);
  });

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
