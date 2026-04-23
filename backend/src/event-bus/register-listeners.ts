import type { EventBus } from "./event-bus.js";
import { WINNING_OFFER_SELECTED_TOPIC } from "./crm-integration-events.js";
import { registerCrmWinningOfferListener } from "./listeners/crm-integration.listener.js";
import { registerDomainEventCreatedPipeline } from "./listeners/domain-event-pipeline.listener.js";
import { AccountSyncRepository } from "../repositories/account-sync.repository.js";
import { DomainEventBusinessRepository } from "../repositories/domain-event-business.repository.js";
import { CrmService } from "../services/crm.service.js";
import { DomainEventBusinessService } from "../services/domain-event-business.service.js";

export function registerEventBusListeners(bus: EventBus): void {
  const syncRepo = new AccountSyncRepository();
  const crm = new CrmService(syncRepo);
  const domainBusiness = new DomainEventBusinessService(new DomainEventBusinessRepository(), bus);
  registerDomainEventCreatedPipeline(bus, crm, domainBusiness);
  registerCrmWinningOfferListener(bus, WINNING_OFFER_SELECTED_TOPIC, crm);
}
