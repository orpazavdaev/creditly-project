import { describe, it, expect } from "vitest";
import { mapBankerSubmitOfferResponse } from "../src/mappers/banker-responses.mapper.js";

describe("Banker response mapping", () => {
  it("does not expose accountId on offer submit event payload", () => {
    const out = mapBankerSubmitOfferResponse({
      offer: {
        id: "o1",
        auctionOpportunityId: "auc1",
        bankId: "bank1",
        bankerId: "banker1",
        totalInterestRate: 4.25,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      event: {
        id: "e1",
        accountId: "cust-secret",
        userId: "banker1",
        type: "offer_submitted",
        createdAt: "2026-01-01T00:00:00.000Z",
        metadata: { auctionId: "auc1" },
      },
    });
    expect(Object.prototype.hasOwnProperty.call(out.event, "accountId")).toBe(false);
    expect(out.event).toEqual({
      id: "e1",
      userId: "banker1",
      type: "offer_submitted",
      createdAt: "2026-01-01T00:00:00.000Z",
      metadata: { auctionId: "auc1" },
    });
  });
});
