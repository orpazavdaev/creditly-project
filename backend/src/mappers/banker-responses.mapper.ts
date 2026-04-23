import type { BankOfferApiRow } from "../types/bank-offer-api.js";
import type { EventApiRow } from "../services/event.service.js";

export type BankerEventApiRow = {
  id: string;
  userId: string;
  type: string;
  createdAt: string;
  metadata: unknown;
};

export type BankerSubmitOfferResponse = {
  offer: BankOfferApiRow;
  event: BankerEventApiRow;
};

export function mapBankerSubmitOfferResponse(data: {
  offer: BankOfferApiRow;
  event: EventApiRow;
}): BankerSubmitOfferResponse {
  return {
    offer: data.offer,
    event: {
      id: data.event.id,
      userId: data.event.userId,
      type: data.event.type,
      createdAt: data.event.createdAt,
      metadata: data.event.metadata,
    },
  };
}
