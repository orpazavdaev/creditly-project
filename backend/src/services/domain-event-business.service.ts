import type { DomainEventCreatedPayload } from "../event-bus/domain-events.js";
import { appEventBus } from "../event-bus/app-event-bus.js";
import {
  WINNING_OFFER_SELECTED_TOPIC,
  type WinningOfferSelectedPayload,
} from "../event-bus/crm-integration-events.js";
import { prisma } from "../repositories/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function applyBusinessRulesOnEventCreated(
  payload: DomainEventCreatedPayload
): Promise<void> {
  const { type, accountId } = payload;

  if (type === "DOCUMENT_UPLOADED") {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        status: "READY_FOR_AUCTION",
        lastActivity: new Date(),
      },
    });
  }

  const since = new Date(Date.now() - DAY_MS);
  const count24h = await prisma.event.count({
    where: {
      accountId,
      createdAt: { gte: since },
    },
  });
  await prisma.account.update({
    where: { id: accountId },
    data: { isHighActivity: count24h > 3 },
  });

  if (type === "AUCTION_CLOSED") {
    const auction = await prisma.auctionOpportunity.findUnique({
      where: { accountId },
      include: {
        bankOffers: {
          orderBy: [{ totalInterestRate: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!auction) {
      return;
    }
    const offers = auction.bankOffers;
    const closedAt = new Date();
    if (offers.length === 0) {
      await prisma.auctionOpportunity.update({
        where: { id: auction.id },
        data: {
          status: "EXPIRED",
          closedAt,
          winningOfferId: null,
        },
      });
      return;
    }
    const best = offers[0];
    await prisma.$transaction([
      prisma.auctionOpportunity.update({
        where: { id: auction.id },
        data: {
          status: "CLOSED",
          closedAt,
          winningOfferId: best.id,
        },
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { status: "WON" },
      }),
    ]);
    const winningPayload: WinningOfferSelectedPayload = {
      accountId,
      auctionId: auction.id,
      offerId: best.id,
    };
    appEventBus.emit(WINNING_OFFER_SELECTED_TOPIC, winningPayload);
  }
}
