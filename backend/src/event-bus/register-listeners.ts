import type { EventBus } from "./event-bus.js";
import { WINNING_OFFER_SELECTED_TOPIC } from "./crm-integration-events.js";
import { registerCrmWinningOfferListener } from "./listeners/crm-integration.listener.js";
import { registerCrmOnAccountEventCreated } from "./listeners/crm-on-account-event-created.listener.js";
import { AccountSyncRepository } from "../repositories/account-sync.repository.js";
import { MockCrmApiClient } from "../integration/crm/mock-crm-api.client.js";
import { CrmSyncService } from "../integration/crm/crm-sync.service.js";

export function registerEventBusListeners(bus: EventBus): void {
  const syncRepo = new AccountSyncRepository();
  const crm = new CrmSyncService(syncRepo, new MockCrmApiClient());
  registerCrmOnAccountEventCreated(bus, crm);
  registerCrmWinningOfferListener(bus, WINNING_OFFER_SELECTED_TOPIC, crm);
}
