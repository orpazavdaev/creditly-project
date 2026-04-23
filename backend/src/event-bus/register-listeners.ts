import type { EventBus } from "./event-bus.js";
import { WINNING_OFFER_SELECTED_TOPIC } from "./crm-integration-events.js";
import { registerCrmWinningOfferListener } from "./listeners/crm-integration.listener.js";
import { registerDomainEventCreatedPipeline } from "./listeners/domain-event-pipeline.listener.js";
import { CrmService } from "../services/crm.service.js";

export function registerEventBusListeners(bus: EventBus): void {
  const crm = new CrmService();
  registerDomainEventCreatedPipeline(bus, crm);
  registerCrmWinningOfferListener(bus, WINNING_OFFER_SELECTED_TOPIC, crm);
}
