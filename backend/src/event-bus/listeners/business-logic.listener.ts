import type { DomainEventCreatedPayload } from "../domain-events.js";
import { applyBusinessRulesOnEventCreated } from "../../services/domain-event-business.service.js";

export function onDomainEventCreatedBusiness(payload: DomainEventCreatedPayload): void {
  void applyBusinessRulesOnEventCreated(payload).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[business] async error: ${msg}\n`);
  });
}
