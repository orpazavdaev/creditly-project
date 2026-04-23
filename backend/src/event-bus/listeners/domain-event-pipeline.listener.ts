import { DOMAIN_EVENT_CREATED, type DomainEventCreatedPayload } from "../domain-events.js";
import type { EventBus } from "../event-bus.js";
import type { CrmService } from "../../services/crm.service.js";

export function registerDomainEventCreatedPipeline(bus: EventBus, crm: CrmService): void {
  bus.on(DOMAIN_EVENT_CREATED, (payload: DomainEventCreatedPayload) => {
    void (async () => {
      try {
        await crm.handleAfterDomainEvent(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[crm] unexpected: ${msg}\n`);
      }
    })();
  });
}
