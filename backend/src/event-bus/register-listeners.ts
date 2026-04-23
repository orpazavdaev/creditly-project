import type { EventBus } from "./event-bus.js";
import { DOMAIN_EVENT_CREATED } from "./domain-events.js";
import { onDomainEventCreatedBusiness } from "./listeners/business-logic.listener.js";
import { onDomainEventCreatedCrm } from "./listeners/crm-integration.listener.js";

export function registerEventBusListeners(bus: EventBus): void {
  bus.on(DOMAIN_EVENT_CREATED, onDomainEventCreatedBusiness);
  bus.on(DOMAIN_EVENT_CREATED, onDomainEventCreatedCrm);
}
