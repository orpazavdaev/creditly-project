import type { EventBus } from "./event-bus.js";
import { WINNING_OFFER_SELECTED_TOPIC } from "./crm-integration-events.js";
import { registerCrmWinningOfferListener } from "./listeners/crm-integration.listener.js";
import { registerDomainEventCreatedPipeline } from "./listeners/domain-event-pipeline.listener.js";
import { AccountSyncRepository } from "../repositories/account-sync.repository.js";
import { CrmMockOutbound } from "../integration/crm-mock.js";
import { CrmIntegrationService } from "../integration/crm-integration.service.js";

export function registerEventBusListeners(bus: EventBus): void {
  const syncRepo = new AccountSyncRepository();
  const crm = new CrmIntegrationService(syncRepo, new CrmMockOutbound());
  registerDomainEventCreatedPipeline(bus, crm);
  registerCrmWinningOfferListener(bus, WINNING_OFFER_SELECTED_TOPIC, crm);
}
