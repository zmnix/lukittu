import { cookies } from 'next/headers';
import { prismaMock } from '../../../jest.setup';
import { logger } from '../logging/logger';
import { proxyCheck } from '../providers/proxycheck';
import { getIp, getUserAgent } from '../utils/header-helpers';
import { createSession, getSession } from './session';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('../providers/proxycheck', () => ({
  proxyCheck: jest.fn(),
}));

jest.mock('../utils/header-helpers', () => ({
  getIp: jest.fn(),
  getUserAgent: jest.fn(),
}));

jest.mock('../logging/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock('crypto', () => ({
  randomBytes: () => ({
    toString: () => 'mocked-session-id',
  }),
}));

describe('Session Management', () => {
  const mockUserId = 'user-123';
  const mockIp = '127.0.0.1';
  const mockUserAgent = 'Mozilla/5.0';
  const mockSessionId = 'mocked-session-id';

  let mockCookieStore: {
    set: jest.Mock;
    get: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCookieStore = {
      set: jest.fn(),
      get: jest.fn(),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    (getIp as jest.Mock).mockResolvedValue(mockIp);
    (getUserAgent as jest.Mock).mockResolvedValue(mockUserAgent);
    (proxyCheck as jest.Mock).mockResolvedValue({ isocode: 'US' });
  });

  describe('createSession', () => {
    it('should create a session successfully with remember me', async () => {
      const rememberMe = true;
      prismaMock.session.create.mockResolvedValue({
        id: 1,
        sessionId: mockSessionId,
        userId: mockUserId,
        ipAddress: mockIp,
        country: 'USA',
        userAgent: mockUserAgent,
      } as any);

      const result = await createSession(mockUserId, rememberMe);

      expect(result).not.toBeNull();
      expect(prismaMock.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: mockSessionId,
          userId: mockUserId,
          ipAddress: mockIp,
          country: 'USA',
          userAgent: mockUserAgent,
        }),
      });
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'session',
        mockSessionId,
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        }),
      );
    });

    it('should create a session with shorter expiry without remember me', async () => {
      const rememberMe = false;
      prismaMock.session.create.mockResolvedValue({
        id: 1,
        sessionId: mockSessionId,
      } as any);

      const result = await createSession(mockUserId, rememberMe);

      expect(result).not.toBeNull();
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'session',
        mockSessionId,
        expect.objectContaining({
          expires: expect.any(Date),
        }),
      );
    });

    it('should handle missing geo data', async () => {
      (proxyCheck as jest.Mock).mockResolvedValue(null);
      prismaMock.session.create.mockResolvedValue({
        id: 1,
        sessionId: mockSessionId,
      } as any);

      const result = await createSession(mockUserId, false);

      expect(result).not.toBeNull();
      expect(prismaMock.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            country: null,
          }),
        }),
      );
    });

    it('should handle database errors', async () => {
      prismaMock.session.create.mockRejectedValue(new Error('Database error'));

      const result = await createSession(mockUserId, false);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Error creating session',
        expect.any(Error),
      );
    });
  });

  describe('getSession', () => {
    it('should return null when no session cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(null);

      const result = await getSession();

      expect(result).toBeNull();
      expect(prismaMock.session.findUnique).not.toHaveBeenCalled();
    });

    it('should return null when session is expired', async () => {
      mockCookieStore.get.mockReturnValue({ value: mockSessionId });
      prismaMock.session.findUnique.mockResolvedValue(null);

      const result = await getSession();

      expect(result).toBeNull();
    });

    it('should return session with included relations', async () => {
      const mockSession = {
        id: 1,
        sessionId: mockSessionId,
        userId: mockUserId,
        user: { id: mockUserId, name: 'Test User' },
      };
      mockCookieStore.get.mockReturnValue({ value: mockSessionId });
      prismaMock.session.findUnique.mockResolvedValue(mockSession as any);

      const result = await getSession({ user: true });

      expect(result).toEqual({
        ...mockSession,
        sessionId: mockSessionId,
      });
      expect(prismaMock.session.findUnique).toHaveBeenCalledWith({
        where: {
          sessionId: mockSessionId,
          expiresAt: {
            gte: expect.any(Date),
          },
        },
        include: { user: true },
      });
    });

    it('should handle different include parameters', async () => {
      mockCookieStore.get.mockReturnValue({ value: mockSessionId });
      prismaMock.session.findUnique.mockResolvedValue({
        id: 1,
        sessionId: mockSessionId,
      } as any);

      await getSession({ user: true, teams: true });

      expect(prismaMock.session.findUnique).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: {
          user: true,
          teams: true,
        },
      });
    });
  });
});
