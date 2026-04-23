import type { EventType, Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export class EventRepository {
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

  findByAccountIdWithActor(accountId: string) {
    return prisma.event.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
      },
    });
  }

  findByAccountIdWithActorForActorUser(accountId: string, actorUserId: string) {
    return prisma.event.findMany({
      where: { accountId, userId: actorUserId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
      },
    });
  }
}
