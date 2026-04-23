import type { EventType, Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export class EventRepository {
  accountExists(accountId: string): Promise<boolean> {
    return prisma.account
      .findUnique({ where: { id: accountId }, select: { id: true } })
      .then((r) => r !== null);
  }

  create(data: {
    accountId: string;
    userId: string;
    type: EventType;
    metadata: Prisma.InputJsonValue;
  }) {
    return prisma.event.create({
      data: {
        accountId: data.accountId,
        userId: data.userId,
        type: data.type,
        metadata: data.metadata,
      },
    });
  }

  findByAccountId(accountId: string) {
    return prisma.event.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
  }
}
