import prisma from '@/lib/database/prisma';
import { BlacklistType } from '@prisma/client';

class SharedVerificationHandler {
  public async updateBlacklistHits(
    teamId: string,
    type: BlacklistType,
    value: string,
  ) {
    await prisma.blacklist.update({
      where: {
        teamId_type_value: {
          teamId,
          type,
          value,
        },
      },
      data: {
        hits: {
          increment: 1,
        },
      },
    });
  }
}

export const sharedVerificationHandler = new SharedVerificationHandler();
