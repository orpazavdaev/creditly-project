import { describe, it, expect } from "vitest";
import { EventCreateBodySchema } from "../src/validation/schemas.js";

describe("EventCreateBodySchema", () => {
  it("rejects system-only event types", () => {
    const r = EventCreateBodySchema.safeParse({
      accountId: "acc1",
      type: "auction_closed",
      metadata: {},
    });
    expect(r.success).toBe(false);
  });

  it("accepts document_uploaded and note_added", () => {
    expect(
      EventCreateBodySchema.safeParse({
        accountId: "acc1",
        type: "document_uploaded",
        metadata: {},
      }).success
    ).toBe(true);
    expect(
      EventCreateBodySchema.safeParse({
        accountId: "acc1",
        type: "note_added",
        metadata: { note: "x" },
      }).success
    ).toBe(true);
  });
});
