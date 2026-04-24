import { ACCOUNT_EVENT_CREATED, type AccountEventCreatedPayload } from "../account-events.js";
import type { EventBus } from "../event-bus.js";
import type { CrmSyncService } from "../../integration/crm/crm-sync.service.js";

export function registerCrmOnAccountEventCreated(
  bus: EventBus,
  crm: CrmSyncService
): void {
  bus.on(ACCOUNT_EVENT_CREATED, (payload: AccountEventCreatedPayload) => {
    void (async () => {
      try {
        await crm.handleAfterAccountEventCreated(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[crm] unexpected", msg);
      }
    })();
  });
}
