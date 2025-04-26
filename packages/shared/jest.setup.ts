import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from './prisma/generated/client';

export const prismaMock = mockDeep<PrismaClient>();

jest.mock('./src/prisma/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
